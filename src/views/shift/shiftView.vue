<template>
  <div class="shift-view-container" style="padding: 20px">
    <div class="page-title">シフト表参照</div>
    <!-- ========== NORMAL_USER 獨有頂部卡片（參考requestLeave布局） ========== -->
    <!-- <div v-if="userRole === 'NORMAL_USER'" class="normal-top-card">
      <el-card shadow="hover">
        <div class="normal-row-first">
          <span>{{ targetYear }}年{{ targetMonth }}月</span>
          <span>公休数：{{ userRestCount }}日</span>
        </div>
      </el-card>
    </div> -->

    <!-- 上部グループ+年月（グループ上段、年月下段） -->
    <div class="top-bar" style="margin-bottom: 20px; background-color: #fff; padding: 20px 30px 20px 30px"
      v-if="userRole !== 'NORMAL_USER'">
      <!-- 下拉框 -->
      <div class="group-select" style="margin-bottom: 15px; display: flex; align-items: center; gap: 10px"
        v-if="userRole === 'BLOCK_USER'">
        <span>グループ：</span>
        <el-select v-model="selectedGroup" placeholder="グループ選択" style="width: 220px">
          <el-option label="グループ一覧" value="all" />
          <el-option v-for="item in groupList" :key="item.groupId" :label="`${item.groupId} ${item.groupName}`"
            :value="item.groupId" />
        </el-select>
      </div>

      <!-- JINJI/SYSTEM/KANSA三类角色：店番搜索栏 -->
      <div class="search-shop-bar" v-if="['JINJI_USER', 'SYSTEM_USER', 'KANSA_USER'].includes(userRole)"
        style="margin-bottom: 15px">
        <div style="display: flex; align-items: center; gap: 12px">
          <span style="width: calc(100px); text-align: left">店番</span>
          <el-input v-model="searchShopId" placeholder="店番を入力" style="flex: 1; max-width: 320px"></el-input>
          <el-button type="primary" @click="searchShop">検索</el-button>
        </div>
      </div>

      <!-- 年月切换 -->
      <div class="month-picker" style="display: flex; align-items: center; gap: 12px" v-if="userRole !== 'NORMAL_USER'">
        <span style="width: calc(100px); text-align: left">指定年月：</span>
        <el-button icon="ArrowLeft" @click="prevMonth"></el-button>
        <span>{{ targetYear }}年{{ targetMonth }}月</span>
        <el-button icon="ArrowRight" @click="nextMonth"></el-button>
      </div>
    </div>

    <div v-for="groupItem in renderGroupList" :key="groupItem.groupId"
      style="padding: 20px 30px; background-color: #fff; margin: 20px 0 6px 0">
      <!-- グループタイトル  -->
      <div class="group-title" style="font-size: 17px; margin-bottom: 12px" v-if="userRole !== 'NORMAL_USER'">
        {{ groupItem.groupName }}
      </div>
      <!-- <div v-if="userRole === 'NORMAL_USER'" class="normal-cal-wrap">
        <table class="shift-table"> -->
      <!-- 新建竖向表结构，单独写日期v-for，不用页面原有循环 -->
      <!-- <thead>
        <tr>
          <th class="week-th">日</th>
          <th class="week-th">月</th>
          <th class="week-th">火</th>
          <th class="week-th">水</th>
          <th class="week-th">木</th>
          <th class="week-th">金</th>
          <th class="week-th">土</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(weekArr, rowIdx) in calendarRows" :key="rowIdx">
          <td v-for="(dayItem, colIdx) in weekArr" :key="colIdx" class="normal-td-box" :style="{
            background: dayItem
              ? getShiftBg(getCellShiftInfo(currentStaff, currentYm, dayItem.day).code)
              : '#fff',
          }">
            <div class="top-area" v-if="dayItem">
              {{
                dayItem ? getCellShiftInfo(currentStaff, currentYm, dayItem.day).finalText : ''
              }}
            </div>
            <span class="day-number">{{ dayItem?.day ?? '' }}</span>
          </td>
        </tr>
      </tbody>
      </table>
    </div> -->

      <div>
        <table class="shift-table" border="1" cellpadding="2" cellspacing="0" width="100%">
          <!-- 店铺循环：一个店铺占用【标题行+字段头行+N行员工行】 -->
          <template v-for="shop in groupItem.shopList" :key="shop.shopId">
            <!-- 第1行：店铺标题 + 月份分栏（店铺标题合并前4列×3行） -->
            <tr>
              <th colspan="4" rowspan="3" class="title-th">
                {{ shop.shopName }} {{ targetYear }}{{ String(targetMonth).padStart(2, '0') }}
              </th>
              <th :colspan="prevMonthDays" style="background: #ffcc00; font-size: 14px">
                {{ prevMonthText }}
              </th>
              <th :colspan="currentMonthDays" style="background: #ffcc00; font-size: 14px">
                {{ currentMonthText }}
              </th>
            </tr>
            <!-- 第2行：日期数字行（前4列空，对应店铺标题合并区域） -->
            <tr>
              <th v-for="dayItem in dateList" :key="dayItem.day" class="day-head" :style="{
                color:
                  dayItem.week === '日' ? '#f00' : dayItem.week === '土' ? '#0066ff' : '#333',
              }">
                {{ dayItem.day }}
              </th>
            </tr>
            <!-- 第3行：星期行（前4列空，对应店铺标题合并区域） -->
            <tr>
              <th v-for="dayItem in dateList" :key="dayItem.day" class="week-head" :style="{
                color:
                  dayItem.week === '日' ? '#f00' : dayItem.week === '土' ? '#0066ff' : '#333',
              }">
                {{ dayItem.week }}
              </th>
            </tr>
            <!--第4行：役職/氏名/休暇/設定 固定表头行 -->
            <tr>
              <th class="fixed-th" style="width: 70px">役職</th>
              <th class="fixed-th" style="width: 110px">氏名</th>
              <th class="fixed-th" style="width: 50px">休暇</th>
              <th class="fixed-th" style="width: 50px">設定</th>
              <th v-for="dayItem in dateList" :key="dayItem.day" class="empty-th"></th>
            </tr>
            <!--第5行及以后：员工数据行 -->
            <tr v-for="staff in shop.staffList" :key="staff.staffId">
              <td class="fixed-cell" style="width: 70px">{{ staff.position }}</td>
              <td class="fixed-cell" style="width: 110px">{{ staff.name }}</td>
              <td class="fixed-cell" style="width: 50px">{{ staff.restDay }}</td>
              <td class="fixed-cell" style="width: 50px">{{ staff.setDay }}</td>
              <!-- 每日排班格子 -->
              <td v-for="dayItem in dateList" :key="dayItem.day" class="shift-cell"
                style="padding: 0 2px; position: relative" :style="{
                  background: getShiftBg(getCellShiftInfo(staff, currentYm, dayItem.day).code),
                }">
                <span style="font-size: 13px; color: #000">
                  {{ getCellShiftInfo(staff, currentYm, dayItem.day).finalText }}
                </span>
              </td>
            </tr>
          </template>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import dayjs from 'dayjs'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

