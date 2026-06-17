<template>
    <div class="schedule-container">
        <!-- 排班表主体 顶部 -->
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
                        <td v-for="(day, dIndex) in days" :key="dIndex" class="day-cell" draggable="true"
                            @dragover.prevent @drop="onDrop($event, staff, day)"
                            @dragstart="onCellDragStart($event, staff, day)" @dblclick="clearCellAll(staff, day)">
                            <!-- 出勤色块（底层） -->
                            <div class="attend-wrapper" :class="getAttendClass(staff, day)">
                                <div class="attend-half-left"></div>
                                <div class="attend-half-right"></div>
                            </div>
                            <!-- 休暇色块（上层） -->
                            <div class="half-wrapper" :class="getRestClass(staff, day)">
                                <div class="half-left"></div>
                                <div class="half-right"></div>
                            </div>
                            <!-- 応援文字（最顶层） -->
                            <div class="cell-text" v-if="getCellText(staff, day)">
                                {{ getCellText(staff, day) }}
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- 底部拖拽按钮区域（按图样式横向排列） -->
        <!-- 底部拖拽按钮区域（完全匹配参考图的三列排版） -->
        <div class="drag-area">
            <!-- 出勤区分 第一列 -->
            <div class="legend-column">
                <div class="legend-title">出勤区分</div>
                <div class="legend-item">
                    <div class="drag-btn attend" draggable="true" @dragstart="onDragStart($event, 'attend')" title="出勤">
                    </div>
                    <span>出勤</span>
                </div>
                <div class="legend-item">
                    <div class="drag-btn late" draggable="true" @dragstart="onDragStart($event, 'late')"
                        title="時差出勤(遅番)"></div>
                    <span>時差出勤(遅番)</span>
                </div>
                <div class="legend-item">
                    <div class="drag-btn early" draggable="true" @dragstart="onDragStart($event, 'early')"
                        title="時差出勤(早番)"></div>
                    <span>時差出勤(早番)</span>
                </div>
                <div class="legend-item">
                    <div class="drag-btn half-am-leave" draggable="true" @dragstart="onDragStart($event, 'halfAmLeave')"
                        title="前半日休日"></div>
                    <span>前半日休日</span>
                </div>
                <div class="legend-item">
                    <div class="drag-btn half-pm-leave" draggable="true" @dragstart="onDragStart($event, 'halfPmLeave')"
                        title="後半日休日"></div>
                    <span>後半日休日</span>
                </div>
            </div>

            <!-- 休暇区分 第二列 -->
            <div class="legend-column">
                <div class="legend-title">休暇区分</div>
                <div class="legend-item">
                    <div class="drag-btn paid-leave" draggable="true" @dragstart="onDragStart($event, 'paidLeave')"
                        title="有給休暇"></div>
                    <span>有給休暇</span>
                </div>
                <div class="legend-item">
                    <div class="drag-btn paid-am" draggable="true" @dragstart="onDragStart($event, 'paidAm')"
                        title="前半日有給"></div>
                    <span>前半日有給</span>
                </div>
                <div class="legend-item">
                    <div class="drag-btn paid-pm" draggable="true" @dragstart="onDragStart($event, 'paidPm')"
                        title="後半日有給"></div>
                    <span>後半日有給</span>
                </div>
                <div class="legend-item">
                    <div class="drag-btn unpaid-leave" draggable="true" @dragstart="onDragStart($event, 'unpaidLeave')"
                        title="無給"></div>
                    <span>無給</span>
                </div>
            </div>

            <!-- 応援区分 第三列 -->
            <div class="legend-column">
                <div class="legend-title">応援区分</div>
                <div class="legend-item">
                    <div class="drag-btn support" draggable="true" @dragstart="onDragStart($event, 'support')"
                        title="応援"></div>
                    <span>応援</span>
                </div>
                <div class="legend-item">
                    <div class="drag-btn support-pm" draggable="true" @dragstart="onDragStart($event, 'supportPm')"
                        title="後半日応援"></div>
                    <span>後半日応援</span>
                </div>
                <div class="legend-item">
                    <div class="drag-btn support-am" draggable="true" @dragstart="onDragStart($event, 'supportAm')"
                        title="前半日応援"></div>
                    <span>前半日応援</span>
                </div>
                <div class="legend-item">
                    <div class="drag-btn am-leave-pm-support" draggable="true"
                        @dragstart="onDragStart($event, 'amLeavePmSupport')" title="前半日休日+後半日応援"></div>
                    <span>前半日休日+後半日応援</span>
                </div>
                <div class="legend-item">
                    <div class="drag-btn am-support-pm-leave" draggable="true"
                        @dragstart="onDragStart($event, 'amSupportPmLeave')" title="前半日応援+後半日休日"></div>
                    <span>前半日応援+後半日休日</span>
                </div>
                <div class="legend-item">
                    <div class="drag-btn meeting" draggable="true" @dragstart="onDragStart($event, 'meeting')"
                        title="会議・研修・出張・他"></div>
                    <span>会議・研修・出張・他</span>
                </div>
            </div>

            <!-- 垃圾桶 + 操作按钮 -->
            <div class="control-column">
                <div class="trash-box" @dragover.prevent @drop="handleDropToTrash">
                    🗑️ ドラッグして解除
                </div>
                <div class="operate-btn-group">
                    <button class="btn save-btn" @click="saveData">保存</button>
                    <button class="btn reset-btn" @click="resetData">リセット</button>
                </div>
            </div>
        </div>

        <!-- ========== 応援設定 モーダル ========== -->
        <div class="modal-mask" v-if="showModal" @click.self="closeModal">
            <div class="modal-content">
                <div class="modal-title">応援先店舗選択</div>
                <div class="tab-wrap">
                    <span class="tab-item" :class="{ active: activeTab === 'tab1' }"
                        @click="activeTab = 'tab1'">グループA</span>
                    <span class="tab-item" :class="{ active: activeTab === 'tab2' }"
                        @click="activeTab = 'tab2'">グループB</span>
                    <span class="tab-item" :class="{ active: activeTab === 'tab3' }"
                        @click="activeTab = 'tab3'">グループC</span>
                </div>
                <div class="tab-content">
                    <div v-if="activeTab === 'tab1'">
                        <label>店舗選択：</label>
                        <select v-model="selectShop" class="shop-select">
                            <option value="">-- 選択してください --</option>
                            <option v-for="shop in shopListA" :key="shop.shopCode"
                                :value="shop.shopCode + '|' + shop.shopName">
                                {{ shop.shopCode }} {{ shop.shopName }}
                            </option>
                        </select>
                    </div>
                    <div v-if="activeTab === 'tab2'">
                        <label>店舗選択：</label>
                        <select v-model="selectShop" class="shop-select">
                            <option value="">-- 選択してください --</option>
                            <option v-for="shop in shopListB" :key="shop.shopCode"
                                :value="shop.shopCode + '|' + shop.shopName">
                                {{ shop.shopCode }} {{ shop.shopName }}
                            </option>
                        </select>
                    </div>
                    <div v-if="activeTab === 'tab3'">
                        <label>店舗選択：</label>
                        <select v-model="selectShop" class="shop-select">
                            <option value="">-- 選択してください --</option>
                            <option v-for="shop in shopListC" :key="shop.shopCode"
                                :value="shop.shopCode + '|' + shop.shopName">
                                {{ shop.shopCode }} {{ shop.shopName }}
                            </option>
                        </select>
                    </div>
                </div>
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

