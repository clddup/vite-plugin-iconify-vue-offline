import { defineConfig } from 'vite'
import Icon from './lib/main'
export default defineConfig({
  plugins: [
    Icon()
  ],
  build: {
    rollupOptions: {
      external: ['@iconify/iconify']
    }
  }
})