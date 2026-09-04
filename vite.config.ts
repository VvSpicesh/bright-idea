import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  const base = mode === 'production' ? '/bright-idea/' : '/'

  return {
    base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'bright-idea',
        short_name: 'bright-idea',
        description: '计算过程透明的小六壬工具',
        lang: 'zh-CN',
        start_url: base,
        scope: base,
        display: 'standalone',
        theme_color: '#f4efe6',
        background_color: '#f4efe6',
        icons: [
          {
            src: `${base}favicon.svg`,
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
    }),
    ],
  }
})
