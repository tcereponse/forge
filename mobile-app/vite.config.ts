import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    crossOriginLoading: false,
    // Output to the Next.js public/mobile/ folder so the mobile app is served
    // same-origin at /mobile/index.html — relative /api/... calls reach the backend.
    outDir: '../public/mobile',
    emptyOutDir: true,
  },
})
