import { defineConfig } from 'vite'
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
export default defineConfig(({ command }) => ({
  base: command === 'build' ? PROD_BASE : '/',
  plugins: [react()],
  server: {
    port: 5176,
    proxy: {
      '/api': {
        target: 'http://localhost:5005',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist/client'
  }
}))