// 获取登录角色
const userStore = useUserStore()
const userRole = computed(() => userStore.role)

// ==========固定数据，限制显示用==========
const loginGroupId = ref('126')
const loginUserGroupIds = ref('126')
const loginUserShopIds = ref('13')
const loginStaffId = ref('u1')
// NORMAL_USER：DBから取得する公休数
const userRestCount = ref(9)

// 店铺搜索框绑定值
const searchShopId = ref('')
// 保存搜索后的店铺ID，空=不展示任何数据
const targetSearchShopId = ref('')
// 店铺搜索触发
const searchShop = () => {
  targetSearchShopId.value = searchShopId.value.trim()
  // ロール判定：人事/システム/監査ユーザーのみ店番検索対象
  if (!['JINJI_USER', 'SYSTEM_USER', 'KANSA_USER'].includes(userRole.value)) return

  // 店番空文字チェック
  if (!targetSearchShopId.value) {
    ElMessage.warning('店舗IDを入力してください')
    return
  }

  // 検索結果存在確認
  let hasMatchShop = false
  groupList.value.forEach(g => {
    if (g.shopList.some(s => s.shopId === targetSearchShopId.value)) {
      hasMatchShop = true
    }
  })

  // 一致する店舗がない場合のみ警告
  if (!hasMatchShop) {
    ElMessage.warning('入力した店番がみつかりませんでした。ご確認ください。')
  }
}

