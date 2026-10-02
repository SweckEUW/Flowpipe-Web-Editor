import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'
import dts from 'vite-plugin-dts'

export default defineConfig(({ mode }) => ({
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
  // Vue wird mitgebundelt. Vite ersetzt process.env im Library-Mode nicht, ohne diese Zeile
  // greift der Vue-Code zur Laufzeit auf das im Browser nicht vorhandene `process` zu.
  define: {
    'process.env.NODE_ENV': JSON.stringify(mode)
  },
  build: {
    sourcemap: true,
    lib: {
      entry: 'src/index.ts',
      name: 'FlowpipeWebEditor',
      formats: ['es', 'umd'],
      fileName: 'flowpipe-web-editor'
    },
    rollupOptions: {
      output: {
        exports: 'named'
      }
    }
  }
}))
