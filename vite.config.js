import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // In dev, forward /api to the Express server (server/index.js)
    proxy: { '/api': 'http://localhost:5000' },
  },
})
