import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";

export default defineConfig({
  plugins: [vue(), cssInjectedByJsPlugin()],
  server: {
    open: true,
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'), // Einstiegspunkt deiner Library
      name: 'MyGraphComponent',                  // Globaler Name (für UMD/IIFE)
      fileName: 'my-graph-component',            // Dateipräfix der Outputs
    },
    rollupOptions: {
      // Vue soll extern bleiben, damit das Hauptprojekt seine eigene Vue-Instanz nutzt
      external: ['vue'],
      output: {
        globals: {
          vue: 'Vue',
        },
      },
    },
  },
})
