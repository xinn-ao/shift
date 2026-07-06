<template>
  <div class="container">
    <!-- 画面タイトル -->
    <div class="page-title">希望休設定</div>

    <!-- 上部情報・ボタンエリア el-card -->
    <el-card shadow="hover" class="top-card">
      <!-- 1行目：日付・公休・選択数 -->
      <div class="row-first">
        <div class="now-date">
          <span class="now-date-day">当日：{{ nowDateStr }}</span>
          <span class="now-date-month">当月：{{ nowMonthStr }}</span>
        </div>
        
        <div class="hol-text">
          <span>公休数：{{ monthHolidayCnt }}日</span>
        </div>
      </div>
      <!-- 2行目：右寄せ 登録・キャンセル -->
      <div class="row-btn">
        <el-button
          icon="ArrowLeft"
          v-if="userStore.role === 'NORMAL_USER'"
          type="primary"
          @click="$router.push({ name: 'NormalUserMenu' })"
          >戻る</el-button
        >
        <el-button type="primary" @click="handleSave">登録</el-button>
      </div>
    </el-card>

    <!-- カレンダー：画面中央配置、el-cardなし、大きめ正方形 -->
    <div
      class="calendar-box"
      style="padding: 20px 30px; background-color: #fff; margin: 20px 0 6px 0"
    >
      <div class="calendar-wrap">
        <table class="calendar-table">
          <thead>
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
            <tr v-for="(weekArr, idx) in calendarList" :key="idx">
              <td
                v-for="(dayItem, wIdx) in weekArr"
                :key="wIdx"
                :class="[dayItem.type, { selected: selectDays.includes(dayItem.fullDate) }]"
                @click="toggleSelect(dayItem)"
              >
                <span class="day-num" :style="{
                                color:
                                    (dayItem?.type === 'sun' || dayItem?.isHoliday) ? '#f00' : dayItem?.type === 'sat' ? '#0066ff' : '#333',
                                }">
                                {{ dayItem?.day ?? '' }}
                            </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { isHoliday } from 'jp-holidays'

// 实例仓库
const userStore = useUserStore()

type DayType = 'sun' | 'sat' | 'normal'
interface DayItem {
  fullDate: string
  year: number
  month: number
  day: number
  type: DayType
  isHoliday: boolean
}

// 当日 YYYY/MM/DD
const now = new Date()
const currentY = now.getFullYear()
const currentM = now.getMonth() + 1
const currentD = now.getDate()
const nowDateStr = computed(() => {
  const m = String(currentM).padStart(2, '0')
  const d = String(currentD).padStart(2, '0')
  return `${currentY}/${m}/${d}`
})
const nowMonthStr = computed(()=>{
  const y= currentY
  const m = currentM
  const d= currentD

  let targetYear = y
  let targetMonth = d >= 21 ? m + 1 : m

  if (targetMonth > 12) {
      targetMonth = 1
      targetYear += 1
  }

  const month = String(targetMonth).padStart(2, '0')
  return `${targetYear}/${month}`
})

const monthHolidayCnt = ref(9)
// 【DBから取得済の初期既存希望休日】
const initDefaultDays = ref<string[]>(['2026-05-22', '2026-05-25', '2026-06-02'])
// 画面リアルタイム選択配列
const selectDays = ref<string[]>([])

// 期間：前月21日～当月20日
const getStartEnd = () => {
  let startY = currentY
  let startM = currentM - 1
  if (startM === 0) {
    startY = currentY - 1
    startM = 12
  }
  const endY = currentY
  const endM = currentM
  return {
    start: new Date(startY, startM - 1, 21),
    end: new Date(endY, endM - 1, 20),
  }
}

const getDayType = (week: number): DayType => {
  if (week === 0) return 'sun'
  if (week === 6) return 'sat'
  return 'normal'
}

