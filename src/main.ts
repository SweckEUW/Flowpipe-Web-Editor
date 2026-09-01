import { createApp } from 'vue'
import PrimeVue from 'primevue/config'
import ToastService from 'primevue/toastservice'
import FlowpipePreset from './theme/preset'
import '@baklavajs/themes/dist/syrup-dark.css'
import 'primeicons/primeicons.css'
import './style.css'
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
