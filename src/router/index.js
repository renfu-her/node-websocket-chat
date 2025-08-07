import Vue from 'vue'
import VueRouter from 'vue-router'
import MainApp from '../components/MainApp.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: MainApp
  },
  {
    path: '/register',
    name: 'Register',
    component: MainApp
  },
  {
    path: '/lobby',
    name: 'Lobby',
    component: MainApp,
    meta: { requiresAuth: true }
  },
  {
    path: '/room/:roomId',
    name: 'Room',
    component: MainApp,
    meta: { requiresAuth: true },
    props: true
  },
  {
    path: '/profile',
    name: 'Profile',
    component: MainApp,
    meta: { requiresAuth: true }
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

// Navigation guard to check authentication
router.beforeEach((to, from, next) => {
  // Check if route requires authentication
  if (to.matched.some(record => record.meta.requiresAuth)) {
    // Check if user is logged in (has token)
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    
    if (!token) {
      // Not logged in, redirect to login page
      next('/login')
    } else {
      // Logged in, allow access
      next()
    }
  } else {
    // Route doesn't require authentication, allow access
    next()
  }
})

export default router