// 日期数据
const days = ref<DateItem[]>([])

// 休假类型映射
const restTypeInfo = ref<Record<string, string>>({
    allDays: 'all',
    morningHalf: 'morning',
    afternoonHalf: 'afternoon',
})

// 出勤类型映射
const attendTypeInfo = ref<Record<string, string>>({
    attend: 'attend',
    early: 'early',
    late: 'late',
    halfAmLeave: 'halfAmLeave',
    halfPmLeave: 'halfPmLeave',
    support: 'support'
})

// 员工数据
const staffList = ref<StaffInfo[]>([
    { role: '店長', name: '青山太郎', id: '10001', restDay: 10, restDayHighlight: true, setting: 9, restDays: { allDays: [21, 27], afternoonHalf: [1, 3] } },
    { role: '副店長', name: '関根次郎', id: '10002', restDay: 8, restDayHighlight: true, setting: 9, restDays: { morningHalf: [29, 4] } },
    { role: '社員', name: '中澤三郎', id: '10003', restDay: 9, restDayHighlight: false, setting: 9, restDays: { morningHalf: [4, 6] } },
    { role: 'パート', name: '楢崎四郎', id: '10004', restDay: 10, restDayHighlight: false, restDays: { afternoonHalf: [29, 5] } },
    { role: 'パート', name: '西本五郎', id: '10005', restDay: 13, restDayHighlight: false, setting: 9 },
    { role: '応援', name: '', id: '10006', restDay: 0, restDayHighlight: false, setting: 9, restDays: { afternoonHalf: [27, 7] }, isSupport: true, supportDays: [27, 3, 7, 8], shopCode: '248', shopName: '岩崎' },
])

