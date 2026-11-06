import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  // No VITE_ prefix on purpose: the server address stays out of the browser bundle.
  const { API_PROXY_TARGET: target } = loadEnv(mode, process.cwd(), '')
  // The server's CORS rules do not allow the token header yet, so local runs go through a proxy.
  const proxy = target ? { '/api': { target, changeOrigin: true } } : undefined

  return {
    plugins: [react(), tailwindcss()],
    server: { proxy },
    preview: { proxy },
  }
})