// 年月変数（NORMAL_USER内部固定当月、画面非表示切替）
const now = new Date()
const targetYear = ref(now.getFullYear())
const targetMonth = ref(now.getMonth() + 1)

// 全グループマスタ（ID・名前・配下店舗・店舗配下社員シフト）
type StaffShift = {
  staffId: string
  position: string
  name: string
  restDay: string | number
  setDay: string | number
  shiftMap: Record<string, Record<string, Record<number, string>>>
}
type ShopItem = {
  shopId: string
  shopName: string
  staffList: StaffShift[]
}
type GroupItem = {
  groupId: string
  groupName: string
  shopList: ShopItem[]
}
// 初始固定数据，查看页面效果用
const groupList = ref([] as GroupItem[])
groupList.value = [
  {
    groupId: '126',
    groupName: '単独_AO+八王子北口',
    shopList: [
      {
        shopId: '11',
        shopName: '福山本店',
        staffList: [
          {
            staffId: 'u1',
            position: '店長',
            name: '田中太郎',
            restDay: 9,
            setDay: 9,
            shiftMap: {
              '202606': {
                work: {
                  21: '',
                  22: '',
                  23: '',
                  24: '',
                  28: '',
                  29: '',
                  30: '',
                  31: '',
                  4: '',
                  5: '',
                  10: '',
                  13: '',
                  16: '',
                  17: '',
                  18: '',
                  19: '',
                },
                halfAMOff: { 3: '' },
                halfPMOff: { 25: '' },
                restAll: { 26: '', 1: '', 2: '', 9: '', 14: '', 15: '' },
                paidAll: { 27: '', 6: '' },
                paidAM: { 7: '' },
                paidPM: { 8: '' },
                halfPMSup: { 11: '2822' },
                halfAMSup: { 12: '2822' },
                other: { 20: '' },
              },
            },
          },
          {
            staffId: 'u2',
            position: '副店長',
            name: '田中次郎',
            restDay: 9,
            setDay: 9,
            // ========== 【改动2-2】新结构shiftMap ==========
            shiftMap: {
              '202606': {
                work: {
                  21: '',
                  27: '',
                  28: '',
                  29: '',
                  1: '',
                  2: '',
                  3: '',
                  4: '',
                  5: '',
                  8: '',
                  9: '',
                  10: '',
                  11: '',
                  12: '',

                  16: '',
                  17: '',
                  18: '',
                  19: '',
                },
                late1: { 24: '' },
                half1: { 23: '' },
                early1: { 22: '' },
                restAll: { 31: '', 6: '', 7: '', 13: '', 14: '' },
                spcialPaidAll: { 30: '' },
                halfAMOff: { 25: '', 15: '' },
                other: { 20: '' },
              },
            },
          },
          {
            staffId: 'u3',
            position: '店員',
            name: '田中三郎',
            restDay: 9,
            setDay: 9,
            shiftMap: {
              '202606': {
                work: {
                  22: '',
                  23: '',
                  24: '',
                  25: '',
                  26: '',
                  30: '',
                  1: '',
                  2: '',
                  3: '',
                  6: '',
                  7: '',
                  8: '',
                  9: '',
                  10: '',
                  13: '',
                  14: '',
                  15: '',
                  16: '',
                  17: '',
                  20: '',
                },
                restAll: { 21: '', 27: '', 4: '', 5: '', 11: '', 12: '', 18: '', 19: '' },
                paidPM: { 28: '' },
                unpaid: { 29: '' },
                fullSup: { 31: '0128220' },
              },
            },
          },
          {
            staffId: 'u5',
            position: '店員',
            name: '岩崎1',
            restDay: '/',
            setDay: '/',
            shiftMap: {
              '202606': {
                work: {
                  21: '',
                  22: '',
                  25: '',
                  26: '',
                  27: '',
                  28: '',
                  29: '',
                  1: '',
                  2: '',
                  3: '',
                  4: '',
                  5: '',
                  8: '',
                  9: '',
                  10: '',
                  11: '',
                  12: '',
                  15: '',
                  16: '',
                  17: '',
                  18: '',
                  19: '',
                },
                restAll: { 23: '', 24: '', 30: '', 31: '', 6: '', 7: '', 13: '', 14: '', 20: '' },
              },
            },
          },
          {
            staffId: 'u6',
            position: '店員',
            name: '岩崎2',
            restDay: '/',
            setDay: '/',
            // ========== 【改动2-4】新结构shiftMap ==========
            shiftMap: {
              '202606': {
                work: {
                  23: '',
                  24: '',
                  25: '',
                  26: '',
                  27: '',
                  30: '',
                  31: '',
                  1: '',
                  2: '',
                  3: '',
                  6: '',
                  7: '',
                  8: '',
                  9: '',
                  10: '',
                  15: '',
                  16: '',
                  17: '',
                  20: '',
                },
                restAll: {
                  21: '',
                  22: '',
                  28: '',
                  29: '',
                  4: '',
                  5: '',
                  11: '',
                  12: '',
                  18: '',
                  19: '',
                },
                AMSupPMOff: { 13: '0128221' },
                AMOffPMSup: { 14: '0128223' },
              },
            },
          },
        ],
      },
      {
        shopId: '13',
        shopName: 'AO+',
        staffList: [
          {
            staffId: 'u7',
            position: '店長',
            name: '青山太郎',
            restDay: 9,
            setDay: 9,
            shiftMap: {},
          },
          {
            staffId: 'u8',
            position: '副店長',
            name: '青山次郎',
            restDay: 9,
            setDay: 9,
            shiftMap: {},
          },
          {
            staffId: 'u9',
            position: '店員',
            name: '青山三郎',
            restDay: 9,
            setDay: 9,
            shiftMap: {},
          },
        ],
      },
      {
        shopId: '12',
        shopName: '瑞江スタジオ',
        staffList: [
          {
            staffId: 'u10',
            position: '店長',
            name: '青山太郎',
            restDay: 9,
            setDay: 9,
            shiftMap: {},
          },
        ],
      },
    ],
  },
  {
    groupId: '127',
    groupName: 'ULM',
    shopList: [
      {
        shopId: '21',
        shopName: '福山本店',
        staffList: [
          {
            staffId: 'u11',
            position: '店長',
            name: '田中太郎',
            restDay: 9,
            setDay: 9,
            shiftMap: {},
          },
          {
            staffId: 'u21',
            position: '副店長',
            name: '田中次郎',
            restDay: 9,
            setDay: 9,
            shiftMap: {},
          },
          {
            staffId: 'u31',
            position: '店員',
            name: '田中三郎',
            restDay: 9,
            setDay: 9,
            shiftMap: {},
          },
          {
            staffId: 'u51',
            position: '店員',
            name: '岩崎1',
            restDay: '/',
            setDay: '/',
            shiftMap: {},
          },
          {
            staffId: 'u61',
            position: '店員',
            name: '岩崎2',
            restDay: '/',
            setDay: '/',
            shiftMap: {},
          },
        ],
      },
      {
        shopId: '22',
        shopName: 'AO+',
        staffList: [
          {
            staffId: 'u71',
            position: '店長',
            name: '青山太郎',
            restDay: 9,
            setDay: 9,
            shiftMap: {},
          },
          {
            staffId: 'u81',
            position: '副店長',
            name: '青山次郎',
            restDay: 9,
            setDay: 9,
            shiftMap: {},
          },
          {
            staffId: 'u91',
            position: '店員',
            name: '青山三郎',
            restDay: 9,
            setDay: 9,
            shiftMap: {},
          },
        ],
      },
      {
        shopId: '23',
        shopName: '瑞江スタジオ',
        staffList: [
          {
            staffId: 'u101',
            position: '店長',
            name: '青山太郎',
            restDay: 9,
            setDay: 9,
            shiftMap: {},
          },
        ],
      },
    ],
  },
  {
    groupId: '3',
    groupName: 'グループ3',
    shopList: [
      {
        shopId: '31',
        shopName: '福山本店',
        staffList: [
          {
            staffId: 'u111',
            position: '店長',
            name: '田中太郎',
            restDay: 9,
            setDay: 9,
            shiftMap: {},
          },
          {
            staffId: 'u211',
            position: '副店長',
            name: '田中次郎',
            restDay: 9,
            setDay: 9,
            shiftMap: {},
          },
          {
            staffId: 'u311',
            position: '店員',
            name: '田中三郎',
            restDay: 9,
            setDay: 9,
            shiftMap: {},
          },
          {
            staffId: 'u511',
            position: '店員',
            name: '岩崎1',
            restDay: '/',
            setDay: '/',
            shiftMap: {},
          },
          {
            staffId: 'u611',
            position: '店員',
            name: '岩崎2',
            restDay: '/',
            setDay: '/',
            shiftMap: {},
          },
        ],
      },
      {
        shopId: '32',
        shopName: 'AO+',
        staffList: [
          {
            staffId: 'u711',
            position: '店長',
            name: '青山太郎',
            restDay: 9,
            setDay: 9,
            shiftMap: {},
          },
          {
            staffId: 'u811',
            position: '副店長',
            name: '青山次郎',
            restDay: 9,
            setDay: 9,
            shiftMap: {},
          },
          {
            staffId: 'u911',
            position: '店員',
            name: '青山三郎',
            restDay: 9,
            setDay: 9,
            shiftMap: {},
          },
        ],
      },
      {
        shopId: '33',
        shopName: '瑞江スタジオ',
        staffList: [
          {
            staffId: 'u1011',
            position: '店長',
            name: '青山太郎',
            restDay: 9,
            setDay: 9,
            shiftMap: {},
          },
        ],
      },
    ],
  },
]
// 排班数据，查看页面效果用
type DragItem = {
  kinmuCd: string
  code: string
  name: string
  bg: string
  text?: string
  textAlign?: 'left' | 'center' | 'right'
}
// 出勤区分
const workTypeList = ref<DragItem[]>([
  {
    kinmuCd: '01',
    code: 'work',
    name: '出勤',
    bg: 'linear-gradient(90deg,#73d055 50%,#73d055 50%)',
  },
  {
    kinmuCd: '01',
    code: 'halfAMOff',
    name: '前半日休日',
    bg: 'linear-gradient(90deg,#fff 0,#fff 50%,#73d055 50%,#73d055 100%)',
  },
  {
    kinmuCd: '01',
    code: 'halfPMOff',
    name: '後半日休日',
    bg: 'linear-gradient(90deg,#73d055 0,#73d055 50%,#fff 50%,#fff 100%)',
  },
  {
    kinmuCd: '01',
    code: 'paidAM',
    name: '前半日有給',
    bg: 'linear-gradient(90deg,#ffb9d6 0,#ffb9d6 50%,#73d055 50%,#73d055 100%)',
  },
  {
    kinmuCd: '01',
    code: 'paidPM',
    name: '後半日有給',
    bg: 'linear-gradient(90deg,#73d055 0,#73d055 50%,#ffb9d6 50%,#ffb9d6 100%)',
  },
  {
    kinmuCd: '01',
    code: 'early1',
    name: '時差出勤(早番)',
    bg: 'linear-gradient(90deg,#73d055 0,#73d055 75%,#fff 75%,#fff 100%)',
    text: '早',
    textAlign: 'left',
  },
  {
    kinmuCd: '01',
    code: 'half1',
    name: '時差出勤(中番)',
    bg: 'linear-gradient(90deg,#fff 0,#fff 25%,#73d055 25%,#73d055 75%,#fff 75%,#fff 100%)',
    text: '中',
    textAlign: 'center',
  },

  {
    kinmuCd: '01',
    code: 'late1',
    name: '時差出勤(遅番)',
    bg: 'linear-gradient(90deg,#fff 0,#fff 25%,#73d055 25%,#73d055 100%)',
    text: '遅',
    textAlign: 'right',
  },
])
// 休暇区分
const restTypeList = ref<DragItem[]>([
  { kinmuCd: '02', code: 'hopeAll', name: '希望休', bg: '#fff', text: '希', textAlign: 'center' },
  { kinmuCd: '02', code: 'restAll', name: '休日', bg: '#fff' },
  {
    kinmuCd: '02',
    code: 'paidAll',
    name: '有給休暇',
    bg: '#ffb9d6',
    text: '㊒',
    textAlign: 'center',
  },
  {
    kinmuCd: '02',
    code: 'spcialPaidAll',
    name: '特别有給休暇',
    bg: '#ffb9d6',
    text: '㊕',
    textAlign: 'center',
  },
  { kinmuCd: '02', code: 'unpaid', name: '無給', bg: '#c2c2c2' },
])
// 応援区分・会議他区分
const supportTypeList = ref<DragItem[]>([
  { kinmuCd: '03', code: 'fullSup', name: '応援', bg: '#ffcc99' },
  {
    kinmuCd: '03',
    code: 'halfPMSup',
    name: '後半日応援',
    bg: 'linear-gradient(90deg,#73d055 0,#73d055 50%,#ffcc99 50%,#ffcc99 100%)',
  },
  {
    kinmuCd: '03',
    code: 'halfAMSup',
    name: '前半日応援',
    bg: 'linear-gradient(90deg,#ffcc99 0,#ffcc99 50%,#73d055 50%,#73d055 100%)',
  },
  {
    kinmuCd: '03',
    code: 'AMSupPMOff',
    name: '前半日休日+後半日応援',
    bg: 'linear-gradient(90deg,#fff 0,#fff 50%,#ffcc99 50%,#ffcc99 100%)',
  },
  {
    kinmuCd: '03',
    code: 'AMOffPMSup',
    name: '前半日応援+後半日休日',
    bg: 'linear-gradient(90deg,#ffcc99 0,#ffcc99 50%,#fff 50%,#fff 100%)',
  },
  {
    kinmuCd: '04',
    code: 'other',
    name: '会議･研修･出張･他',
    bg: '#fff0cc',
    text: '会議',
    textAlign: 'center',
  },
])

