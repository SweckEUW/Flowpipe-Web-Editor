import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    cssInjectedByJsPlugin(),
    // Erzeugt die Typdeklarationen fuer das Paket (auch im --watch Modus).
    dts({
      tsconfigPath: './tsconfig.json',
      include: ['src'],
      insertTypesEntry: true,
      cleanVueFileName: true,
    }),
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