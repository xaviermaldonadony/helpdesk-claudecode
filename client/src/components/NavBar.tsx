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
    <nav className="flex items-center justify-between border-b border-gray-300 px-6 py-3">
      <span className="font-bold">Helpdesk</span>
      <div className="flex items-center gap-4">
        {session && <span>{session.user.name}</span>}
        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          className="cursor-pointer rounded bg-gray-900 px-4 py-2 text-white hover:bg-gray-700 disabled:cursor-default disabled:opacity-60"
        >
          {signingOut ? 'Signing out…' : 'Sign out'}
        </button>
      </div>
    </nav>
  )
}
