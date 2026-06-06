import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: 'https://memochamp-cde.vercel.app',
  plugins: [react()],
})
