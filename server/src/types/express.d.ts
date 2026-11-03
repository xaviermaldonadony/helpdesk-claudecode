import type { auth } from '../auth'

type AuthSession = typeof auth.$Infer.Session

// Typed req.user / req.session, set by requireAuth.
declare global {
  namespace Express {
    interface Request {
      user?: AuthSession['user']
      session?: AuthSession['session']
    }
  }
}
