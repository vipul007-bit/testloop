import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'OmniShield v2.0 — Multi-Role Healthcare Platform',
        short_name: 'OmniShield',
        description: 'Privacy-preserving multi-role healthcare surveillance and clinical decision support platform',
        theme_color: '#2563eb',
        background_color: '#f0f4f8',
        display: 'standalone',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            // Network-first with stale-while-revalidate for API stats
            urlPattern: /\/api\/v1\/surveillance\/stats/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-stats-cache',
              expiration: { maxAgeSeconds: 60 },
              networkTimeoutSeconds: 4,
            },
          },
          {
            // Cache-first for static assets
            urlPattern: /\.(?:js|css|woff2|png|svg)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'static-assets',
              expiration: { maxEntries: 60, maxAgeSeconds: 30 * 24 * 60 * 60 },
            },
          },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:4000', changeOrigin: true },
      '/ws':  { target: 'ws://localhost:4000',  ws: true },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