// 合并全部 15 种排班
const allShiftTypes = [...workTypeList.value, ...restTypeList.value, ...supportTypeList.value]

// 配色映射：code => bg
const shiftBgMap: Record<string, string> = {}
allShiftTypes.forEach((item) => {
  shiftBgMap[item.code] = item.bg
})

// ==========日付生成：21日～翌月20日 日付・曜日配列==========
const dateList = computed(() => {
  const arr: Array<{ day: number; week: string }> = []
  // targetYear/targetMonth = 【本月】
  const curMonthBase = dayjs(`${targetYear.value}-${targetMonth.value}-01`)
  // 上月基准（用来取上月21号）
  const prevMonth = curMonthBase.subtract(1, 'month')
  const prevY = prevMonth.year()
  const prevM = prevMonth.month() + 1
  // 上月最后一天
  const prevMonthLastDay = prevMonth.endOf('month').date()

  const weekArr = ['日', '月', '火', '水', '木', '金', '土']

  // ① 上月21日 ~ 上月末日
  for (let d = 21; d <= prevMonthLastDay; d++) {
    const cur = dayjs(`${prevY}-${prevM}-${d}`)
    arr.push({ day: d, week: weekArr[cur.day()]! })
  }

  // ② 本月1日 ~ 本月20日
  const currY = curMonthBase.year()
  const currM = curMonthBase.month() + 1
  for (let d = 1; d <= 20; d++) {
    const cur = dayjs(`${currY}-${currM}-${d}`)
    arr.push({ day: d, week: weekArr[cur.day()]! })
  }

  return arr
})

