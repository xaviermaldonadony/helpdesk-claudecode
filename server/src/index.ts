import express, { type NextFunction, type Request, type Response } from 'express'

const app = express()
const port = Number(process.env.PORT) || 3000

app.use(express.json())

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
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
