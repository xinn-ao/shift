<template>
  <div class="schedule-container">
    <!-- 左侧拖拽按钮 + 操作按钮 -->
    <div class="drag-buttons">
      <div class="drag-btn all-day" draggable="true" @dragstart="onDragStart($event, 'all')" title="全日休：セルへドラッグして設定">
        全日休
      </div>
      <div class="drag-btn morning-half" draggable="true" @dragstart="onDragStart($event, 'morning')"
        title="午前半日休：セルへドラッグして設定">
        午前半日休
      </div>
      <div class="drag-btn afternoon-half" draggable="true" @dragstart="onDragStart($event, 'afternoon')"
        title="午後半日休：セルへドラッグして設定">
        午後半日休
      </div>

      <!-- 新增：応援拖拽按钮 -->
      <div class="drag-btn support-btn" draggable="true" @dragstart="onDragStart($event, 'support')"
        title="応援：セルへドラッグして店舗を選択">
        応援
      </div>

      <div class="operate-btn-group">
        <button class="btn save-btn" @click="saveData">保存</button>
        <button class="btn reset-btn" @click="resetData">リセット</button>
      </div>

      <!-- 垃圾桶：拖入此处取消休假/応援 -->
      <div class="trash-box" @dragover.prevent @drop="handleDropToTrash">
        🗑️ ここへドラッグ → 解除
      </div>
    </div>

    <!-- 排班表主体 -->
    <div class="schedule-table-wrapper">
      <table class="schedule-table">
        <thead>
          <tr>
            <th rowspan="2">役職</th>
            <th rowspan="2">氏名</th>
            <th rowspan="2">休暇</th>
            <th rowspan="2">設定</th>
            <th v-for="(day, index) in days" :key="index"
              :class="['date-header', { weekend: day.isWeekend, holiday: day.isHoliday }]">
              <div class="date-num">{{ day.day }}</div>
              <div class="date-week">{{ day.week }}</div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(staff, sIndex) in staffList" :key="sIndex">
            <td>{{ staff.role }}</td>
            <td>{{ staff.name }}</td>
            <td :class="['rest-day', { yellow: staff.restDayHighlight }]">{{ staff.restDay }}</td>
            <td>{{ staff.setting }}</td>
            <td v-for="(day, dIndex) in days" :key="dIndex" class="day-cell" draggable="true" @dragover.prevent
              @drop="onDrop($event, staff, day)" @dragstart="onCellDragStart($event, staff, day)"
              @dblclick="clearCellAll(staff, day)">
              <!-- 休假色块 -->
              <div class="half-wrapper" :class="getRestClass(staff, day)">
                <div class="half-left"></div>
                <div class="half-right"></div>
              </div>
              <!-- 单元格文字（応援情報） -->
              <div class="cell-text" v-if="getCellText(staff, day)">
                {{ getCellText(staff, day) }}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ========== 応援設定 モーダルウィンドウ ========== -->
    <div class="modal-mask" v-if="showModal" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-title">応援先店舗選択</div>

        <!-- Tabタブ -->
        <div class="tab-wrap">
          <span class="tab-item" :class="{ active: activeTab === 'tab1' }" @click="activeTab = 'tab1'">
            グループA
          </span>
          <span class="tab-item" :class="{ active: activeTab === 'tab2' }" @click="activeTab = 'tab2'">
            グループB
          </span>
          <span class="tab-item" :class="{ active: activeTab === 'tab3' }" @click="activeTab = 'tab3'">
            グループC
          </span>
        </div>

        <!-- Tabコンテンツ -->
        <div class="tab-content">
          <div v-if="activeTab === 'tab1'">
            <label>店舗選択：</label>
            <select v-model="selectShop" class="shop-select">
              <option value="">-- 選択してください --</option>
              <option v-for="shop in shopListA" :key="shop.shopCode" :value="shop.shopCode + '|' + shop.shopName">
                {{ shop.shopCode }} {{ shop.shopName }}
              </option>
            </select>
          </div>

          <div v-if="activeTab === 'tab2'">
            <label>店舗選択：</label>
            <select v-model="selectShop" class="shop-select">
              <option value="">-- 選択してください --</option>
              <option v-for="shop in shopListB" :key="shop.shopCode" :value="shop.shopCode + '|' + shop.shopName">
                {{ shop.shopCode }} {{ shop.shopName }}
              </option>
            </select>
          </div>

          <div v-if="activeTab === 'tab3'">
            <label>店舗選択：</label>
            <select v-model="selectShop" class="shop-select">
              <option value="">-- 選択してください --</option>
              <option v-for="shop in shopListC" :key="shop.shopCode" :value="shop.shopCode + '|' + shop.shopName">
                {{ shop.shopCode }} {{ shop.shopName }}
              </option>
            </select>
          </div>
        </div>

        <!-- ボタン -->
        <div class="modal-btn-group">
          <button class="btn confirm-btn" @click="confirmShop">確定</button>
          <button class="btn cancel-btn" @click="closeModal">キャンセル</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { DateItem, StaffInfo } from '@/utils/date'
