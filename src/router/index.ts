import { createRouter, createWebHistory } from 'vue-router'
import { routes } from './routes'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('../views/login/login.vue'),
    },
    ...routes,
    {
      path: '/:pathMatch(.*)*',
      redirect: '/login',
    },
  ],
})

// 全局标记：只初次刷新页面读取一次local
let initLocalLoaded = false

router.beforeEach(async (to, from, next) => {
  // 动态导入store，保证pinia已挂载
  const { useUserStore } = await import('@/stores/user')
  const userStore = useUserStore()

  // 只首次进项目加载本地缓存，后续路由不再加载
  if (!initLocalLoaded) {
    await userStore.loadFromLocal()
    initLocalLoaded = true
  }

  const isLogin = !!userStore.userInfo
  const role = userStore.role

  // 1. 未登录：全部跳登录页
  if (!isLogin) {
    if (to.path === '/login') {
      return next()
    }
    return next('/login')
  }

  // 2. 已登录，禁止再进入/login页面
  if (to.path === '/login') {
    if (role === 'NORMAL_USER') {
      return next('/mobile/menu')
    } else if (['SUB_SHOP_USER','SHOP_USER'].includes(role)) {
      return next('/shift/shiftSet')
    } else {
      return next('/shift/shiftView')
    }
  }

  // 3. 移动端用户权限拦截（统一放在外层，所有路由生效）
  if (role === 'NORMAL_USER') {
    // 访问非/mobile开头页面，强制跳转移动端首页
    if (!to.path.startsWith('/mobile/')) {
      return next('/mobile/menu')
    }
  }

  // 全部校验通过，放行
  next()
})

export default router
