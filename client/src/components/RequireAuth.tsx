import { Navigate, Outlet } from 'react-router'
import { Spinner } from '@/components/ui/spinner'
import { useSession } from '../lib/auth-client'

// Layout route: renders its children only when a session exists.
export function RequireAuth() {
  const { data: session, isPending } = useSession()

  if (isPending) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Spinner className="size-8" />
      </div>
    )
  }
  if (!session) return <Navigate to="/login" replace />

  return <Outlet />
}
