import type { RouteRecordRaw } from 'vue-router'

// ========== 1. 手动引入所有页面组件 ==========
import ShiftView from '@/views/shift/shiftView.vue'
import PwdEdit from '@/views/system/passwordEdit.vue'
import PwdReset from '@/views/system/passwordReset.vue'
import HolidaySet from '@/views/system/holidaySet.vue'
import ShiftSet from '@/views/shift/shiftSet.vue'
import ShiftType from '@/views/master/shiftType.vue'
import Staff from '@/views/master/staff.vue'
import Shop from '@/views/master/shop.vue'
import requestLeave from '@/views/shift/requestLeave.vue'
import ShiftTypes from '@/views/shift/shiftTypes.vue'

// NORMAL_USER スマホ専用画面（新規3ファイル）
import NormalUserMenu from '@/views/mobile/NormalUserMenu.vue'
import MobileShiftView from '@/views/mobile/MobileShiftView.vue'

// 菜单类型定义
export interface MenuItem {
  path: string
  name: string
  label: string
  icon?: string
  children?: MenuItem[]
  // permission: string[]
  businessType?: string
  component?: any // 新增：组件实例
}

// ========== 2. 菜单数据源，绑定对应组件 ==========
export const menuRoutes: MenuItem[] = [
  {
    path: '/shift',
    name: 'Shift',
    label: 'シフト管理',
    icon: 'Menu',
    // permission: [
    //   'SUB_SHOP_USER',
    //   'SHOP_USER',
    //   'GROUP_USER',
    //   'BLOCK_USER',
    //   'JINJI_USER',
    //   'SYSTEM_USER',
    //   'KANSA_USER',
    // ],
    children: [
      {
        path: '/shift/shiftSet',
        name: 'ShiftSet',
        label: 'シフト表作成',
        // permission: ['SUB_SHOP_USER', 'SHOP_USER', 'GROUP_USER'],
        component: ShiftSet,
      },
      {
        path: '/shift/shiftTypes',
        name: 'ShiftTypes',
        label: '出勤区分',
        // permission: ['SUB_SHOP_USER', 'SHOP_USER'],
        businessType: '03',
        component: ShiftTypes,
      },
      {
        path: '/shift/requestLeave',
        name: 'RequestLeave',
        label: '希望休設定',
        // permission: ['NORMAL_USER', 'SUB_SHOP_USER', 'SHOP_USER'],
        component: requestLeave,
      },
      {
        path: '/shift/shiftView',
        name: 'ShiftView',
        label: 'シフト表参照',
        // permission: [
        //   'GROUP_USER',
        //   'BLOCK_USER',
        //   'JINJI_USER',
        //   'SYSTEM_USER',
        //   'KANSA_USER',
        // ],
        component: ShiftView,
      },
    ],
  },
  {
    path: '/system',
    name: 'System',
    label: 'システム設定',
    icon: 'Setting',
    // permission: [
    //   'SUB_SHOP_USER',
    //   'SHOP_USER',
    //   'GROUP_USER',
    //   'BLOCK_USER',
    //   'JINJI_USER',
    //   'SYSTEM_USER',
    //   'KANSA_USER',
    // ],
    children: [
      {
        path: '/system/passwordEdit',
        name: 'PwdEdit',
        label: 'パスワード変更',
        // permission: [
        //   'SUB_SHOP_USER',
        //   'SHOP_USER',
        //   'GROUP_USER',
        //   'BLOCK_USER',
        //   'JINJI_USER',
        //   'SYSTEM_USER',
        //   'KANSA_USER',
        // ],
        component: PwdEdit,
      },
      {
        path: '/system/passwordReset',
        name: 'PwdReset',
        label: 'パスワード初期化',
        // permission: ['SHOP_USER', 'GROUP_USER', 'JINJI_USER', 'SYSTEM_USER'],
        component: PwdReset,
      },
      {
        path: '/system/holidaySet',
        name: 'HolidaySet',
        label: '月別公休数設定（青山、SSQ）',
        // permission: ['JINJI_USER', 'SYSTEM_USER'],
        component: HolidaySet,
      },
    ],
  },
  {
    path: '/master',
    name: 'Master',
    label: 'マスタ設定',
    icon: 'DataLine',
    // permission: ['SUB_SHOP_USER', 'SHOP_USER', 'GROUP_USER', 'JINJI_USER', 'SYSTEM_USER'],
    children: [
      {
        path: '/master/shiftType',
        name: 'ShiftType',
        label: 'シフト区分',
        // permission: ['JINJI_USER', 'SYSTEM_USER'],
        component: ShiftType,
      },
      {
        path: '/master/staff',
        name: 'Staff',
        label: '従業員',
        // permission: [
        //   'SUB_SHOP_USER',
        //   'SHOP_USER',
        //   'GROUP_USER',
        //   'JINJI_USER',
        //   'SYSTEM_USER',
        //   'KANSA_USER',
        // ],
        component: Staff,
      },
      {
        path: '/master/shop',
        name: 'Shop',
        label: '店舗',
        // permission: ['JINJI_USER', 'SYSTEM_USER'],
        component: Shop,
      },
    ],
  },
]

// ========== 3. 生成路由（直接取绑定好的 component） ==========
export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/shift/shiftView',
    component: () => import('@/components/Layout/Layout.vue'),
    children: menuRoutes.flatMap((parent) => {
      if (!parent.children) return []
      return parent.children.map((child) => ({
        path: child.path,
        name: child.name,
        component: child.component,
      }))
    }),
  },
  // ===== NORMAL_USER スマホ専用独立路由（无Layout侧边栏）=====
  {
    path: '/mobile',
    redirect: '/mobile/menu',
    component: () => import('@/components/Layout/MobileLayout.vue'), // 极简空白布局，无侧边菜单
    children: [
      {
        path: 'menu',
        name: 'NormalUserMenu',
        component: NormalUserMenu
      },
      {
        path: 'leave',
        name: 'MobileRequestLeave',
        component: requestLeave
      },
      {
        path: 'shift',
        name: 'MobileShiftView',
        component: MobileShiftView
      },
      {
        path: 'pwd',
        name: 'MobilePwdEdit',
        component: PwdEdit
      }
    ]
  }
]
