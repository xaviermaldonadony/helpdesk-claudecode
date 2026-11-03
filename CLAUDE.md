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
- **Frontend, planned:** Tailwind CSS, React Router
- **Auth, planned:** database-backed sessions (Phase 2)
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

## Architecture

- The server exposes all HTTP routes under `/api`. Current route: `GET /api/health`.
- In development the client calls `/api/*` as a relative URL. Vite's `server.proxy` (`client/vite.config.ts`) forwards it to `http://localhost:3000`. Because of this the browser never makes a cross-origin request, so CORS is not configured.
- Server entry point: `server/src/index.ts`. It registers JSON parsing, routes, a 404 handler for unmatched `/api` requests, and an error handler.

## Conventions

- TypeScript strict mode everywhere. Avoid `any`.
- Server runs TypeScript directly with Bun. Do not add ts-node or nodemon.
- Do not add PostgreSQL, Prisma, Tailwind, React Router, or auth until the matching phase in `IMPLEMENTATION_PLAN.md` starts.
- Do not commit `.env` files or secrets. `.gitignore` excludes `.env*` except `.env.example`.

## Documentation lookup (Context7)

Always fetch current library documentation with the Context7 MCP tools (`resolve-library-id` then `query-docs`) before writing or changing code that depends on a library, framework, or CLI. This applies even to well-known tools, because training data can be out of date. Do not use Context7 for pure logic or for code that uses no library APIs.

Library IDs already verified for this project:

- Bun: `/oven-sh/bun` (use the `bun-v1.4.2` version for workspace and `--filter` questions)
- Express: `/expressjs/express` (v5.x)
- Vite: `/vitejs/vite` (v8.x)

## Current status

- Phase 1 (project setup) is complete except for PostgreSQL, which is deferred.
- Next phase: Phase 2, Authentication.
