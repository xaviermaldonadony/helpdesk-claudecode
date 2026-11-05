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
  // Vite dev server origin; requests reach the API through its proxy.
  trustedOrigins: ['http://localhost:5173'],
})
