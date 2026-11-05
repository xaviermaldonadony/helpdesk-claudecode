import { createAuthClient } from 'better-auth/react'

// Relative base URL: in development the Vite proxy forwards /api/* to the server.
const authClient = createAuthClient()

export const { signIn, signOut, useSession } = authClient
