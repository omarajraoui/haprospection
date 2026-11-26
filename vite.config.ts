import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import manifest from './package.json' with { type: 'json' }
import { localApi } from './server/local-api.ts'

export default defineConfig({
  plugins: [tailwindcss(), localApi(manifest.version)],
  server: { host: '127.0.0.1' },
  preview: { host: '127.0.0.1' },
})
