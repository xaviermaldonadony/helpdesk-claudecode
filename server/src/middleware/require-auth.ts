import type { RequestHandler } from 'express'
import { fromNodeHeaders } from 'better-auth/node'
import { auth } from '../auth'

// Rejects the request with 401 unless it carries a valid session cookie.
// On success, exposes the user and session on req for downstream handlers.
export const requireAuth: RequestHandler = async (req, res, next) => {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) })
  if (!session) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  req.user = session.user
  req.session = session.session
  next()
}
