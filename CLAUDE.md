# Helpdesk — Project Memory

AI-powered ticket management system. Product scope: `project-scope.md`. Stack: `tech-stack.md`. Roadmap and progress: `IMPLEMENTATION_PLAN.md` (check off items as they are completed).

## Structure

```
client/   React + TypeScript SPA (Vite 8)
server/   Express 5 + TypeScript API (runs on Bun)
```

- Bun workspaces are declared in the root `package.json` (`client`, `server`).
- Workspace package names: `client` and `helpdesk-server`.
- Shared TS settings: `tsconfig.base.json`. The server extends it. The client has its own `client/tsconfig.app.json` and does not extend the base.

## Tech stack

Source of truth: `tech-stack.md`. Status below reflects what is installed today.

- **Runtime and tooling (in use):** Bun 1.4 (runtime, package manager, workspaces), TypeScript 7 (strict), oxlint (client lint)
- **Frontend (in use):** React 19 with TypeScript, built and served by Vite 8 (`@vitejs/plugin-react`)
- **Backend (in use):** Express 5 with TypeScript, run directly by Bun
- **Frontend routing (in use):** React Router 8 in declarative mode (`BrowserRouter` in `client/src/main.tsx`, routes in `client/src/App.tsx`)
- **Frontend forms (in use):** React Hook Form with zod 4 schemas through `@hookform/resolvers/zod` (login form in `client/src/pages/LoginPage.tsx`)
- **Frontend styling (in use):** Tailwind CSS v4 with `@tailwindcss/vite` (plugin in `client/vite.config.ts`, import in `client/src/index.css`). All styling is Tailwind utility classes; do not add custom CSS.
- **Auth (in use):** Better Auth with email/password and database-backed sessions (`server/src/auth.ts`, Prisma adapter). Login, sign-up, and logout are served by Better Auth under `/api/auth/*`. `requireAuth` middleware protects server routes. The client uses `authClient` (`client/src/lib/auth-client.ts`, `better-auth/react`): `RequireAuth` guards the app routes, `RequireAdmin` guards admin-only routes, `/login` is the sign-in page, and `NavBar` shows the user's name, an admin-only "Users" link, and sign-out.
- **Database (in use):** PostgreSQL (local, database `helpdesk`) with Prisma 7 ORM and the `@prisma/adapter-pg` driver adapter. Models are added per phase.
- **AI, planned:** Claude API (Anthropic) for ticket classification, summaries, and suggested replies (Phase 5)
- **Email, planned:** SendGrid or Mailgun for inbound webhooks and outbound replies (Phase 6)
- **Deployment, planned:** Docker, with a cloud provider such as AWS, Railway, or Fly.io (Phase 8)

## Commands

Run from the repo root unless noted:

- `bun install`: install all workspace dependencies
- `bun run dev`: start server (:3000) and client (:5173) in parallel
- `bun run typecheck`: type-check both packages
- `bun run build`: build server and client
- Single package: `bun run --filter helpdesk-server <script>` or `bun run --filter client <script>`
- Seed the admin user: `cd server && bun x prisma db seed`. The command is set in `server/prisma.config.ts` (`migrations.seed`). It reads `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` from `server/.env` and is idempotent. Sign-up is disabled, so this is the only way to create the first user.

## Architecture

- The server exposes all HTTP routes under `/api`. Current routes: `GET /api/health`, `GET /api/me` (requires a session), and the Better Auth handler at `/api/auth/*`.
- Protect a route by adding `requireAuth` (`server/src/middleware/require-auth.ts`) before its handler. It returns 401 without a session and sets the typed `req.user` / `req.session` (augmentation in `server/src/types/express.d.ts`).
- The Better Auth handler is mounted before `express.json()` in `server/src/index.ts`. Keep it that way.
- Auth config lives in `server/src/auth.ts`. `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` are read from `server/.env`. Email/password sign-up is disabled (`disableSignUp: true`).
- Users have a `role` (`admin` or `agent`, default `agent`) on the Prisma `User` model and in the Better Auth user object (`additionalFields.role` in `server/src/auth.ts`). It is `input: false`, so clients cannot set it. Only the seed script or the server can change it.
- Seed script: `server/prisma/seed.ts`. It writes the user and credential account directly with `hashPassword` from `better-auth/crypto`, because the sign-up route is disabled.
- In development the client calls `/api/*` as a relative URL. Vite's `server.proxy` (`client/vite.config.ts`) forwards it to `http://localhost:3000`. Because of this the browser never makes a cross-origin request, so CORS is not configured.
- Server entry point: `server/src/index.ts`. It registers JSON parsing, routes, a 404 handler for unmatched `/api` requests, and an error handler.

