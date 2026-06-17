<template>
  <!-- 外层空白：清空全部选中 -->
  <div class="shift-types-container" @click="clearAllSelect">
    <div class="layout-wrapper">
      <!-- 左侧面板 -->
      <div class="left-panel">
        <div class="panel-header">
          <span>選択済み時間帯</span>
          <!-- 新增：登録按钮 -->
          <el-button @click.stop="handleRegister" class="register-btn"> 登録 </el-button>
        </div>
        <div class="panel-body" @dragover.prevent @drop.prevent="handleLeftDrop">
          <div
            v-for="item in selectedList"
            :key="item.kinmu_idx"
            class="selected-item"
            :class="{
              active: leftIds.includes(item.kinmu_idx),
              dragging: dragItemId === item.kinmu_idx,
            }"
            draggable="true"
            @dragstart="handleDragStart($event, item, 'selected')"
            @click.stop="toggleLeftSelect(item.kinmu_idx)"
          >
            <div style="display: flex; align-items: center; gap: 10px">
              <span class="time-text">
                出勤{{ toCircleNum(item.kinmu_idx) }}：{{ item.kinmu_start_time }}~{{
                  item.kinmu_end_time
                }}
              </span>
              <span class="time-total">
                {{ toCircleNum(item.kinmu_time) }}
              </span>
            </div>

            <el-input
              v-model="item.kinmu_nick_name"
              placeholder="输入别名"
              size="small"
              class="alias-input"
              @click.stop
            />
          </div>
        </div>
      </div>

      <!-- 箭头容器：移除整体 stop，内部空白会冒泡清空选中 -->
      <div class="btn-group">
        <div class="vertical-buttons">
          <!-- 仅按钮自身阻止冒泡 -->
          <el-button
            icon="ArrowUp"
            :disabled="leftIds.length === 0"
            @click.stop="moveUp"
            class="arrow-btn"
          ></el-button>
          <el-button
            icon="ArrowDown"
            :disabled="leftIds.length === 0"
            @click.stop="moveDown"
            class="arrow-btn"
          ></el-button>
        </div>
        <div class="horizontal-buttons">
          <!-- 仅按钮自身阻止冒泡 -->
          <el-button
            icon="ArrowLeft"
            :disabled="rightIds.length === 0"
            @click.stop="moveToLeft"
            class="arrow-btn"
          ></el-button>
          <el-button
            icon="ArrowRight"
            :disabled="leftIds.length === 0"
            @click.stop="moveToRight"
            class="arrow-btn"
          ></el-button>
        </div>
      </div>

      <!-- 右侧面板 -->
      <div class="right-panel">
        <div class="panel-header">選択可能時間帯</div>
        <div class="panel-body grid-container" @dragover.prevent @drop.prevent="handleRightDrop">
          <div
            v-for="item in allTimeList"
            :key="item.kinmu_idx"
            class="time-item"
            :class="{
              rightDisabled: selectedList.some((x) => x.kinmu_idx === item.kinmu_idx),
              active: rightIds.includes(item.kinmu_idx),
            }"
            :draggable="!selectedList.some((x) => x.kinmu_idx === item.kinmu_idx)"
            @dragstart="handleDragStart($event, item, 'all')"
            @click.stop="toggleRightSelect(item.kinmu_idx)"
          >
            <span class="time-text">
              出勤{{ toCircleNum(item.kinmu_idx) }}：{{ item.kinmu_start_time }}~{{
                item.kinmu_end_time
              }}
            </span>
            <div>
              <span class="green-badge">{{ toCircleNum(item.kinmu_idx) }}</span>
              <span class="time-total">{{ toCircleNum(item.kinmu_time) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const allTimeList = ref([])
const selectedList = ref([])
let dragData = null
const dragItemId = ref(null)

const leftIds = ref([])
const rightIds = ref([])

// 全局清空所有选中
const clearAllSelect = () => {
  leftIds.value = []
  rightIds.value = []
}

function toCircleNum(num) {
  const map = [
    '①',
    '②',
    '③',
    '④',
    '⑤',
    '⑥',
    '⑦',
    '⑧',
    '⑨',
    '⑩',
    '⑪',
    '⑫',
    '⑬',
    '⑭',
    '⑮',
    '⑯',
    '⑰',
    '⑱',
    '⑲',
    '⑳',
    '㉑',
    '㉒',
    '㉓',
    '㉔',
    '㉕',
    '㉖',
    '㉗',
    '㉘',
    '㉙',
    '㉚',
    '㉛',
    '㉜',
    '㉝',
  ]
  return map[num - 1] || num
}

onMounted(() => {
  // 标准结构：kinmu_idx / kinmu_start_time / kinmu_end_time
  const timeData = [
    { kinmu_idx: 1, kinmu_start_time: '09:00', kinmu_end_time: '15:45', kinmu_time: '6:00' },
    { kinmu_idx: 2, kinmu_start_time: '09:00', kinmu_end_time: '16:45', kinmu_time: '7:00' },
    { kinmu_idx: 3, kinmu_start_time: '09:00', kinmu_end_time: '18:25', kinmu_time: '8:00' },
    { kinmu_idx: 4, kinmu_start_time: '09:00', kinmu_end_time: '19:25', kinmu_time: '9:00' },
    { kinmu_idx: 5, kinmu_start_time: '09:00', kinmu_end_time: '20:25', kinmu_time: '10:00' },
    { kinmu_idx: 6, kinmu_start_time: '09:30', kinmu_end_time: '16:15', kinmu_time: '6:00' },
    { kinmu_idx: 7, kinmu_start_time: '09:30', kinmu_end_time: '17:15', kinmu_time: '7:00' },
    { kinmu_idx: 8, kinmu_start_time: '09:30', kinmu_end_time: '18:55', kinmu_time: '8:00' },
    { kinmu_idx: 9, kinmu_start_time: '09:30', kinmu_end_time: '19:55', kinmu_time: '9:00' },
    { kinmu_idx: 10, kinmu_start_time: '09:30', kinmu_end_time: '20:55', kinmu_time: '10:00' },
    { kinmu_idx: 11, kinmu_start_time: '10:30', kinmu_end_time: '17:15', kinmu_time: '6:00' },
    { kinmu_idx: 12, kinmu_start_time: '10:30', kinmu_end_time: '18:15', kinmu_time: '7:00' },
    { kinmu_idx: 13, kinmu_start_time: '10:30', kinmu_end_time: '19:55', kinmu_time: '8:00' },
    { kinmu_idx: 14, kinmu_start_time: '10:30', kinmu_end_time: '20:55', kinmu_time: '9:00' },
    { kinmu_idx: 15, kinmu_start_time: '10:30', kinmu_end_time: '21:55', kinmu_time: '10:00' },
    { kinmu_idx: 16, kinmu_start_time: '11:00', kinmu_end_time: '17:45', kinmu_time: '6:00' },
    { kinmu_idx: 17, kinmu_start_time: '11:00', kinmu_end_time: '18:45', kinmu_time: '7:00' },
    { kinmu_idx: 18, kinmu_start_time: '11:00', kinmu_end_time: '20:25', kinmu_time: '8:00' },
    { kinmu_idx: 19, kinmu_start_time: '11:00', kinmu_end_time: '21:25', kinmu_time: '9:00' },
    // { kinmu_idx: 20, kinmu_start_time: '11:00', kinmu_end_time: '22:25', kinmu_time: '6:00' },
    // { kinmu_idx: 21, kinmu_start_time: '15:40', kinmu_end_time: '22:25', kinmu_time: '6:00' },
    // { kinmu_idx: 22, kinmu_start_time: '14:40', kinmu_end_time: '22:25', kinmu_time: '6:00' },
    // { kinmu_idx: 23, kinmu_start_time: '13:00', kinmu_end_time: '22:25', kinmu_time: '6:00' },
    // { kinmu_idx: 24, kinmu_start_time: '12:00', kinmu_end_time: '22:25', kinmu_time: '6:00' },
    { kinmu_idx: 20, kinmu_start_time: '14:40', kinmu_end_time: '21:25', kinmu_time: '6:00' },
    { kinmu_idx: 21, kinmu_start_time: '13:40', kinmu_end_time: '21:25', kinmu_time: '7:00' },
    { kinmu_idx: 22, kinmu_start_time: '12:00', kinmu_end_time: '21:25', kinmu_time: '8:00' },
    { kinmu_idx: 23, kinmu_start_time: '10:00', kinmu_end_time: '21:25', kinmu_time: '10:00' },
    { kinmu_idx: 24, kinmu_start_time: '14:10', kinmu_end_time: '20:55', kinmu_time: '6:00' },
    { kinmu_idx: 25, kinmu_start_time: '13:10', kinmu_end_time: '20:55', kinmu_time: '7:00' },
    { kinmu_idx: 26, kinmu_start_time: '11:30', kinmu_end_time: '20:55', kinmu_time: '8:00' },
    { kinmu_idx: 27, kinmu_start_time: '13:40', kinmu_end_time: '20:25', kinmu_time: '6:00' },
    { kinmu_idx: 28, kinmu_start_time: '12:40', kinmu_end_time: '20:25', kinmu_time: '7:00' },
    { kinmu_idx: 29, kinmu_start_time: '10:00', kinmu_end_time: '20:25', kinmu_time: '9:00' },
    // { kinmu_idx: 35, kinmu_start_time: '16:10', kinmu_end_time: '22:55', kinmu_time: '6:00' },
    // { kinmu_idx: 36, kinmu_start_time: '15:10', kinmu_end_time: '22:55', kinmu_time: '6:00' },
    // { kinmu_idx: 37, kinmu_start_time: '13:30', kinmu_end_time: '22:55', kinmu_time: '6:00' },
    // { kinmu_idx: 38, kinmu_start_time: '12:30', kinmu_end_time: '22:55', kinmu_time: '6:00' },
    // { kinmu_idx: 39, kinmu_start_time: '11:30', kinmu_end_time: '22:55', kinmu_time: '6:00' },
    { kinmu_idx: 30, kinmu_start_time: '15:10', kinmu_end_time: '21:55', kinmu_time: '6:00' },
    { kinmu_idx: 31, kinmu_start_time: '14:10', kinmu_end_time: '21:55', kinmu_time: '7:00' },
    { kinmu_idx: 32, kinmu_start_time: '12:30', kinmu_end_time: '21:55', kinmu_time: '8:00' },
    { kinmu_idx: 33, kinmu_start_time: '11:30', kinmu_end_time: '21:55', kinmu_time: '9:00' },
  ]

  const col1 = [] // 第1列：1-15
  const col2 = [] // 第2列：16-30
  const col3 = [] // 第3列：31-43

  for (const item of timeData) {
    if (item.kinmu_idx <= 15) {
      col1.push(item)
    } else if (item.kinmu_idx <= 30) {
      col2.push(item)
    } else {
      col3.push(item)
    }
  }

  allTimeList.value = [...col1, ...col2, ...col3]
  // ========== 左侧直接预设 3、5、7，别名为空 ==========
  selectedList.value = [
    {
      kinmu_idx: 3,
      kinmu_start_time: '09:00',
      kinmu_end_time: '18:25',
      kinmu_nick_name: 'A',
      kinmu_time: '8:00',
    },
    {
      kinmu_idx: 5,
      kinmu_start_time: '09:00',
      kinmu_end_time: '20:25',
      kinmu_nick_name: '出勤⑤',
      kinmu_time: '10:00',
    },
    {
      kinmu_idx: 7,
      kinmu_start_time: '09:30',
      kinmu_end_time: '17:15',
      kinmu_nick_name: 'C',
      kinmu_time: '7:00',
    },
  ]
})

// 切换左侧选中
const toggleLeftSelect = (kinmu_idx) => {
  rightIds.value = []
  const idx = leftIds.value.indexOf(kinmu_idx)
  idx > -1 ? leftIds.value.splice(idx, 1) : leftIds.value.push(kinmu_idx)
}

// 右侧置灰条目禁止选中
const toggleRightSelect = (kinmu_idx) => {
  const isExistInLeft = selectedList.value.some((x) => x.kinmu_idx === kinmu_idx)
  if (isExistInLeft) return

  leftIds.value = []
  const idx = rightIds.value.indexOf(kinmu_idx)
  idx > -1 ? rightIds.value.splice(idx, 1) : rightIds.value.push(kinmu_idx)
}

// 右移到左侧
const moveToLeft = () => {
  rightIds.value.forEach((kinmu_idx) => {
    const item = allTimeList.value.find((t) => t.kinmu_idx === kinmu_idx)
    if (item && !selectedList.value.some((s) => s.kinmu_idx === kinmu_idx)) {
      // 左侧追加 kinmu_nick_name 别名字段，默认空
      selectedList.value.push({
        ...item,
        kinmu_nick_name: toCircleNum(item.kinmu_idx),
      })
    }
  })
  rightIds.value = []
}

// 左移回右侧
const moveToRight = () => {
  selectedList.value = selectedList.value.filter((item) => !leftIds.value.includes(item.kinmu_idx))
  leftIds.value = []
}

// 左侧上移
const moveUp = () => {
  const selectedIndices = leftIds.value
    .map((kinmu_idx) => selectedList.value.findIndex((item) => item.kinmu_idx === kinmu_idx))
    .filter((idx) => idx !== -1)
    .sort((a, b) => a - b)

  if (selectedIndices.some((idx) => idx === 0)) return

  selectedIndices.forEach((idx) => {
    const [item] = selectedList.value.splice(idx, 1)
    selectedList.value.splice(idx - 1, 0, item)
  })
}

// 左侧下移
const moveDown = () => {
  const selectedIndices = leftIds.value
    .map((kinmu_idx) => selectedList.value.findIndex((item) => item.kinmu_idx === kinmu_idx))
    .filter((idx) => idx !== -1)
    .sort((a, b) => b - a)

  if (selectedIndices.some((idx) => idx === selectedList.value.length - 1)) return

  selectedIndices.forEach((idx) => {
    const [item] = selectedList.value.splice(idx, 1)
    selectedList.value.splice(idx + 1, 0, item)
  })
}

function handleDragStart(e, item, from) {
  dragData = { item, from }
  dragItemId.value = item.kinmu_idx
  e.dataTransfer.effectAllowed = 'move'
}

function handleLeftDrop(e) {
  if (!dragData) return
  if (dragData.from === 'all') {
    if (!selectedList.value.some((x) => x.kinmu_idx === dragData.item.kinmu_idx)) {
      selectedList.value.push({
        ...dragData.item,
        kinmu_nick_name: '',
      })
    }
  }
  if (dragData.from === 'selected') {
    const dragIndex = selectedList.value.findIndex((x) => x.kinmu_idx === dragData.item.kinmu_idx)
    const dropIndex = Array.from(e.currentTarget.children).findIndex((el) => el.contains(e.target))
    if (dragIndex > -1 && dropIndex > -1 && dragIndex !== dropIndex) {
      const [removed] = selectedList.value.splice(dragIndex, 1)
      selectedList.value.splice(dropIndex, 0, removed)
    }
  }
  dragData = null
  dragItemId.value = null
}

function handleRightDrop() {
  if (!dragData) return
  if (dragData.from === 'selected') {
    selectedList.value = selectedList.value.filter(
      (item) => item.kinmu_idx !== dragData.item.kinmu_idx,
    )
  }
  dragData = null
  dragItemId.value = null
}

// 提交数据
const handleRegister = async () => {
  if (selectedList.value.length === 0) {
    ElMessage.warning('登録する時間帯が選択されていません')
    return
  }

  // 按标准结构输出：kinmu_idx / kinmu_start_time / kinmu_end_time / kinmu_nick_name / sort
  const submitData = selectedList.value.map((item, index) => ({
    kinmu_idx: item.kinmu_idx,
    kinmu_start_time: item.kinmu_start_time,
    kinmu_end_time: item.kinmu_end_time,
    kinmu_nick_name: item.kinmu_nick_name || '',
    sort: index + 1,
  }))

  console.log('登録するデータ：', submitData)

  try {
    // await api.registerShiftTypes(submitData)
    ElMessage.success('登録が完了しました')
  } catch (err) {
    ElMessage.error('登録に失敗しました')
    console.error(err)
  }
}
</script>

<style scoped>
.shift-types-container {
  min-height: 85vh;
  background-color: #f5f7fa;
}

.layout-wrapper {
  display: flex;
  align-items: stretch;
  gap: 50px;
  height: calc(100vh - 90px);
}

.left-panel,
.right-panel {
  background: #fff;
  display: flex;
  flex-direction: column;
}

.left-panel {
  flex: 1;
  width: 350px;
}

.right-panel {
  flex: 2;
  width: 500px;
}

.panel-header {
  position: relative;
  padding: 12px 16px;
  background-color: #fff3d9;
  color: #000;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.panel-body {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

.btn-group {
  height: 300px;
  margin: auto 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 50px;
}

.vertical-buttons,
.horizontal-buttons {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 80px;
  gap: 10px;
}

.grid-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  grid-auto-flow: column;
  grid-auto-rows: minmax(0, 1fr);
  grid-template-rows: repeat(15, auto);
}

.arrow-btn {
  padding: 0 !important;
  margin: 0 !important;
  width: 80px !important;
  height: 40px;
}

.arrow-btn:not(:disabled) {
  box-shadow: 0 0 0 1px #409eff;
}

.time-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background-color: #fff;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  cursor: grab;
  font-size: 14px;
  user-select: none;
  transition: all 0.2s ease;
}

.time-item:active {
  cursor: grabbing;
}

.time-item.rightDisabled {
  background-color: #f5f7fa;
  border-color: #ebeef5;
  color: #c0c4cc;
  cursor: not-allowed;
}

.time-item.active {
  background-color: #ecf5ff;
  border-color: #409eff;
  color: #409eff;
}

.green-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 23px;
  background-color: #96d25a;
  color: #000;
  border-radius: 2px;
  font-size: 16px;
  flex-shrink: 0;
}

.selected-item {
  display: flex;
  align-items: center;
  gap: 50px;
  padding: 5px 10px;
  background-color: #fff;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  margin-bottom: 8px;
  cursor: grab;
  user-select: none;
  transition: all 0.2s ease;
}

.selected-item:active {
  cursor: grabbing;
}

.selected-item.active {
  background-color: #ecf5ff;
  border-color: #409eff;
}

.selected-item.dragging {
  opacity: 0.5;
  transform: scale(1.02);
}

.time-text {
  flex-shrink: 0;
  height: 23px;
  font-size: 14px;
  display: inline-block;
  align-self: center; /* 禁止被拉伸，使用自身高度 */
  line-height: 23px;
}

.alias-input {
  flex: 1;
  height: 30px;
}

.register-btn {
  position: absolute;
  height: 30px;
  width: 80px;
  font-size: 14px;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
}

.time-total {
  width: 40px;
  height: 23px;
  line-height: 23px;
  margin-left: 5px;
  font-size: 14px;
  display: inline-block;
  text-align: center;
  vertical-align: top;
}
</style>
