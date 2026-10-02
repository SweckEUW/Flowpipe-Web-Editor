import { defineConfig } from 'vite'

// Deployed to https://sweckeuw.github.io/Flowpipe-Web-Editor/
export default defineConfig({
  base: '/Flowpipe-Web-Editor/',
  // flowpipe-web-editor uses Vue as peer dependency. Without @vitejs/plugin-vue nothing defines
  // Vue's compile-time flags, and the editor fails with "__VUE_PROD_DEVTOOLS__ is not defined".
  define: {
    __VUE_OPTIONS_API__: 'true',
    __VUE_PROD_DEVTOOLS__: 'false',
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false'
  }
})
