import { Outlet } from 'react-router'
import { NavBar } from './NavBar'

// Shared shell for signed-in pages: nav bar above the matched child route.
export function AppLayout() {
  return (
    <>
      <NavBar />
      <Outlet />
    </>
  )
}
