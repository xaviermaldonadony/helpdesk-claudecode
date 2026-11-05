import { useState } from 'react'
import { useNavigate } from 'react-router'
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
    <nav className="navbar">
      <span className="navbar-brand">Helpdesk</span>
      <div className="navbar-user">
        {session && <span>{session.user.name}</span>}
        <button type="button" onClick={handleSignOut} disabled={signingOut}>
          {signingOut ? 'Signing out…' : 'Sign out'}
        </button>
      </div>
    </nav>
  )
}