// カレンダー全日付作成
const calendarList = computed(() => {
  const { start, end } = getStartEnd()
  const list: DayItem[] = []
  const startWeek = start.getDay()
  for (let i = 0; i < startWeek; i++) {
    list.push({ fullDate: '', year: 0, month: 0, day: 0, type: 'normal',isHoliday: false })
  }
  const curr = new Date(start)
  while (curr <= end) {
    const y = curr.getFullYear()
    const m = curr.getMonth() + 1
    const d = curr.getDate()
    const w = curr.getDay()
    const isHolidayFlag = isHoliday(curr) 
    list.push({
      fullDate: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      year: y,
      month: m,
      day: d,
      type: getDayType(w),
      isHoliday: isHolidayFlag,
    })
    curr.setDate(curr.getDate() + 1)
  }
  const res: DayItem[][] = []
  for (let i = 0; i < list.length; i += 7) {
    res.push(list.slice(i, i + 7))
  }
  return res
})

// 初期ロード：初期データをコピー → 画面初期選択表示
onMounted(() => {
  selectDays.value = [...initDefaultDays.value]
})

// クリックで手動変更
const toggleSelect = (item: DayItem) => {
  if (!item.fullDate) return
  const idx = selectDays.value.indexOf(item.fullDate)
  if (idx > -1) {
    selectDays.value.splice(idx, 1)
  } else {
    selectDays.value.push(item.fullDate)
  }
}

// 登録：保存成功後初期値更新
const handleSave = () => {
  const num = selectDays.value.length
  if (num === 0) {
    ElMessage.warning('希望休日を選択してください')
    return
  }
  if (num > monthHolidayCnt.value) {
    ElMessage.error(`選択(${num}日)が公休数(${monthHolidayCnt.value}日)を超えたため登録不可`)
    return
  }
  // 確認ダイアログ表示
  ElMessageBox.confirm('選択した日程を希望休として登録します。よろしいですか？', '確認', {
    confirmButtonText: '確認',
    cancelButtonText: 'キャンセル',
    type: 'info',
    customClass: 'my-top-msg-box',
  })
    .then(() => {
      // 確認押下：保存処理実行
      initDefaultDays.value = [...selectDays.value]
      console.log('保存確定日付', selectDays.value)
      ElMessage.success('希望休設定は登録完了しました。')
    })
    .catch(() => {
      // キャンセル押下：何もしない
      ElMessage.info('登録をキャンセルしました')
    })
}

// キャンセル：手動変更破棄、初期DB状態に戻す
const handleCancel = () => {
  selectDays.value = [...initDefaultDays.value]
  ElMessage.info('変更キャンセル、初期状態へ戻りました。')
}
</script>

<style scoped>
.container {
  padding: 16px;
  background: #f5f7fa;
  min-height: 85vh;
}

.top-card {
  margin-bottom: 16px;
}

.row-first {
  display: flex;
  justify-content: space-between;
  font-size: 16px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
  margin-bottom: 10px;
}

.now-date{
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.sel-text {
  margin-left: 20px;
  color: #f56c6c;
}

.hol-text{
  display: flex;
  align-items: flex-end;
}

.row-btn {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.calendar-box {
  display: flex;
  justify-content: center;
}

.calendar-wrap {
  width: 780px;
  padding: 10px;
}

.calendar-table {
  width: 100%;
  border-collapse: collapse;
  border: 0.5px solid #999;
}

.week-th {
  width: calc(100% / 7);
  height: 46px;
  font-size: 16px;
  background: #b8c8e0;
  border: 0.5px solid #999;
}

.calendar-table td {
  width: calc(100% / 7);
  height: 62px;
  font-size: 16px;
  cursor: pointer;
  border: 0.5px solid #999;
  position: relative;
}

.calendar-table td .day-number {
  position: absolute;
  right: 4px;
  bottom: 2px;
  font-size: 16px;
  /* 确保日期在最上层 */
  z-index: 10;
  padding: 0 2px;
}

.calendar-table th:nth-child(1),
.calendar-table td:nth-child(1) {
  color: #f53f3f;
}

.calendar-table th:nth-child(7),
.calendar-table td:nth-child(7) {
  color: #06f;
}

.calendar-table td.selected {
  background: #e6f7ff;
}

/* :deep(.el-message-box) {
  top: 100px !important;
} */
</style>
<style lang="scss">
.my-top-msg-box {
  position: fixed !important;
  top: 30% !important;
  left: 50% !important;
  transform: translateX(-50%) !important;
}
</style>
