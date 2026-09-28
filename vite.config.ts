import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  // Without these the app falls back to a demo mode where any email opens
  // the admin panel and answers aren't saved, so never ship a build like that.
  if (command === 'build') {
    const env = { ...loadEnv(mode, process.cwd(), 'VITE_'), ...process.env }
    const missing = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'].filter((key) => !env[key])
    if (missing.length > 0) {
      throw new Error(
        `Missing environment variables: ${missing.join(', ')}. ` +
          'Set them in Vercel > Project > Settings > Environment Variables (or .env.local for local builds).',
      )
    }
  }

  return {
    plugins: [react()],
  }
})
