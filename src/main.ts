// Local dev setup
import { createApp } from 'vue'
import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'
import 'primeicons/primeicons.css'
import '@baklavajs/themes/dist/syrup-dark.css'
import './style.css'

import App from './App.vue'

const app = createApp(App)

// Init PrimeVue
app.use(PrimeVue, {
  theme: {
    preset: Aura
  }
})

// Init services
app.mount('#app')