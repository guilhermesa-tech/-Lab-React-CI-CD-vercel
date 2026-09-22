import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __IS_VERCEL__: JSON.stringify(process.env.VERCEL === '1'),
    __VERCEL_ENV__: JSON.stringify(process.env.VERCEL_ENV || 'local'),
    __DEPLOY_VERSION__: JSON.stringify(process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'local'),
    __VERCEL_GIT_COMMIT_REF__: JSON.stringify(process.env.VERCEL_GIT_COMMIT_REF || 'local'),
    __BUILD_TIMESTAMP__: JSON.stringify(new Date().toISOString()),
  },
})
