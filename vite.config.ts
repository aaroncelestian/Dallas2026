import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Relative base so the built folder works from USB / local disk / any host path.
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    // iCloud Drive + FSEvents can accept TCP and never answer HTTP.
    watch: null,
    preTransformRequests: false,
  },
  preview: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
  },
})
