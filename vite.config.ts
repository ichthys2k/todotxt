import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png', 'icon.png'],
      manifest: {
        name: 'Todo.txt',
        short_name: 'TodoApp',
        description: 'Eine elegante, OneDrive-synchronisierte Todo.txt',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        start_url: './',
        scope: './',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        shortcuts: [
          {
            name: 'Aufgaben',
            short_name: 'Aufgaben',
            description: 'Öffne die Aufgabenliste',
            url: './',
            icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }]
          },
          {
            name: 'Dashboard',
            short_name: 'Dashboard',
            description: 'Öffne das Produktivitäts-Dashboard',
            url: './?view=dashboard',
            icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }]
          }
        ],
        widgets: [
          {
            name: 'Aufgaben',
            short_name: 'Aufgaben',
            description: 'Deine anstehenden Aufgaben aus todo.txt',
            tag: 'todotxt-tasks',
            template: 'todotxt-tasks-template',
            ms_ac_template: 'widgets/tasks-template.json',
            data: 'widgets/tasks-data.json',
            type: 'application/json',
            auth: false,
            update: 900,
            icons: [
              {
                src: 'pwa-192x192.png',
                sizes: '192x192',
                type: 'image/png'
              }
            ]
          }
        ]
      } as any,
      devOptions: {
        enabled: true,
        type: 'module'
      }
    })
  ],
})
