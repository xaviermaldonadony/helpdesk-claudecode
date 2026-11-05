import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { prisma } from './db'
import { Role } from './generated/prisma/enums'

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  emailAndPassword: { enabled: true, disableSignUp: true },
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
