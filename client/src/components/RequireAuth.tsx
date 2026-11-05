import { Navigate, Outlet } from 'react-router'
import { useSession } from '../lib/auth-client'

// Layout route: renders its children only when a session exists.
export function RequireAuth() {
  const { data: session, isPending } = useSession()

  if (isPending) return <p className="status">Loading…</p>
  if (!session) return <Navigate to="/login" replace />

  return <Outlet />
}
