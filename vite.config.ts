import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: '/BirStore/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons.svg'],
      manifest: {
        name: 'BirStore',
        short_name: 'BirStore',
        description: 'Depo operasyon sistemi',
        theme_color: '#1b1f27',
        background_color: '#1b1f27',
        display: 'standalone',
        scope: '/BirStore/',
        start_url: '/BirStore/',
        icons: [
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
        ],
      },
      workbox: {
        navigateFallback: '/BirStore/index.html',
        globPatterns: ['**/*.{js,css,html,svg,ico}'],
      },
    }),
  ],
})