import { getJpDateRange } from '@/utils/date'

// ===================== 基礎データ =====================
const days = ref<DateItem[]>([])

// 休暇種別
const restTypeInfo = ref<Record<string, string>>({
  allDays: 'all',
  morningHalf: 'morning',
  afternoonHalf: 'afternoon',
  support: 'support'
})

// 従業員データ
const staffList = ref<StaffInfo[]>([
  { role: '店長', name: '青山太郎', id: '10001', restDay: 10, restDayHighlight: true, setting: 9, restDays: { allDays: [21, 27], afternoonHalf: [1, 3] } },
  { role: '副店長', name: '関根次郎', id: '10002', restDay: 8, restDayHighlight: true, setting: 9, restDays: { morningHalf: [29, 4] } },
  { role: '社員', name: '中澤三郎', id: '10003', restDay: 9, restDayHighlight: false, setting: 9, restDays: { morningHalf: [4, 6] } },
  { role: 'パート', name: '楢崎四郎', id: '10004', restDay: 10, restDayHighlight: false, restDays: { afternoonHalf: [29, 5] } },
  { role: 'パート', name: '西本五郎', id: '10005', restDay: 13, restDayHighlight: false, setting: 9, },
  { role: '応援', name: '', id: '10006', restDay: 0, restDayHighlight: false, setting: 9, restDays: { afternoonHalf: [27, 7] }, isSupport: true, supportDays: [27, 3, 7, 8], shopCode: '248', shopName: '岩崎' },
])

// セル表示文字（店舗情報）
const cellTexts = ref<Record<string, string>>({
  '10006-27': '248 岩崎',
  '10006-7': '248 岩崎'
})
// 休暇状態管理
const restStatus = ref<Record<string, string | undefined>>({})
// 現在ドラッグ種別
const dragType = ref('')
// ドラッグ中のセル情報
const draggingCell = ref<{ staffId: string; dayNum: number } | null>(null)

// ========== 応援モーダル関連 ==========
const showModal = ref(false)
const activeTab = ref('tab1')
const selectShop = ref('')
// 現在設定対象のセルキー
const currentCellKey = ref('')

// 店舗リスト（Tab別）
const shopListA = ref([
  { shopCode: '248', shopName: '岩崎' },
  { shopCode: '101', shopName: '東京本店' },
  { shopCode: '102', shopName: '新宿店' }
])
const shopListB = ref([
  { shopCode: '201', shopName: '大阪店' },
  { shopCode: '202', shopName: '京都店' }
])
const shopListC = ref([
  { shopCode: '301', shopName: '名古屋店' },
  { shopCode: '302', shopName: '横浜店' }
])

/**
* 初期化
*/
onMounted(() => {
  initHistoryData();
  initStaffInfoToPage();
})

