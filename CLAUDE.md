# Helpdesk — Project Memory

AI-powered ticket management system. Product scope: `project-scope.md`. Stack: `tech-stack.md`. Roadmap and progress: `IMPLEMENTATION_PLAN.md` (check off items as they are completed).

## Structure

```
client/   React + TypeScript SPA (Vite 8)
server/   Express 5 + TypeScript API (runs on Bun)
```

- Bun workspaces are declared in the root `package.json` (`client`, `server`).
- Workspace package names: `client` and `helpdesk-server`.
- Shared TS settings: `tsconfig.base.json`. Each package extends it.

## Tech stack

Source of truth: `tech-stack.md`. Status below reflects what is installed today.

- **Runtime and tooling (in use):** Bun 1.4 (runtime, package manager, workspaces), TypeScript 7 (strict), oxlint (client lint)
- **Frontend (in use):** React 19 with TypeScript, built and served by Vite 8 (`@vitejs/plugin-react`)
- **Backend (in use):** Express 5 with TypeScript, run directly by Bun
- **Frontend routing (in use):** React Router 8 in declarative mode (`BrowserRouter` in `client/src/main.tsx`, routes in `client/src/App.tsx`)
- **Frontend forms (in use):** React Hook Form with zod 4 schemas through `@hookform/resolvers/zod` (login form in `client/src/pages/LoginPage.tsx`)
- **Frontend, planned:** Tailwind CSS
- **Auth (in use):** Better Auth with email/password and database-backed sessions (`server/src/auth.ts`, Prisma adapter). Login, sign-up, and logout are served by Better Auth under `/api/auth/*`. `requireAuth` middleware protects server routes. The client uses `authClient` (`client/src/lib/auth-client.ts`, `better-auth/react`): `RequireAuth` guards the app routes, `/login` is the sign-in page, and `NavBar` shows the user's name with sign-out.
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
- Users have a `role` (`admin` or `agent`, default `agent`) on the Prisma `User` model and in the Better Auth user object. It is `input: false`, so clients cannot set it. Only the seed script or the server can change it.
- Seed script: `server/prisma/seed.ts`. It writes the user and credential account directly with `hashPassword` from `better-auth/crypto`, because the sign-up route is disabled.
- In development the client calls `/api/*` as a relative URL. Vite's `server.proxy` (`client/vite.config.ts`) forwards it to `http://localhost:3000`. Because of this the browser never makes a cross-origin request, so CORS is not configured.
- Server entry point: `server/src/index.ts`. It registers JSON parsing, routes, a 404 handler for unmatched `/api` requests, and an error handler.

## Conventions

- TypeScript strict mode everywhere. Avoid `any`.
- Server runs TypeScript directly with Bun. Do not add ts-node or nodemon.
- Do not add Tailwind until the matching phase in `IMPLEMENTATION_PLAN.md` starts.
- Client auth goes through `authClient` in `client/src/lib/auth-client.ts`. Do not call `/api/auth/*` with raw `fetch`.
- Do not commit `.env` files or secrets. `.gitignore` excludes `.env*` except `.env.example`.

## Documentation lookup (Context7)

Always fetch current library documentation with the Context7 MCP tools (`resolve-library-id` then `query-docs`) before writing or changing code that depends on a library, framework, or CLI. This applies even to well-known tools, because training data can be out of date. Do not use Context7 for pure logic or for code that uses no library APIs.

Library IDs already verified for this project:

- Bun: `/oven-sh/bun` (use the `bun-v1.4.2` version for workspace and `--filter` questions)
- Express: `/expressjs/express` (v5.x)
- Vite: `/vitejs/vite` (v8.x)

## Current status

- Phase 1 (project setup) is complete.
- Phase 2 (Authentication) is in progress: Better Auth email/password sign-in, sign-out, database sessions, the login page, and frontend route protection are done. Sign-up is disabled, and an admin user is created with the seed script. Remaining: role-based access control.
