import '@baklavajs/themes/dist/syrup-dark.css'
import 'primeicons/primeicons.css'
import './style.css'

import FlowPipeEditor from './components/FlowPipeEditor.vue'
import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'
import type { App } from 'vue'

// Vue plugin setup
const FlowpipeEditorPlugin = {
  install(app: App) {
    if (!app) return

    // Init PrimeVue
    app.use(PrimeVue, {
      theme: {
        preset: Aura
      }
    })

    // Register component
    app.component('FlowPipeEditor', FlowPipeEditor)
  } 
}

// Export specific modules
export { FlowPipeEditor, FlowpipeEditorPlugin }

export type { FlowpipeNode, FlowpipeGraph } from './types/flowpipe.ts'