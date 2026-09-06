import { createApp } from 'vue'
import PrimeVue from 'primevue/config'
import ToastService from 'primevue/toastservice'
import FlowpipePreset from './theme/preset'
import App from './App.vue'

const app = createApp(App)

app.use(ToastService)
app.use(PrimeVue, {
  theme: {
    preset: FlowpipePreset,
    options: {
      darkModeSelector: '.dark',
      cssLayer: false,
    },
  },
})

app.mount('#app')
