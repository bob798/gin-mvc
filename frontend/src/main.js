import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { i18n } from './composables/useI18n'
import { applyStoredTheme } from './composables/useTheme'
import './styles/app.css'
import 'github-markdown-css/github-markdown.css'
import 'highlight.js/styles/github.css'

applyStoredTheme()

const app = createApp(App)
app.use(router)
app.provide('i18n', i18n)
app.mount('#app')
