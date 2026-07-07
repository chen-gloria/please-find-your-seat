import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// IMPORTANT: `base` must match the GitHub repo name so that assets load
// correctly on GitHub Pages (https://<user>.github.io/<repo>/).
// If you later use a custom domain, change this to '/'.
export default defineConfig({
  base: '/please-find-your-seat/',
  plugins: [react()],
})
