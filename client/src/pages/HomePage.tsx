import { useSession } from '../lib/auth-client'

export function HomePage() {
  const { data: session } = useSession()

  return (
    <main className="page">
      <h1>Welcome{session ? `, ${session.user.name}` : ''}</h1>
      <p>Ticket management will appear here.</p>
    </main>
  )
}
