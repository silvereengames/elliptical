import { createRouter, createWebHistory } from 'vue-router';
import home from '@/views/home.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: home
    },
    {
      path: '/admin',
      component: home
    },
    {
      path: '/:404',
      redirect: '/'
    }
  ]
})

export default router