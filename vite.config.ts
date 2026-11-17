import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

/*
 * Aplikasi ini dilayani pada AKAR domainnya (lppm.unusu.ac.id), bukan di
 * sub-path. Sebelumnya build memakai awalan `/lppm/` sementara nginx
 * memetakan host ke upstream yang melayani akar. Akibatnya halaman callback
 * SSO (`/sso/callback`, persis seperti `urlRedirect` di database ONE) tidak
 * pernah cocok dengan rute router yang ber-basename `/lppm`. Awalan
 * dikembalikan ke akar agar aset, rute, dan `urlRedirect` berbentuk sama.
 */
const PROD_BASE = '/'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const port = Number(env.DEV_PORT || 5176)
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('DEV_PORT must be an integer between 1 and 65535')
  return {
  base: command === 'build' ? PROD_BASE : '/',
  plugins: [react()],
  server: {
    port,
    strictPort: true,
    proxy: {
      '/api': {
        target: env.DEV_API_TARGET || 'http://localhost:5005',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist/client'
  }
  }
})
