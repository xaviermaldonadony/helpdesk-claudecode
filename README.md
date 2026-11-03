# Helpdesk

AI-powered ticket management system. See `project-scope.md` for the product scope, `tech-stack.md` for the stack, and `IMPLEMENTATION_PLAN.md` for the roadmap.

## Structure

```
client/   React + TypeScript app (Vite)
server/   Express 5 + TypeScript API (runs on Bun)
```

Bun workspaces link both packages from the root `package.json`.

## Requirements

- [Bun](https://bun.sh) 1.4+

## Getting started

```sh
bun install
bun run dev
```

- API: http://localhost:3000 (`GET /api/health`)
- Client: http://localhost:5173 (proxies `/api` to the server)

## Scripts (run from the repo root)

| Command             | What it does                                  |
| ------------------- | --------------------------------------------- |
| `bun run dev`       | Starts the server and client in parallel      |
| `bun run build`     | Builds the server and the client              |
| `bun run typecheck` | Type-checks the server and the client         |

Each workspace also has its own scripts; run them with `bun run --filter helpdesk-server <script>` or `bun run --filter client <script>`.