// 状态管理
const restStatus = ref<Record<string, string | undefined>>({})    // 休假状态
const attendStatus = ref<Record<string, string>>({}) // 出勤状态
const cellTexts = ref<Record<string, string>>({})    // 応援文字

// 拖拽全局变量
const dragType = ref('')
const draggingCell = ref<{ staffId: string; dayNum: number } | null>(null)

// 応援弹窗
const showModal = ref(false)
const activeTab = ref('tab1')
const selectShop = ref('')
const currentCellKey = ref('')

// 店铺列表
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

onMounted(() => {
    initHistoryData()
    initStaffInfoToPage()
})

// 初始化日期
function initHistoryData() {
    days.value = getJpDateRange()
}

// 初始化已有数据到页面
function initStaffInfoToPage() {
    staffList.value.forEach(staffInfo => {
        if (staffInfo.restDays) {
            Object.keys(staffInfo.restDays).forEach(restDayType => {
                const dayList = staffInfo.restDays?.[restDayType]
                if (!dayList) return
                dayList.forEach(day => {
                    restStatus.value[`${staffInfo.id}-${day}`] = restTypeInfo.value[restDayType]
                })
            })
        }
        if (staffInfo.isSupport && staffInfo.supportDays) {
            staffInfo.supportDays.forEach(day => {
                cellTexts.value[`${staffInfo.id}-${day}`] = `${staffInfo.shopCode}\n${staffInfo.shopName}`
            })
        }
    })
}

// 拖拽按钮开始
const onDragStart = (e: Event, type: string) => {
    dragType.value = type
    draggingCell.value = null
}

// 单元格拖拽开始
const onCellDragStart = (e: Event, staffInfo: StaffInfo, dayInfo: DateItem) => {
    draggingCell.value = {
        staffId: staffInfo.id,
        dayNum: dayInfo.day
    }
    dragType.value = ''
}

// 单元格放置
const onDrop = (e: Event, staffInfo: StaffInfo, dayInfo: DateItem) => {
    const key = `${staffInfo.id}-${dayInfo.day}`

    // 移动单元格原有内容
    if (draggingCell.value) {
        const oldKey = `${draggingCell.value.staffId}-${draggingCell.value.dayNum}`
        delete restStatus.value[oldKey]
        delete attendStatus.value[oldKey]
        delete cellTexts.value[oldKey]
    }

    // 出勤类型
    if (['attend', 'early', 'late', 'halfAmLeave', 'halfPmLeave'].includes(dragType.value)) {
        attendStatus.value[key] = dragType.value
    }
    // 休假类型
    else if (['all', 'morning', 'afternoon'].includes(dragType.value)) {
        restStatus.value[key] = dragType.value
    }
    // 応援 打开弹窗
    else if (dragType.value === 'support') {
        currentCellKey.value = key
        showModal.value = true
        activeTab.value = 'tab1'
        selectShop.value = ''
    }

    draggingCell.value = null
}

