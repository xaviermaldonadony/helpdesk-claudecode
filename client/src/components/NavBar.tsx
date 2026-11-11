import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { signOut, useSession } from '../lib/auth-client'

export function NavBar() {
  const { data: session } = useSession()
  const navigate = useNavigate()
  const [signingOut, setSigningOut] = useState(false)

  async function handleSignOut() {
    setSigningOut(true)
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <nav className="flex items-center justify-between border-b border-gray-300 px-6 py-3">
      <div className="flex items-center gap-6">
        <span className="font-bold">Helpdesk</span>
        {session?.user.role === 'admin' && (
          <NavLink
            to="/users"
            className={({ isActive }) => (isActive ? 'font-semibold underline' : 'hover:underline')}
          >
            Users
          </NavLink>
        )}
      </div>
      <div className="flex items-center gap-4">
        {session && <span>{session.user.name}</span>}
        <Button type="button" onClick={handleSignOut} disabled={signingOut}>
          {signingOut ? 'Signing out…' : 'Sign out'}
        </Button>
      </div>
    </nav>
  )
}
