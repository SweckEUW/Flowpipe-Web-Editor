import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    cssInjectedByJsPlugin(),
  ],
  build: {
    sourcemap: true,
    lib: {
      entry: 'src/index.ts',
      name: 'FlowpipeWebEditor',
      fileName: 'flowpipe-web-editor'
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        exports: 'named',
        globals: {
          vue: 'Vue'
        }
      }
    }
  }
})