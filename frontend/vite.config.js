import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// /api y /storage se envían al backend Laravel (php artisan serve en 127.0.0.1:8000).
// Así el navegador ve un solo origen y el backend no queda expuesto directamente a la red.
const backend = process.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000'
const proxy = {
  '/api': backend,
  '/storage': backend,
}

// Puerto fijo para abrir la app desde tablets y celulares de la red local:
// http://<IP-de-este-computador>:8090
const lan = {
  host: '0.0.0.0',
  port: 8090,
  strictPort: true,
  proxy,
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: lan, // npm run dev
  preview: lan, // npm run restaurante (versión compilada)
})
