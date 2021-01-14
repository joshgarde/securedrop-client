import { createApp } from 'vue'
import App from './App.vue'
import store from './store'

window.BACKEND_ENDPOINT = process.env.VUE_APP_BACKEND_ENDPOINT;

createApp(App).use(store).mount('#app')
