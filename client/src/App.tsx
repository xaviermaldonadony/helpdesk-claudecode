import { useEffect, useState } from 'react'

type HealthResponse = {
  status: string
  timestamp: string
}

type HealthState =
  | { kind: 'loading' }
  | { kind: 'ok'; data: HealthResponse }
  | { kind: 'error'; message: string }

function App() {
  const [health, setHealth] = useState<HealthState>({ kind: 'loading' })

  useEffect(() => {
    const controller = new AbortController()

    fetch('/api/health', { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = (await res.json()) as HealthResponse
        setHealth({ kind: 'ok', data })
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        const message = err instanceof Error ? err.message : 'Unknown error'
        setHealth({ kind: 'error', message })
      })

    return () => controller.abort()
  }, [])

  return (
    <main>
      <h1>Helpdesk</h1>
      <h2>API health</h2>
      {health.kind === 'loading' && <p>Checking API…</p>}
      {health.kind === 'ok' && (
        <p>
          Status: <strong>{health.data.status}</strong> at{' '}
          <time dateTime={health.data.timestamp}>{health.data.timestamp}</time>
        </p>
      )}
      {health.kind === 'error' && (
        <p role="alert">Could not reach the API: {health.message}</p>
      )}
    </main>
  )
}

export default App
