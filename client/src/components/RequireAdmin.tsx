import { Navigate, Outlet } from 'react-router'
import { Spinner } from '@/components/ui/spinner'
import { useSession } from '../lib/auth-client'

// Nested inside RequireAuth, so a session is present. Sends non-admins to the home page.
export function RequireAdmin() {
  const { data: session, isPending } = useSession()

  // Wait for the session to load so an admin is not redirected while it is still unknown.
  if (isPending) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Spinner className="size-8" />
      </div>
    )
  }
  if (session?.user.role !== 'admin') return <Navigate to="/" replace />

  return <Outlet />
}
