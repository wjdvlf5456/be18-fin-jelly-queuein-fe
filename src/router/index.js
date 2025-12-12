// file: src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'

import AdminDashboard from '@/views/admin/AdminDashboard.vue'
import AdminLayout from '@/layouts/AdminLayout.vue'
import ChangeTempPasswordView from '@/views/auth/ChangeTempPasswordView.vue'
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
        { path: 'change-password', component: ChangeTempPasswordView },
      ],
    },

    // ---------------------------------------------------------
    // 일반 사용자 영역
    // ---------------------------------------------------------
    {
      path: '/app',
      component: HomeLayout,

      // meta: { requiresAuth: true },
      children: [
        { path: '', component: DashboardView },

        {
          path: 'users/me',
          name: 'MyPage',
          component: () => import('@/views/app/user/MyPage.vue'),
          meta: { requiresAuth: true },
        },

        {
          path: 'reservations/me',
          component: () => import('@/views/app/reservation/UserReservations.vue'),
          meta: { title: '사용자 예약', minRole: 'GENERAL' },
        },
        {
          path: 'reservations/available-assets',
          component: () => import('@/views/app/reservation/ReservableAssets.vue'),
          meta: { title: '예약 가능 자원', minRole: 'GENERAL' },
          // meta: { requiresAuth: true }
        },

        {
          path: 'reservations/monthly',
          component: () => import('@/views/app/reservation/MonthlyReservations.vue'),
          meta: { title: '월별 예약', minRole: 'GENERAL' },
          // meta: { requiresAuth: true }
        },
        {
          path: 'reservations/weekly',
          component: () => import('@/views/app/reservation/WeeklyReservations.vue'),
          meta: { title: '주별 예약', minRole: 'GENERAL' },
          // meta: { requiresAuth: true }
        },
        {
          path: 'reservations/create-reservation',
          component: () => import('@/views/app/reservation/CreateReservation.vue'),
          meta: { title: '예약 생성', minRole: 'GENERAL' },
          // meta: { requiresAuth: true }
        },
        {
          path: 'reservations/apply',
          component: () => import('@/views/app/reservation/ApplyReservation.vue'),
          meta: { title: '예약 신청', minRole: 'GENERAL' },
          // meta: { requiresAuth: true }
        },
        {
          path: 'guide',
          component: () => import('@/views/app/GuideView.vue'),
          meta: { title: '사용법 가이드' },
        },
      ],
    },

    // ---------------------------------------------------------
    // 관리자 영역
    // ---------------------------------------------------------
    {
      path: '/admin',
      component: AdminLayout,
      meta: { requiresAuth: true },
      children: [
        // -------------------------
        // 기본 대시보드: /admin → AdminDashboard
        // -------------------------
        {
          path: '',
          component: AdminDashboard,
          meta: { title: '관리자 대시보드', requiresAuth: true },
        },

        // -------------------------
        // 사용자 관리
        // -------------------------
        {
          path: 'users',
          component: () => import('@/views/admin/iam/user/UserManagement.vue'),
          meta: { title: '사용자 관리', minRole: 'ADMIN' },
        },
        // 사용자 상세 조회
        {
          path: 'users/:userId',
          name: 'UserDetail',
          component: () => import('@/views/admin/iam/user/UserDetailView.vue'),
          meta: { title: '사용자 상세 조회', minRole: 'ADMIN' },
        },
        // 관리자용 사용자 수정
        {
          path: 'users/:userId/edit',
          name: 'UserEdit',
          component: () => import('@/views/admin/iam/user/UserEditView.vue'),
          meta: { title: '사용자 수정', minRole: 'ADMIN' },
        },

        // -------------------------
        // 역할 관리
        // -------------------------
        {
          path: 'roles',
          component: () => import('@/views/admin/iam/role/RoleManagement.vue'),
          meta: { title: '역할 관리', minRole: 'ADMIN' },
        },

        // -------------------------
        // 권한 관리
        // -------------------------
        {
          path: 'permissions',
          meta: { minRole: 'ADMIN' },
          children: [
            { path: '', redirect: '/admin/permissions/list' },

            {
              path: 'list',
              component: () => import('@/views/admin/iam/permission/PermissionList.vue'),
              meta: { title: '권한 관리', minRole: 'ADMIN' },
            },

            {
              path: 'create',
              component: () => import('@/views/admin/iam/permission/PermissionCreate.vue'),
              meta: { title: '권한 생성', minRole: 'MASTER' },
            },

            {
              path: ':permissionId/edit',
              component: () => import('@/views/admin/iam/permission/PermissionEdit.vue'),
              meta: { title: '권한 수정', minRole: 'MASTER' },
            },
          ],
        },

        // ========== ⭐ 자원 관리 그룹 ==========
        {
          path: 'assets',
          meta: { minRole: 'MANAGER' },
          children: [
            // /admin/assets  → /admin/assets/list 리디렉트
            { path: '', redirect: '/admin/assets/list' },

            {
              path: 'list',
              component: () => import('@/views/admin/asset/AssetManagement.vue'),
              meta: { title: '자원 목록 조회', minRole: 'MANAGER' },
            },
            {
              path: 'create',
              component: () => import('@/views/admin/asset/AssetCreateView.vue'),
              meta: { title: '자원 등록', minRole: 'MANAGER' },
            },
            {
              path: ':assetId/edit',
              component: () => import('@/views/admin/asset/AssetEditView.vue'),
              meta: { title: '자원 수정', minRole: 'MANAGER' },
            },
            {
              path: 'categories',
              component: () => import('@/views/admin/category/CategoryManagement.vue'),
              meta: { minRole: 'MANAGER', title: '카테고리 관리' },
            },
          ],
        },

        // 자원 상세 조회 (assets children 밖에 별도로 정의)
        {
          path: 'assets/:assetId',
          component: () => import('@/views/admin/asset/AssetDetailView.vue'),
          meta: { requiresAuth: true, minRole: 'MANAGER' },
        },
        // 다른 Admin 메뉴는 필요 시 추가 가능
        // ---------------------------------------------------------
        // ⭐ 정산 메뉴 (Layout 제거됨)
        // ---------------------------------------------------------
        {
          path: 'accounting',
          meta: { minRole: 'MANAGER' },
          children: [
            {
              path: 'usage-history',
              component: () => import('@/views/admin/accounting/usage_history/UsageHistory.vue'),
              meta: { title: '자원 사용 기록' },
            },
            {
              path: 'usage-trend',
              component: () => import('@/views/admin/accounting/usage_trend/UsageTrend.vue'),
              meta: { title: '사용 추이' },
            },
            {
              path: 'performance',
              component: () => import('@/views/admin/accounting/performance/PerformanceView.vue'),
              meta: { title: '운영 성과 분석' },
            },
            {
              path: 'quarter',
              component: () => import('@/views/admin/accounting/quarter/QuarterSettlement.vue'),
              meta: { title: '분기 정산' },
            },
          ],
        },
        {
          path: 'reservations/applied',
          component: () => import('@/views/admin/reservation/AppliedReservations.vue'),
          meta: { title: '신청 예약 관리', requiresAuth: true, minRole: 'MANAGER' },
          // meta: { requiresAuth: true }
        },
        {
          path: 'guide',
          component: () => import('@/views/admin/GuideView.vue'),
          meta: { title: '관리자 가이드', minRole: 'ADMIN' },
        },
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
