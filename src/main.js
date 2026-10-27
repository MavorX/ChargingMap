import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import HomeView from './views/HomeView.vue'
import { initializeLocale } from './i18n'
import '@fortawesome/fontawesome-free/css/all.min.css'
// v4-shims 仍被使用：全站图标类名为 v4 语法（如 `fa fa-bell-o`、`fa fa-rmb`），
// 移除前须先整体迁移到 v6/v7 语义类名（见 .omo/evidence/task-28-optimize-chargingmap.md）。
import '@fortawesome/fontawesome-free/css/v4-shims.min.css'
import './assets/main.css'

// 路由配置
const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  }
]

const router = createRouter({
  // BASE_URL is "/" by default and "/ChargingMap/" for sub-path deploys; passing
  // it keeps the router in sync with Vite's configured base.
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

const pinia = createPinia()
initializeLocale()
const app = createApp(App)

app.use(pinia)
app.use(router)
app.mount('#app')