/**
 * 初期表示データ作成
 */
function initStaffInfoToPage() {
  staffList.value.forEach((staffInfo) => {
    if (staffInfo.restDays) {
      Object.keys(staffInfo.restDays).forEach((restDayType) => {
        const dayList = staffInfo.restDays?.[restDayType]
        if (!dayList) return
        dayList.forEach((restDayIndex) => {
          restStatus.value[`${staffInfo.id}-${restDayIndex}`] = restTypeInfo.value[restDayType]
        })
      })
    }
    if (staffInfo.isSupport && staffInfo.supportDays) {
      staffInfo.supportDays.forEach((restDayIndex) => {
        cellTexts.value[`${staffInfo.id}-${restDayIndex}`] = `${staffInfo.shopCode}\n${staffInfo.shopName}`
      })
    }
  });
}

/**
 * カレンダー日付作成
 */
function initHistoryData() {
  days.value = getJpDateRange();
}

// ========== ドラッグ共通ロジック ==========
/**
 * ボタンドラッグ開始
 */
const onDragStart = (e: Event, type: string) => {
  dragType.value = type
  draggingCell.value = null
}

/**
 * セル自身をドラッグ開始
 */
const onCellDragStart = (e: Event, staffInfo: StaffInfo, dayInfo: DateItem) => {
  draggingCell.value = {
    staffId: staffInfo.id,
    dayNum: dayInfo.day
  }
  dragType.value = ''
}

/**
 * セルへドロップ
 */
const onDrop = (e: Event, staffInfo: StaffInfo, dayInfo: DateItem) => {
  const key = `${staffInfo.id}-${dayInfo.day}`

  // 既存セルをドラッグして移動
  if (draggingCell.value) {
    const oldKey = `${draggingCell.value.staffId}-${draggingCell.value.dayNum}`
    delete restStatus.value[oldKey]
    delete cellTexts.value[oldKey]
  }

  // 休暇設定
  if (dragType.value && dragType.value !== 'support') {
    restStatus.value[key] = dragType.value
  }
  // 応援ドラッグ → モーダル表示
  else if (dragType.value === 'support') {
    currentCellKey.value = key
    showModal.value = true
    activeTab.value = 'tab1'
    selectShop.value = ''
  }

  draggingCell.value = null
}

/**
 * ゴミ箱へドロップ：休暇+応援両方解除
 */
const handleDropToTrash = () => {
  if (!draggingCell.value) return
  const key = `${draggingCell.value.staffId}-${draggingCell.value.dayNum}`
  delete restStatus.value[key]
  delete cellTexts.value[key]
  draggingCell.value = null
}

/**
 * ダブルクリック：休暇・応援を両方解除
 */
const clearCellAll = (staffInfo: StaffInfo, dayInfo: DateItem) => {
  const key = `${staffInfo.id}-${dayInfo.day}`
  delete restStatus.value[key]
  delete cellTexts.value[key]
}

/**
 * 休暇CSSクラス取得
 */
const getRestClass = (staffInfo: StaffInfo, dayInfo: DateItem) => {
  const key = `${staffInfo.id}-${dayInfo.day}`
  return restStatus.value[key] || ''
}

/**
 * セル文字（応援店舗）取得
 */
const getCellText = (staffInfo: StaffInfo, dayInfo: DateItem) => {
  const key = `${staffInfo.id}-${dayInfo.day}`
  return cellTexts.value[key] || ''
}

// ========== モーダル操作 ==========
/**
 * モーダルを閉じる
 */
const closeModal = () => {
  showModal.value = false
  selectShop.value = ''
  currentCellKey.value = ''
}

/**
 * 店舗確定 → セルに文字表示
 */
const confirmShop = () => {
  if (!selectShop.value) {
    alert('店舗を選択してください')
    return
  }
  // 分割：店舗コード | 店舗名
  const [code, name] = selectShop.value.split('|')
  cellTexts.value[currentCellKey.value] = `${code}\n${name}`
  closeModal()
}