// 垃圾桶删除
const handleDropToTrash = () => {
    if (!draggingCell.value) return
    const key = `${draggingCell.value.staffId}-${draggingCell.value.dayNum}`
    delete restStatus.value[key]
    delete attendStatus.value[key]
    delete cellTexts.value[key]
    draggingCell.value = null
}

// 双击清空单元格
const clearCellAll = (staffInfo: StaffInfo, dayInfo: DateItem) => {
    const key = `${staffInfo.id}-${dayInfo.day}`
    delete restStatus.value[key]
    delete attendStatus.value[key]
    delete cellTexts.value[key]
}

// 获取出勤样式class
const getAttendClass = (staffInfo: StaffInfo, dayInfo: DateItem) => {
    const key = `${staffInfo.id}-${dayInfo.day}`
    return attendStatus.value[key] || ''
}

// 获取休假样式class
const getRestClass = (staffInfo: StaffInfo, dayInfo: DateItem) => {
    const key = `${staffInfo.id}-${dayInfo.day}`
    return restStatus.value[key] || ''
}

// 获取応援文字
const getCellText = (staffInfo: StaffInfo, dayInfo: DateItem) => {
    const key = `${staffInfo.id}-${dayInfo.day}`
    return cellTexts.value[key] || ''
}

// 关闭弹窗
const closeModal = () => {
    showModal.value = false
    selectShop.value = ''
    currentCellKey.value = ''
}

// 确认选择店铺
const confirmShop = () => {
    if (!selectShop.value) {
        alert('店舗を選択してください')
        return
    }
    const [code, name] = selectShop.value.split('|')
    cellTexts.value[currentCellKey.value] = `${code}\n${name}`
    closeModal()
}

// 保存数据
function saveData() {
    localStorage.setItem('schedule_rest_data', JSON.stringify(restStatus.value))
    localStorage.setItem('schedule_attend_data', JSON.stringify(attendStatus.value))
    localStorage.setItem('schedule_support_data', JSON.stringify(cellTexts.value))
    alert("保存完了")
}

// 重置数据
function resetData() {
    restStatus.value = {}
    attendStatus.value = {}
    cellTexts.value = {}
    localStorage.removeItem('schedule_rest_data')
    localStorage.removeItem('schedule_attend_data')
    localStorage.removeItem('schedule_support_data')
}
</script>

<style scoped>
.schedule-container {
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding: 20px;
    font-family: "MS Mincho", "Meiryo", sans-serif;
}

/* 表格区域 */
.schedule-table-wrapper {
    overflow-x: auto;
}

.schedule-table {
    border-collapse: collapse;
    border: 1px solid #333;
    width: 100%;
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
    overflow: hidden;
}

/* 出勤色块 底层 */
.attend-wrapper {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    z-index: 1;
}

.attend-half-left,
.attend-half-right {
    width: 50%;
    height: 100%;
}

/* 出勤样式 */
.attend .attend-half-left,
.attend .attend-half-right {
    background: #e1f5e1;
}

.early .attend-half-left,
.early .attend-half-right {
    background: #d0e8ff;
}

.late .attend-half-left,
.late .attend-half-right {
    background: #fff4cc;
}

.halfAmLeave .attend-half-right {
    background: #e1f5e1;
}

.halfPmLeave .attend-half-left {
    background: #e1f5e1;
}

