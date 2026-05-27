import { createRouter, createWebHistory } from 'vue-router'
import Previewer from './views/Previewer.vue'

const routes = [
  { path: '/', name: 'home', component: Previewer },
  { path: '/s/:code', name: 'share', component: Previewer, props: true }
]

export default createRouter({
  history: createWebHistory(),
  routes
})
