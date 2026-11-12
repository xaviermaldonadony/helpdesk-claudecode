import { betterAuth } from 'better-auth'
import { createAuthMiddleware } from 'better-auth/api'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { prisma } from './db'
import { Role } from './generated/prisma/enums'

// Placeholder value copied from server/.env.example. Refuse to start with it.
const SECRET_PLACEHOLDER = 'replace-with-output-of-openssl-rand-base64-32'

const secret = process.env.BETTER_AUTH_SECRET
if (!secret || secret === SECRET_PLACEHOLDER) {
  throw new Error(
    'BETTER_AUTH_SECRET must be set to a real value in server/.env (openssl rand -base64 32)',
  )
}

const baseURL = process.env.BETTER_AUTH_URL
if (!baseURL) {
  throw new Error('BETTER_AUTH_URL must be set in server/.env')
}

export const auth = betterAuth({
  secret,
  baseURL,
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  emailAndPassword: { enabled: true, disableSignUp: true },
  // Limits apply only when NODE_ENV is "production". Dev and the e2e run leave it unset
  // or set it to "test", so tests don't hit the limit.
  // Stored in memory, so limits are per server instance. Use storage: 'database'
  // when running more than one instance.
  rateLimit: {
    enabled: process.env.NODE_ENV === 'production',
    window: 60,
    max: 100,
    customRules: {
      // Tighter limit on password attempts to slow online guessing.
      '/sign-in/email': { window: 60, max: 10 },
    },
  },
  hooks: {
    // Remove session tokens from every auth response body. The session cookie is
    // the only credential the client needs, so the bearer token must not reach JavaScript.
    after: createAuthMiddleware(async (ctx) => {
      ctx.context.returned = stripSessionTokens(ctx.context.returned)
    }),
  },
  user: {
    additionalFields: {
      role: {
        type: Object.values(Role),
        required: false,
        defaultValue: Role.agent,
        // Server-owned: clients cannot set their own role.
        input: false,
      },
    },
  },
  trustedOrigins: trustedOrigins(),
})

// Returns a copy of a response body with `token` removed from the top-level object,
// from `session`, and from each item of an array (such as a list of sessions).
// Only plain objects and arrays are changed; other responses pass through as-is.
function stripSessionTokens(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stripSessionTokens)
  }
  if (!isPlainObject(value)) {
    return value
  }
  const { token: _token, session, ...rest } = value
  return session === undefined ? rest : { ...rest, session: stripSessionTokens(session) }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    Object.getPrototypeOf(value) === Object.prototype
  )
}

// Comma-separated list, e.g. TRUSTED_ORIGINS="http://localhost:5173".
function trustedOrigins(): string[] {
  const origins = (process.env.TRUSTED_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)

  if (origins.length === 0) {
    throw new Error('TRUSTED_ORIGINS must be set in server/.env')
  }
  return origins
}
