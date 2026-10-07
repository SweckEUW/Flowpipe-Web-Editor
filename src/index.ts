import { defineCustomElement } from 'vue'
import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'
import Tooltip from 'primevue/tooltip'
import FlowPipeEditor from './components/FlowPipeEditor.vue'
import type { FlowPipeEditorProps } from './types/editor'

// Instanz von <flowpipe-editor>. Explizit typisiert, damit die Typdeklarationen nicht auf Vue verweisen
// (Vue ist ins Bundle gepackt und bei Konsumenten nicht installiert).
export type FlowPipeEditorHTMLElement = HTMLElement & FlowPipeEditorProps

export const FlowPipeEditorElement: { new (): FlowPipeEditorHTMLElement } = defineCustomElement(FlowPipeEditor, {
  shadowRoot: false,
  configureApp(app) {
    app.use(PrimeVue, {
      // Dark mode follows the "dark" class on <html> instead of the OS setting,
      // otherwise menus and popovers turn light on a light system theme
      theme: { preset: Aura, options: { darkModeSelector: '.dark' } }
    })
    app.directive('tooltip', Tooltip)
  }
})

export function registerFlowPipeEditor(tagName = 'flowpipe-editor') {
  if (!customElements.get(tagName)) {
    customElements.define(tagName, FlowPipeEditorElement)
  }
}

// Typen bleiben nützlich für TS-Konsumenten (React/Angular)
export type { SerializedFlowpipeNode, SerializedFlowpipeGraph } from './types/flowpipe'
export type { FlowPipeEditorProps } from './types/editor'

declare global {
  interface HTMLElementTagNameMap {
    'flowpipe-editor': FlowPipeEditorHTMLElement
  }
}
