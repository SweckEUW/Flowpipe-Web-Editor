import { exec } from 'node:child_process'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'

// Push changes via yalc after bundle completes
const yalcAutoPushPlugin = () => ({
  name: 'yalc-auto-push',
  closeBundle() {
    exec('yalc push --changed', (err, stdout) => {
      if (err) console.error('[yalc error]', err)
      if (stdout) console.log(stdout.trim())
    })
  }
})
 
export default defineConfig({
  plugins: [vue(), yalcAutoPushPlugin(), cssInjectedByJsPlugin()],
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'FlowpipeWebEditor',
      fileName: 'flowpipe-web-editor'
    },
    rollupOptions: {
      external: ['vue', 'primevue'],
      output: {
        globals: {
          vue: 'Vue'
        }
      }
    }
  }
})