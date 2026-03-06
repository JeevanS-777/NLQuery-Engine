import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// REMOVED: import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  plugins: [
    react(),
    // REMOVED: basicSsl()
  ],
  server: {
    // REMOVED: https: true,
    port: 3000,
    proxy: {
      '/ingest': 'http://127.0.0.1:8000',
      '/data': 'http://127.0.0.1:8000',
      '/health': 'http://127.0.0.1:8000',
      '/chat': 'http://127.0.0.1:8000',
      '/voice': 'http://127.0.0.1:8000'
    }
  }
})
