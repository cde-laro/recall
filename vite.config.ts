import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: 'https://recall-cde.vercel.app',
  plugins: [react()],
})
