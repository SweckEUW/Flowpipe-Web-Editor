import { defineCustomElement } from 'vue'
import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'
import FlowPipeEditor from './components/FlowPipeEditor.vue'

export const FlowPipeEditorElement = defineCustomElement(FlowPipeEditor, {
  shadowRoot: false,
  configureApp(app) {
    app.use(PrimeVue, {
      theme: { preset: Aura }
    })
  }
})

export function registerFlowPipeEditor(tagName = 'flowpipe-editor') {
  if (!customElements.get(tagName)) {
    customElements.define(tagName, FlowPipeEditorElement)
  }
}

// Typen bleiben nützlich für TS-Konsumenten (React/Angular)
export type { SerializedFlowpipeNode, SerializedFlowpipeGraph } from './types/flowpipe'

declare global {
  interface HTMLElementTagNameMap {
    'flowpipe-editor': InstanceType<typeof FlowPipeEditorElement>
  }
}