/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        // Precache the Latin font files so the app keeps its typeface offline.
        globPatterns: ['**/*.{js,css,html,svg}', '**/*-latin-*.woff2'],
      },
      manifest: {
        name: 'Memento Mori',
        short_name: 'Memento Mori',
        description: 'A quiet reminder of the time you have left.',
        display: 'standalone',
        start_url: '/',
        // Colors and icons are set once the theme is decided.
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
