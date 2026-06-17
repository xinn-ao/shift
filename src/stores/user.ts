// user.ts
import { defineStore } from 'pinia'
import { menuRoutes, type MenuItem } from '@/router/routes'

export const useUserStore = defineStore('user', {
  state: () => ({
    permissions: [] as string[],
    username: '',
    role: '',
    userInfo: null as any,
    businessType: '',
  }),

  getters: {
    authMenuList: (state): MenuItem[] => {
      if (!Array.isArray(menuRoutes)) return []
      const checkPermission = (menu: MenuItem): boolean => {
        // 先判断角色权限
        const hasRolePermission =
          menu.permission?.some((p) => state.permissions.includes(p)) ?? false
        if (!hasRolePermission) return false

        // 2. 再判断 businessType 限制
        // 如果路由没有配置 businessType，则直接通过
        if (!menu.businessType) return true
        // 如果配置了，则必须和当前用户的 businessType 匹配
        return state.businessType === menu.businessType
      }

      const copyRoutes = JSON.parse(JSON.stringify(menuRoutes)) as MenuItem[]
      const res = copyRoutes.filter((parent) => {
        if (!checkPermission(parent)) return false
        if (parent.children) {
          parent.children = parent.children.filter((child) => checkPermission(child))
        }
        return true
      })
      return Array.isArray(res) ? res : []
    },
  },

  actions: {
    login(user: any) {
      this.username = user.staffName
      this.role = user.role
      this.userInfo = user
      this.permissions = []
      switch (user.role) {
        case 'NORMAL_USER':
          this.permissions = ['NORMAL_USER']
          break
        case 'SHOP_USER':
          this.permissions = ['SHOP_USER']
          break
        case 'SUB_SHOP_USER':
          this.permissions = ['SUB_SHOP_USER']
          break
        case 'GROUP_USER':
          this.permissions = ['GROUP_USER']
          break
        case 'BLOCK_USER':
          this.permissions = ['BLOCK_USER']
          break
        case 'JINJI_USER':
          this.permissions = ['JINJI_USER']
          break
        case 'SYSTEM_USER':
          this.permissions = ['SYSTEM_USER']
          break
        case 'KANSA_USER':
          this.permissions = ['KANSA_USER']
          break
        default:
          this.permissions = ['NORMAL_USER']
      }
      this.businessType = user.businessType
      // 登录成功自动存本地，login.vue删掉手动saveToLocal
      this.saveToLocal()
    },
    logout() {
      this.permissions = []
      this.username = ''
      this.role = ''
      this.userInfo = null
      localStorage.removeItem('userInfo')
    },
    saveToLocal() {
      localStorage.setItem(
        'userInfo',
        JSON.stringify({
          userInfo: this.userInfo,
          permissions: this.permissions,
          role: this.role,
          username: this.username,
        }),
      )
    },
    // 同步读取，去掉async！关键
    loadFromLocal() {
      const local = localStorage.getItem('userInfo')
      if (!local) return false
      try {
        const data = JSON.parse(local)
        this.userInfo = data.userInfo
        this.permissions = data.permissions
        this.role = data.role
        this.username = data.username
        return true
      } catch (e) {
        localStorage.removeItem('userInfo')
        return false
      }
    },
  },
})

// // ✅【重点】文件引入时立刻执行一次缓存加载，初始化store数据
// const userStore = useUserStore()
// userStore.loadFromLocal()
