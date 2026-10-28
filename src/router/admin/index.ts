import AdminLayout from '../../components/admin/AdminLayout.vue'
import Dashboard from '../../views/admin/Dashboard.vue'
import PostList from '../../views/admin/PostList.vue'
import CategoryList from '../../views/admin/CategoryList.vue'
import Settings from '../../views/admin/Settings.vue'
import CommentModeration from '../../views/admin/CommentModeration.vue'
import Announcement from '../../views/admin/Announcement.vue'
import GameManagement from '../../views/admin/GameManagement.vue'
import UserManagement from '../../views/admin/UserManagement.vue'

const adminRoutes = [
  {
    path: '/admin',
    component: AdminLayout,
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      {
        path: '',
        redirect: '/admin/dashboard'
      },
      {
        path: 'dashboard',
        name: 'admin-dashboard',
        component: Dashboard
      },
      {
        path: 'posts',
        name: 'admin-posts',
        component: PostList
      },
      {
        path: 'categories',
        name: 'admin-categories',
        component: CategoryList
      },
      {
        path: 'comments',
        name: 'admin-comments',
        component: CommentModeration
      },
      {
        path: 'users',
        name: 'admin-users',
        component: UserManagement
      },
      {
        path: 'settings',
        name: 'admin-settings',
        component: Settings
      },
      {
        path: 'announcement',
        name: 'admin-announcement',
        component: Announcement
      },
      {
        path: 'games',
        name: 'admin-games',
        component: GameManagement
      }
    ]
  }
]

export default adminRoutes
