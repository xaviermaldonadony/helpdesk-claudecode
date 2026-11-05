import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { signIn, useSession } from '../lib/auth-client'

export function LoginPage() {
  const { data: session, isPending: sessionPending } = useSession()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (sessionPending) return <p className="status">Loading…</p>
  if (session) return <Navigate to="/" replace />

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const result = await signIn.email({ email, password })

    setSubmitting(false)
    if (result.error) {
      setError(result.error.message ?? 'Sign in failed')
      return
    }
    navigate('/', { replace: true })
  }

  return (
    <main className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1>Sign in to Helpdesk</h1>

        <label>
          Email
          <input
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>

        <label>
          Password
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        {error && <p role="alert" className="form-error">{error}</p>}

        <button type="submit" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </main>
  )
}
