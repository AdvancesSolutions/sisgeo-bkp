import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiTarget =
    env.PROXY_API_TARGET || env.VITE_PROXY_API_TARGET || 'http://localhost:3000';

  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg'],
        manifest: {
          name: 'SIGEO - Gestão de Limpeza',
          short_name: 'SIGEO',
          description: 'Sistema de gestão operacional de limpeza',
          theme_color: '#0ea5e9',
          background_color: '#0f172a',
          display: 'standalone',
          icons: [
            { src: '/vite.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/.*\/api\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                expiration: { maxEntries: 50, maxAgeSeconds: 300 },
                cacheableResponse: { statuses: [0, 200] },
                networkTimeoutSeconds: 10,
              },
            },
          ],
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
      dedupe: ['react', 'react-dom', 'react/jsx-runtime'],
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'react/jsx-runtime'],
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          secure: apiTarget.startsWith('https'),
          rewrite: (p) => p.replace(/^\/api/, ''),
        },
        '/socket.io': {
          target: apiTarget,
          ws: true,
        },
        '/uploads': {
          target: apiTarget,
        },
      },
    },
  };
});
