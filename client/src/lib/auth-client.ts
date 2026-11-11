import { createAuthClient } from 'better-auth/react'
import { inferAdditionalFields } from 'better-auth/client/plugins'
import type { auth } from '../../../server/src/auth'

// Relative base URL: in development the Vite proxy forwards /api/* to the server.
// Type-only import: infers the server-defined `role` field on session.user.
const authClient = createAuthClient({
  plugins: [inferAdditionalFields<typeof auth>()],
})

export const { signIn, signOut, useSession } = authClient
