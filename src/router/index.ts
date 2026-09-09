import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '../layouts/MainLayout.vue'
import BlankLayout from '../layouts/BlankLayout.vue'
import HomeView from '../views/Home.vue'
import PostDetailView from '../views/PostDetail.vue'
import ArchiveView from '../views/Archive.vue'
import CategoriesView from '../views/Categories.vue'
import CategoryDetailView from '../views/CategoryDetail.vue'
import TagDetailView from '../views/TagDetail.vue'
import LoginView from '../views/Login.vue'
import ProfileView from '../views/Profile.vue'
import AboutView from '../views/About.vue'
import GamesView from '../views/Games.vue'
import { clearAuthRedirectFlag, clearAuthStorage, isTokenExpired } from '../utils/auth'
import adminRoutes from './admin'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: MainLayout,
      children: [
        {
          path: '',
          name: 'home',
          component: HomeView
        },
        {
          path: 'post/:slug',
          name: 'post-detail',
          component: PostDetailView,
          props: true
        },
        {
          path: 'archive',
          name: 'archive',
          component: ArchiveView
        },
        {
          path: 'categories',
          name: 'categories',
          component: CategoriesView
        },
        {
          path: 'categories/:slug',
          name: 'category-detail',
          component: CategoryDetailView,
          props: true
        },
        {
          path: 'tags/:slug',
          name: 'tag-detail',
          component: TagDetailView,
          props: true
        },
        {
          path: 'profile',
          name: 'profile',
          component: ProfileView,
          meta: {
            requiresAuth: true
          }
        },
        {
          path: 'about',
          name: 'about',
          component: AboutView
        },
        {
          path: 'games',
          name: 'games',
          component: GamesView
        }
      ]
    },
    {
      path: '/',
      component: BlankLayout,
      children: [
        {
          path: 'login',
          name: 'login',
          component: LoginView
        }
      ]
    },
    ...adminRoutes
  ]
})

router.beforeEach((to, _from, next) => {
  clearAuthRedirectFlag()

  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)
  const requiresAdmin = to.matched.some((record) => record.meta.requiresAdmin)
  const token = localStorage.getItem('token')
  const userStr = localStorage.getItem('user')
  const user = userStr ? JSON.parse(userStr) : null
  const tokenExpired = !!token && isTokenExpired(token)

  if (tokenExpired) {
    clearAuthStorage()
  }

  if (requiresAuth) {
    if (!token || tokenExpired) {
      next({
        path: '/login',
        query: {
          redirect: to.fullPath,
          reason: tokenExpired ? 'expired' : 'unauthorized'
        }
      })
      return
    }

    if (requiresAdmin && user?.role !== 'admin') {
      next({ path: '/' })
      return
    }
  }

  next()
})

export default router