/* 休假色块 上层 */
.half-wrapper {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    z-index: 2;
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

/* 応援文字 最顶层 */
.cell-text {
    position: relative;
    z-index: 3;
    font-size: 12px;
    color: #333;
    white-space: pre-line;
}

/* 底部拖拽按钮区域（三列排版，和参考图完全一致） */
.drag-area {
    display: flex;
    gap: 30px;
    padding-top: 10px;
    border-top: 1px solid #eee;
    align-items: flex-start;
}

.legend-column {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.legend-title {
    font-size: 14px;
    font-weight: bold;
    margin-bottom: 4px;
}

.legend-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
}

/* 拖拽按钮方块样式（和参考图的图例方块一致） */
.drag-btn {
    width: 24px;
    height: 24px;
    border-radius: 2px;
    cursor: grab;
    user-select: none;
}

/* 出勤区分 配色（和参考图绿色系一致） */
.attend .attend-half-left,
.attend .attend-half-right {
    background: #67c23a;
}

.early .attend-half-left,
.early .attend-half-right {
    background: #67c23a;
}

.late .attend-half-left,
.late .attend-half-right {
    background: #67c23a;
}

.halfAmLeave .attend-half-right {
    background: #67c23a;
}

.halfPmLeave .attend-half-left {
    background: #67c23a;
}

/* 休暇区分 配色（和参考图粉色/灰色一致） */
.paid-leave .attend-half-left,
.paid-leave .attend-half-right {
    background: #ff85c0;
}

.paid-am .attend-half-right {
    background: #ff85c0;
}

.paid-pm .attend-half-left {
    background: #ff85c0;
}

.unpaid-leave .attend-half-left,
.unpaid-leave .attend-half-right {
    background: #d9d9d9;
}

/* 応援区分 配色（和参考图浅橙色一致） */
.support .attend-half-left,
.support .attend-half-right {
    background: #ffd8b1;
}

.support-am .attend-half-right {
    background: #ffd8b1;
}

.support-pm .attend-half-left {
    background: #ffd8b1;
}

.am-leave-pm-support .attend-half-right {
    background: #ffd8b1;
}

.am-support-pm-leave .attend-half-left {
    background: #ffd8b1;
}

.meeting .attend-half-left,
.meeting .attend-half-right {
    background: #ffd8b1;
}

/* 応援文字 最顶层 */
.cell-text {
    position: relative;
    z-index: 3;
    font-size: 12px;
    color: #333;
    white-space: pre-line;
}

/* 底部拖拽按钮区域（三列排版，和参考图完全一致） */
.drag-area {
    display: flex;
    gap: 30px;
    padding-top: 10px;
    border-top: 1px solid #eee;
    align-items: flex-start;
}

.legend-column {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.legend-title {
    font-size: 14px;
    font-weight: bold;
    margin-bottom: 4px;
}

.legend-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
}

/* 拖拽按钮方块样式（和参考图的图例方块一致） */
.drag-btn {
    width: 24px;
    height: 24px;
    border-radius: 2px;
    cursor: grab;
    user-select: none;
}

/* 出勤按钮色 */
.drag-btn.attend,
.drag-btn.early,
.drag-btn.late,
.drag-btn.half-am-leave,
.drag-btn.half-pm-leave {
    background: #67c23a;
}

/* 休暇按钮色 */
.drag-btn.paid-leave,
.drag-btn.paid-am,
.drag-btn.paid-pm {
    background: #ff85c0;
}

.drag-btn.unpaid-leave {
    background: #d9d9d9;
}

/* 応援按钮色 */
.drag-btn.support,
.drag-btn.support-am,
.drag-btn.support-pm,
.drag-btn.am-leave-pm-support,
.drag-btn.am-support-pm-leave,
.drag-btn.meeting {
    background: #ffd8b1;
}

/* 垃圾桶 + 操作按钮列 */
.control-column {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-left: auto;
}

.trash-box {
    padding: 8px 12px;
    border: 2px dashed #999;
    border-radius: 6px;
    color: #666;
    cursor: grab;
    white-space: nowrap;
}

/* 操作按钮组 */
.operate-btn-group {
    display: flex;
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

/* 弹窗样式 */
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