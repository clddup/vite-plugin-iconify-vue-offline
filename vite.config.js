import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: './lib/main.js',
      name: 'iconify-vue-offline',
      fileName: 'iconify-vue-offline'
    },
    rollupOptions: {
      external: [
        'fast-glob',
        '@vue/compiler-sfc',
        '@iconify/utils',
        'node:fs',
        'node:path'
      ]
    }
  }
})