## Authentication

Better Auth handles sessions. The browser holds a cookie, and the server checks it on each request.

- **Server env (`server/.env`):** `DATABASE_URL`, `BETTER_AUTH_SECRET` (random, from `openssl rand -base64 32`), `BETTER_AUTH_URL` (`http://localhost:3000`), `TRUSTED_ORIGINS` (comma-separated; must include `http://localhost:5173`), and `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` for the seed. `auth.ts` throws at startup if `TRUSTED_ORIGINS` is empty.
- **Why `TRUSTED_ORIGINS` matters:** the browser sends `Origin: http://localhost:5173` through the Vite proxy. Better Auth rejects auth requests from origins it doesn't trust, so a missing entry breaks sign-in.
- **Endpoints (served by Better Auth):** `POST /api/auth/sign-in/email`, `POST /api/auth/sign-out`, `GET /api/auth/get-session`. Sign-up is disabled (`disableSignUp: true`).
- **Data model (Prisma):** `User` (with `role`), `Session` (token, expiry, user), `Account` (holds the password hash for `providerId: credential`), and `Verification`. Users are created only by the seed script.
- **Server protection:** `requireAuth` calls `auth.api.getSession` with `fromNodeHeaders(req.headers)`. It returns 401 when there is no session, and otherwise sets `req.user` and `req.session` (typed in `server/src/types/express.d.ts`). Use `requireAuth` on every new `/api` route that needs a signed-in user.
- **Client flow:** `LoginPage` calls `signIn.email` and shows the server's error message in an `Alert`. `RequireAuth` uses `useSession()` to show a spinner while the session loads, then redirects to `/login` if there is no session. `RequireAdmin` (nested inside `RequireAuth`) shows the same spinner while the session loads, then redirects non-admins to `/`. `NavBar` calls `signOut()`.
- **Roles:** `admin` and `agent`, default `agent`. The only admin-only page so far is `/users` (`client/src/pages/UsersPage.tsx`, a placeholder heading). That check is client-side only. Server-side role checks are not implemented yet (Phase 3).

## Conventions

- TypeScript strict mode everywhere (`strict: true` in both tsconfig files). Avoid `any`.
- Server runs TypeScript directly with Bun. Do not add ts-node or nodemon.
- Style with Tailwind utility classes only. Do not write custom CSS or add CSS files beyond `client/src/index.css`, which only contains `@import "tailwindcss";`.
- Client auth goes through `authClient` in `client/src/lib/auth-client.ts`. Do not call `/api/auth/*` with raw `fetch`.
- Do not commit `.env` files or secrets. `.gitignore` excludes `.env*` except `.env.example`.

## Documentation lookup (Context7)

Always fetch current library documentation with the Context7 MCP tools (`resolve-library-id` then `query-docs`) before writing or changing code that depends on a library, framework, or CLI. This applies even to well-known tools, because training data can be out of date. Do not use Context7 for pure logic or for code that uses no library APIs.

Library IDs already verified for this project:

- Bun: `/oven-sh/bun` (use the `bun-v1.4.2` version for workspace and `--filter` questions)
- Express: `/expressjs/express` (v5.x)
- Vite: `/vitejs/vite` (v8.x)
- Better Auth: `/better-auth/better-auth` (type inference, additional fields, `strict` requirement)

## Current status

- Phase 1 (project setup) is complete.
- Phase 2 (Authentication) is in progress: Better Auth email/password sign-in, sign-out, database sessions, the login page, frontend route protection, and the admin-only `/users` route with a nav link are done. Sign-up is disabled, and an admin user is created with the seed script. Remaining: server-side role-based access control (Phase 3) and the agent seed user.
