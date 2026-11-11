import express, { type NextFunction, type Request, type Response } from 'express'
import { toNodeHandler } from 'better-auth/node'
import { prisma } from './db'
import { auth } from './auth'
import { requireAuth } from './middleware/require-auth'

// Fail fast if the database is unreachable.
try {
  await prisma.$queryRaw`SELECT 1`
  console.log('Connected to PostgreSQL')
} catch (err) {
  console.error('Could not connect to PostgreSQL. Check DATABASE_URL in server/.env.', err)
  await prisma.$disconnect()
  process.exit(1)
}

const app = express()
const port = Number(process.env.PORT) || 3000

// Better Auth must be mounted before express.json() so it can read the raw request body.
app.all('/api/auth/*splat', toNodeHandler(auth))

app.use(express.json())

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.get('/api/me', requireAuth, (req: Request, res: Response) => {
  // Do not return req.session: it contains the bearer session token.
  res.json({ user: req.user })
})

// Unmatched API routes
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: `Not found: ${req.method} ${req.path}` })
})

// Error handler (Express 5 forwards rejected promises here automatically)
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
})

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`)
})