// 员工日历
const calendarRows = computed(() => {
  const rows: Array<Array<{ day: number; week: string } | null>> = []
  const list = [...dateList.value]

  if (list.length === 0) return rows

  const weekMap: Record<string, number> = { 日: 0, 月: 1, 火: 2, 水: 3, 木: 4, 金: 5, 土: 6 }

  // 非空断言消除list[0] TS报错
  const firstItem = list[0]!
  const firstDayWeek = firstItem.week
  // 找不到星期兜底=0，避免emptyCount变成undefined
  const emptyCount = weekMap[firstDayWeek] ?? 0

  let currentRow: Array<{ day: number; week: string } | null> = []

  // 前置空单元格
  for (let i = 0; i < emptyCount; i++) {
    currentRow.push(null)
  }

  list.forEach((item) => {
    currentRow.push(item)
    if (currentRow.length === 7) {
      rows.push([...currentRow])
      currentRow = []
    }
  })

  // 末尾补空
  if (currentRow.length > 0) {
    while (currentRow.length < 7) {
      currentRow.push(null)
    }
    rows.push([...currentRow])
  }

  return rows
})

// ドロップダウン選択値：初期＝ログイン者担当グループ
const selectedGroup = ref('all')

// ==========描画用グループ配列（選択内容によりソート・フィルタ）==========
const currentStaff = ref<any>(null)
const renderGroupList = computed(() => {
  const sel = selectedGroup.value
  const allGroup = [...groupList.value]
  // 按角色分支处理
  // NORMAL_USER：只筛选本人所属员工データ、全画面自身シフトのみ
  // if (userRole.value === 'NORMAL_USER') {
  //   // const loginStaffId = userStore.userInfo.staffId
  //   currentStaff.value = null
  //   const filterGroup: GroupItem[] = []
  //   allGroup.forEach((g) => {
  //     const filterShop: ShopItem[] = []
  //     g.shopList.forEach((s) => {
  //       // 本人スタッフのみ抽出
  //       const ownStaff = s.staffList.filter((st) => st.staffId === loginStaffId.value)
  //       if (ownStaff.length > 0) {
  //         currentStaff.value = ownStaff[0]
  //         filterShop.push({ ...s, staffList: ownStaff })
  //       }
  //     })
  //     if (filterShop.length > 0) filterGroup.push({ ...g, shopList: filterShop })
  //   })
  //   return filterGroup
  // }
  // BLOCK_USER
  if (userRole.value === 'BLOCK_USER') {
    // 1. 复制所有分组
    let allGroups = [...allGroup]

    // 2. 分组按 groupId 升序排序
    allGroups = allGroups.sort((a, b) => Number(a.groupId) - Number(b.groupId))

    // 3. 每个分组内的店铺按 shopId 升序排序
    const sortedGroups = allGroups.map((group) => {
      const sortedShops = [...group.shopList].sort((a, b) => Number(a.shopId) - Number(b.shopId))
      return { ...group, shopList: sortedShops }
    })

    // 4. 如果选择了【单个分组】，则只返回该分组
    if (sel !== 'all') {
      return sortedGroups.filter((g) => g.groupId === sel)
    }

    // 5. 默认（グループ一覧）：返回全部排序后的分组
    return sortedGroups
  }

  // GROUP_USER
  // GROUP_USER
  if (userRole.value === 'GROUP_USER') {
    // 1. 先筛选出用户所属的组别（原有逻辑）
    const targetGroup = allGroup.find((g) => g.groupId === loginUserGroupIds.value)
    if (!targetGroup) return []

    // 2. 复制店铺列表，避免修改源数据
    let shopList = [...targetGroup.shopList]

    // 3. 筛选出【用户自己的店铺】和【其他店铺】
    const ownShop = shopList.find((shop) => shop.shopId === loginUserShopIds.value)
    const otherShops = shopList
      .filter((shop) => shop.shopId !== loginUserShopIds.value)
      // 4. 其他店铺按 ID 数字升序排序
      .sort((a, b) => Number(a.shopId) - Number(b.shopId))

    // 5. 最终店铺数组：自己的店铺置顶 + 其他有序店铺
    const sortedShops = []
    if (ownShop) sortedShops.push(ownShop)
    sortedShops.push(...otherShops)

    // 6. 返回新的组别结构（仅修改店铺顺序）
    return [
      {
        ...targetGroup,
        shopList: sortedShops,
      },
    ]
  }

  // JINJI/SYSTEM/KANSA
  if (['JINJI_USER', 'SYSTEM_USER', 'KANSA_USER'].includes(userRole.value)) {
    // 未输入搜索 → 返回空数组，页面无任何店铺
    if (!targetSearchShopId.value) return []
    // 遍历全部分组，筛选出匹配店铺ID的店铺，只保留该店铺所属分组+单店铺
    const result: GroupItem[] = []
    allGroup.forEach((group) => {
      const findShop = group.shopList.find((shop) => shop.shopId === targetSearchShopId.value)
      if (findShop) {
        result.push({
          groupId: group.groupId,
          groupName: group.groupName,
          shopList: [findShop],
        })
      }
    })
    return result
  }

  // 兜底：默认返回空数组（避免角色值异常）
  return []
})

