import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'esnext',
    minify: 'esbuild'
  },
  esbuild: {
    jsx: 'automatic'
  },
  server: {
    host: '0.0.0.0', // Allows access from network (LAN)
    port: 5173, // Default Vite port
    strictPort: false, // Use next available port if 5173 is busy
    hmr: {
      overlay: false
    }
  },
})
