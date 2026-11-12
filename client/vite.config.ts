import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// VITE_DEV_PORT and API_PROXY_TARGET let the Playwright e2e run use its own ports
// (see e2e/playwright.config.ts). Normal development uses the defaults.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: Number(process.env.VITE_DEV_PORT) || 5173,
    strictPort: Boolean(process.env.VITE_DEV_PORT),
    proxy: {
      // Forward API calls to the Express server during development.
      '/api': {
        target: process.env.API_PROXY_TARGET ?? 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
