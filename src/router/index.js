// file: src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'

import AdminDashboard from '@/views/admin/AdminDashboard.vue'
import AdminLayout from '@/layouts/AdminLayout.vue'
import ChangePasswordView from '@/views/auth/ChangePasswordView.vue'
import DashboardView from '@/views/app/DashboardView.vue'
import HomeLayout from '@/layouts/HomeLayout.vue'
import LoginView from '@/views/auth/LoginView.vue'
import PublicLayout from '@/layouts/PublicLayout.vue'
import { setupGuards } from './guards'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // ---------------------------------------------------------
    // Public
    // ---------------------------------------------------------
    {
      path: '/',
      component: PublicLayout,
      children: [
        { path: '', component: LoginView },
        { path: 'change-password', component: ChangePasswordView },
      ],
    },

    // ---------------------------------------------------------
    // 일반 사용자 영역
    // ---------------------------------------------------------
    {
      path: '/app',
      component: HomeLayout,
      meta: { requiresAuth: true },
      children: [
        { path: '', component: DashboardView },
      ],
    },

    // ---------------------------------------------------------
    // 관리자 영역
    // ---------------------------------------------------------
    {
      path: '/admin',
      component: AdminLayout,
      meta: { requiresAuth: true, role: 'ADMIN' },
      children: [
        { path: '', component: AdminDashboard },

        // ========== ⭐ 자원 관리 그룹 ==========
        {
          path: 'assets',
          meta: { minRole: 'MANAGER' },
          children: [
            // /admin/assets  → /admin/assets/list 리디렉트
            { path: '', redirect: '/admin/assets/list' },

            {
              path: 'list',
              component: () =>
                import('@/views/admin/asset/AssetManagement.vue'),
              meta: { title: '자원 목록 조회', minRole: 'MANAGER' }
            },
            {
              path: 'create',
              component: () =>
                import('@/views/admin/asset/AssetCreateView.vue'),
              meta: { title: '자원 등록', minRole: 'MANAGER' }
            },
            {
              path: ':assetId/edit',
              component: () =>
                import('@/views/admin/asset/AssetEditView.vue'),
              meta: { title: '자원 수정', minRole: 'MANAGER' }
            }
          ]
        },

        // ========== 카테고리 관리 ==========
        {
          path: 'categories',
          component: () =>
            import('@/views/admin/category/CategoryManagement.vue'),
          meta: { minRole: 'MANAGER', title: '카테고리 관리' },
        },

        // 다른 Admin 메뉴는 필요 시 추가 가능
      ],
    },

    // ---------------------------------------------------------
    // 오류 페이지
    // ---------------------------------------------------------
    { path: '/403', component: () => import('@/views/error/ForbiddenView.vue') },
    { path: '/:pathMatch(.*)*', component: () => import('@/views/error/NotFoundView.vue') },
  ],
})

setupGuards(router)
export default router