// ==========年月切替メソッド==========
const prevMonth = () => {
  const prev = dayjs(`${targetYear.value}-${targetMonth.value}`).subtract(1, 'month')
  targetYear.value = prev.year()
  targetMonth.value = prev.month() + 1
}
const nextMonth = () => {
  const next = dayjs(`${targetYear.value}-${targetMonth.value}`).add(1, 'month')
  targetYear.value = next.year()
  targetMonth.value = next.month() + 1
}
// 当前年月：202606
const currentYm = computed(() => {
  return `${targetYear.value}${String(targetMonth.value).padStart(2, '0')}`
})

// 月份表头
const prevMonthText = computed(() => {
  return dayjs(`${targetYear.value}-${targetMonth.value}`).subtract(1, 'month').month() + 1 + '月'
})
const currentMonthText = computed(() => {
  return targetMonth.value + '月'
})
const prevMonthDays = computed(() => {
  const days = dayjs(`${targetYear.value}-${targetMonth.value}`).subtract(1, 'month').daysInMonth()
  return days - 20
})
const currentMonthDays = computed(() => 20)

// ==========セル背景色判定==========
/**
 * 根据排班code，获取类型配置里的预设text
 * @param code 排班code
 * @returns 预设text，无则返回空字符串
 */
const getTypePresetText = (code: string) => {
  const target = allShiftTypes.find((item) => item.code === code)
  return target?.text ?? ''
}

