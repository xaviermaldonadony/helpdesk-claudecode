import { useSession } from '../lib/auth-client'

export function HomePage() {
  const { data: session } = useSession()

  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold">Welcome{session ? `, ${session.user.name}` : ''}</h1>
      <p className="mt-2">Ticket management will appear here.</p>
    </main>
  )
}
