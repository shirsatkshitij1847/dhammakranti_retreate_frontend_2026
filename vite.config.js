import react from '@vitejs/plugin-react'
import process from 'node:process'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const base = env.VITE_APP_BASE_PATH
  if (!base || !base.startsWith('/') || !base.endsWith('/')) {
    throw new Error('Set VITE_APP_BASE_PATH to a path starting and ending with / in .env.')
  }
  for (const key of ['VITE_API_BASE_URL', 'VITE_FONTS_API_URL', 'VITE_FONTS_STATIC_URL']) {
    if (!env[key] || !/^https?:$/.test(new URL(env[key]).protocol)) {
      throw new Error(`Set ${key} to an HTTP or HTTPS URL in .env.`)
    }
  }
  return {
    base,
    plugins: [react()],
  }
})
