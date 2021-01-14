import { createApp } from 'vue'
import App from './App.vue'
import store from './store'
import axios from 'axios';

window.BACKEND_ENDPOINT = process.env.VUE_APP_BACKEND_ENDPOINT;
axios.defaults.baseURL = window.BACKEND_ENDPOINT;

createApp(App).use(store).mount('#app')