// ========根据员工+年月+日期 获取当前排班信息========
const getCellShiftInfo = (staff: StaffShift, ym: string, day: number) => {
  const monthShift = staff.shiftMap[ym]
  if (!monthShift) return { code: '', finalText: '' }

  // 遍历当前月份所有排班code
  for (const code in monthShift) {
    const dayMap = monthShift[code]
    if (dayMap && Object.prototype.hasOwnProperty.call(dayMap, day)) {
      // 1. 优先取类型配置里的 text
      const presetText = getTypePresetText(code)
      // 2. 再取 shiftMap 里自定义文本
      const customText = dayMap[day] || ''
      // 3. 按优先级取值
      const finalText = presetText || customText

      return {
        code,
        finalText,
      }
    }
  }
  return { code: '', finalText: '' }
}

// 匹配15条数据的色块
const getShiftBg = (code: string) => {
  return shiftBgMap[code] || '#fff'
}
</script>

<style scoped>
.shift-wrap {
  margin-bottom: 30px;
}

.day-split-cell {
  user-select: none;
}

.shift-table {
  border-collapse: collapse;
  border: 0.5px solid #999;
  font-size: 12px;
  width: 100%;
}

.shift-table th,
.shift-table td {
  border: 0.5px solid #999;
  padding: 2px;
  text-align: center;
}

