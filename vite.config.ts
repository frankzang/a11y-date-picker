/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    setupFiles: 'src/setupTests.js',
    environment: 'jsdom',
    reporters: 'verbose',
    globals: true,
  },
})