// ========== 保存・リセット ==========
function saveData() {
  localStorage.setItem('schedule_rest_data', JSON.stringify(restStatus.value))
  localStorage.setItem('schedule_support_data', JSON.stringify(cellTexts.value))
  alert("保存完了")
}

function resetData() {
  restStatus.value = {}
  cellTexts.value = {}
  localStorage.removeItem('schedule_rest_data')
  localStorage.removeItem('schedule_support_data')
}
</script>

<style scoped>
.schedule-container {
  display: flex;
  gap: 20px;
  padding: 20px;
  font-family: "MS Mincho", "Meiryo", sans-serif;
}

.drag-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.drag-btn {
  padding: 10px 15px;
  border-radius: 4px;
  color: #fff;
  text-align: center;
  cursor: grab;
  user-select: none;
}

.all-day {
  background: #ff9966;
}

.morning-half {
  background: #ffcc99;
}

.afternoon-half {
  background: #ffcc99;
}

/* 応援ボタン色 */
.support-btn {
  background: #67c23a;
}

.operate-btn-group {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.btn {
  padding: 6px 12px;
  cursor: pointer;
  border: none;
  border-radius: 4px;
}

.save-btn {
  background: #409eff;
  color: #fff;
}

.reset-btn {
  background: #f56c6c;
  color: #fff;
}

/* ゴミ箱 */
.trash-box {
  margin-top: 30px;
  padding: 16px 8px;
  border: 2px dashed #999;
  border-radius: 6px;
  text-align: center;
  color: #666;
  cursor: pointer;
}

.schedule-table-wrapper {
  overflow-x: auto;
}

.schedule-table {
  border-collapse: collapse;
  border: 1px solid #333;
}

th,
td {
  border: 1px solid #333;
  text-align: center;
  padding: 4px;
  min-width: 35px;
  position: relative;
}

thead th {
  background: #fff3cd;
}

.date-header .date-num {
  font-weight: bold;
  font-size: 14px;
}

.date-header .date-week {
  font-size: 12px;
  color: #666;
}

.date-header.weekend {
  background: #e6f7ff;
  color: #1890ff;
}

.date-header.holiday {
  background: #fff2f0;
  color: #ff4d4f;
}

.rest-day.yellow {
  background: #fff3cd;
}

.day-cell {
  height: 50px;
  position: relative;
  cursor: grab;
}

.half-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
}

.half-left,
.half-right {
  width: 50%;
  height: 100%;
}

.all .half-left,
.all .half-right {
  background: #ff9966;
}

.morning .half-right {
  background: #ff9966;
}

.afternoon .half-left {
  background: #ff9966;
}

.cell-text {
  position: relative;
  z-index: 1;
  font-size: 12px;
  color: #333;
  white-space: pre-line;
}

/* ========== モーダルスタイル ========== */
.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.modal-content {
  width: 420px;
  background: #fff;
  border-radius: 6px;
  padding: 20px;
}

.modal-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 15px;
  text-align: center;
}

/* Tabスタイル */
.tab-wrap {
  display: flex;
  border-bottom: 1px solid #ccc;
  margin-bottom: 15px;
}

.tab-item {
  padding: 8px 16px;
  cursor: pointer;
  border: 1px solid #ccc;
  border-bottom: none;
  margin-right: 5px;
  border-top-left-radius: 4px;
  border-top-right-radius: 4px;
  background: #f5f5f5;
}

.tab-item.active {
  background: #409eff;
  color: #fff;
  border-color: #409eff;
}

.tab-content {
  padding: 10px 0 20px;
}

.shop-select {
  width: 280px;
  height: 32px;
  margin-left: 10px;
}

.modal-btn-group {
  text-align: center;
  margin-top: 20px;
}

.confirm-btn {
  background: #67c23a;
  color: #fff;
  margin-right: 10px;
}

.cancel-btn {
  background: #909399;
  color: #fff;
}
</style>