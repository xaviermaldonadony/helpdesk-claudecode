import type { RequestHandler } from 'express'
import { Role } from '../generated/prisma/enums'

// Use after requireAuth. Rejects with 401 if there is no user on req, and 403 if
// the signed-in user is not an admin. Use on every admin-only route.
export const requireAdmin: RequestHandler = (req, res, next) => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  if (req.user.role !== Role.admin) {
    res.status(403).json({ error: 'Forbidden' })
    return
  }
  next()
}
