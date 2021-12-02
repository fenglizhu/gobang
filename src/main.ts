import { createApp } from 'vue'
import App from './App.vue'

const app = createApp(App)
app.provide('app',app)
app.mount('#app')
