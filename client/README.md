# Helpdesk client

React + TypeScript single-page app, built with Vite 8. It is part of the `helpdesk` Bun workspace; see the root `README.md` for how to run the full project.

## Scripts

Run from this directory, or from the root with `bun run --filter client <script>`:

| Script       | What it does                                                 |
| ------------ | ------------------------------------------------------------ |
| `dev`        | Starts the Vite dev server on http://localhost:5173          |
| `build`      | Type-checks (`tsc -b`) and produces a production bundle      |
| `typecheck`  | Type-checks without emitting files                           |
| `lint`       | Runs oxlint                                                  |
| `preview`    | Serves the production build locally                          |

## API calls

The client calls the server with relative URLs such as `fetch('/api/health')`. In development, `vite.config.ts` proxies `/api` to the Express server on http://localhost:3000, so no CORS setup is needed.

## Linting

Lint rules live in `.oxlintrc.json`. The React rules-of-hooks check is enabled, and the React-refresh export check is set to warn.