.title-th {
  background: #ffcc00 !important;
  font-weight: bold;
  font-size: 13px;
}

.fixed-th {
  background: #f7f7f7;
  /* width: 70px; */
}

.fixed-cell {
  /* width: 70px; */
  height: 28px;
}

.day-head,
.week-head,
.empty-th {
  width: 32px;
  height: 26px;
}

.shift-cell {
  width: 32px;
  height: 28px;
}

.grid-day {
  font-size: 10px;
  text-align: right;
  padding-right: 2px;
}

.normal-cal-wrap {
  width: 780px;
  margin: 0 auto;
}

/* 仅该容器内表格生效 */
.normal-cal-wrap .shift-table {
  width: 100%;
  table-layout: fixed;
}

/* NORMAL_USER上部カードスタイル */
.normal-top-card {
  margin-bottom: 16px;
}

.normal-row-first {
  display: flex;
  justify-content: center;
  gap: 100px;
  /* 年月と公休の間隔 */
  font-size: 18px;
}

/* 用户单元格 */
.normal-cal-wrap .normal-td-box {
  padding: 0 !important;
  position: relative;
  height: 62px;
  width: calc(100% / 7);
  overflow: hidden;
}

/* 上半区：备注文字 */
.top-area {
  position: absolute;
  font-size: 16px;
  color: #000;
  left: 2px;
  top: 2px;
  padding: 2px 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  z-index: 9;
}

.am-block {
  width: 100%;
  height: 50%;
}

.pm-block {
  width: 100%;
  height: 50%;
}

/* 日期数字：绝对定位到右下角 */
.day-number {
  position: absolute;
  right: 4px;
  bottom: 2px;
  font-size: 16px;
  /* 确保日期在最上层 */
  z-index: 10;
  padding: 0 2px;
}

.normal-cal-wrap .week-th {
  width: calc(100% / 7);
  height: 46px;
  font-size: 16px;
  background: #b8c8e0;
}

/* 仅普通用户表格里第一列变红 */
.normal-cal-wrap .shift-table th:nth-child(1),
.normal-cal-wrap .shift-table td:nth-child(1) {
  color: #f53f3f;
}

.normal-cal-wrap .shift-table th:nth-child(7),
.normal-cal-wrap .shift-table td:nth-child(7) {
  color: #06f;
}
</style>
