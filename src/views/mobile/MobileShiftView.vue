<template>
    <div class="mobile-shift-page">
        <!-- 返回菜单 -->
        <!-- <div class="back-wrap">

        </div> -->

        <!-- 年月+公休カード -->
        <el-card shadow="hover" class="top-card">
            <div class="card-row">
                <el-button icon="ArrowLeft" v-if="userStore.role === 'NORMAL_USER'" type="primary"
                    @click="$router.push({ name: 'NormalUserMenu' })">戻る</el-button>
                <span class="ym-text">{{ targetYear }}年{{ targetMonth }}月</span>
                <span class="rest-text">公休数：{{ userRestCount }}日</span>
            </div>
        </el-card>

        <!-- 年月切替ボタン -->
        <div class="month-switch">
            <el-button icon="ArrowLeft" @click="prevMonth"></el-button>
            <span class="current-ym">{{ targetYear }}年{{ targetMonth }}月</span>
            <el-button icon="ArrowRight" @click="nextMonth"></el-button>
        </div>

        <!-- カレンダーテーブル -->
        <div class="cal-wrap">
            <table class="shift-table">
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
                    <tr v-for="(weekArr, rowIdx) in calendarRows" :key="rowIdx">
                        <td v-for="(dayItem, colIdx) in weekArr" :key="colIdx" class="cell-box" :style="{
                            background: dayItem ? getShiftBg(getCellShiftInfo(currentStaff, currentYm, dayItem.day).code) : '#fff'
                        }">
                            <div class="shift-text" v-if="dayItem">
                                {{ getCellShiftInfo(currentStaff, currentYm, dayItem.day).finalText }}
                            </div>
                            <span class="day-num">{{ dayItem?.day ?? '' }}</span>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import dayjs from 'dayjs'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

// 固定ログインスタッフ情報（後續改API取得）
const loginStaffId = ref('u1')
const userRestCount = ref(9)

// 年月
const now = new Date()
const targetYear = ref(now.getFullYear())
const targetMonth = ref(now.getMonth() + 1)

// 全グループ・店舗・社員固定データ
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
                                    21: '', 22: '', 23: '', 24: '', 28: '', 29: '', 30: '', 31: '', 4: '', 5: '', 10: '', 13: '', 16: '', 17: '', 18: '', 19: '',
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
                ],
            },
        ],
    },
]

// シフト区分定義
type DragItem = {
    kinmuCd: string
    code: string
    name: string
    bg: string
    text?: string
    textAlign?: 'left' | 'center' | 'right'
}
const workTypeList = ref<DragItem[]>([
    { kinmuCd: '01', code: 'work', name: '出勤', bg: 'linear-gradient(90deg,#73d055 50%,#73d055 50%)' },
    { kinmuCd: '01', code: 'halfAMOff', name: '前半日休日', bg: 'linear-gradient(90deg,#fff 0,#fff 50%,#73d055 50%,#73d055 100%)' },
    { kinmuCd: '01', code: 'halfPMOff', name: '後半日休日', bg: 'linear-gradient(90deg,#73d055 0,#73d055 50%,#fff 50%,#fff 100%)' },
    { kinmuCd: '01', code: 'paidAM', name: '前半日有給', bg: 'linear-gradient(90deg,#ffb9d6 0,#ffb9d6 50%,#73d055 50%,#73d055 100%)' },
    { kinmuCd: '01', code: 'paidPM', name: '後半日有給', bg: 'linear-gradient(90deg,#73d055 0,#73d055 50%,#ffb9d6 50%,#ffb9d6 100%)' },
    { kinmuCd: '01', code: 'early1', name: '時差出勤(早番)', bg: 'linear-gradient(90deg,#73d055 0,#73d055 75%,#fff 75%,#fff 100%)', text: '早', textAlign: 'left' },
    { kinmuCd: '01', code: 'half1', name: '時差出勤(中番)', bg: 'linear-gradient(90deg,#fff 0,#fff 25%,#73d055 25%,#73d055 75%,#fff 75%,#fff 100%)', text: '中', textAlign: 'center' },
    { kinmuCd: '01', code: 'late1', name: '時差出勤(遅番)', bg: 'linear-gradient(90deg,#fff 0,#fff 25%,#73d055 25%,#73d055 100%)', text: '遅', textAlign: 'right' },
])
const restTypeList = ref<DragItem[]>([
    { kinmuCd: '02', code: 'hopeAll', name: '希望休', bg: '#fff', text: '希', textAlign: 'center' },
    { kinmuCd: '02', code: 'restAll', name: '休日', bg: '#fff' },
    { kinmuCd: '02', code: 'paidAll', name: '有給休暇', bg: '#ffb9d6', text: '㊒', textAlign: 'center' },
    { kinmuCd: '02', code: 'spcialPaidAll', name: '特别有給休暇', bg: '#ffb9d6', text: '㊕', textAlign: 'center' },
    { kinmuCd: '02', code: 'unpaid', name: '無給', bg: '#c2c2c2' },
])
const supportTypeList = ref<DragItem[]>([
    { kinmuCd: '03', code: 'fullSup', name: '応援', bg: '#ffcc99' },
    { kinmuCd: '03', code: 'halfPMSup', name: '後半日応援', bg: 'linear-gradient(90deg,#73d055 0,#73d055 50%,#ffcc99 50%,#ffcc99 100%)' },
    { kinmuCd: '03', code: 'halfAMSup', name: '前半日応援', bg: 'linear-gradient(90deg,#ffcc99 0,#ffcc99 50%,#73d055 50%,#73d055 100%)' },
    { kinmuCd: '03', code: 'AMSupPMOff', name: '前半日休日+後半日応援', bg: 'linear-gradient(90deg,#fff 0,#fff 50%,#ffcc99 50%,#ffcc99 100%)' },
    { kinmuCd: '03', code: 'AMOffPMSup', name: '前半日応援+後半日休日', bg: 'linear-gradient(90deg,#ffcc99 0,#ffcc99 50%,#fff 50%,#fff 100%)' },
    { kinmuCd: '04', code: 'other', name: '会議･研修･出張･他', bg: '#fff0cc', text: '会議', textAlign: 'center' },
])
const allShiftTypes = [...workTypeList.value, ...restTypeList.value, ...supportTypeList.value]
const shiftBgMap: Record<string, string> = {}
allShiftTypes.forEach(item => shiftBgMap[item.code] = item.bg)

// 当月文字列
const currentYm = computed(() => `${targetYear.value}${String(targetMonth.value).padStart(2, '0')}`)

// 21～翌20日の日付配列
const dateList = computed(() => {
    const arr: Array<{ day: number; week: string }> = []
    const curMonthBase = dayjs(`${targetYear.value}-${targetMonth.value}-01`)
    const prevMonth = curMonthBase.subtract(1, 'month')
    const prevY = prevMonth.year()
    const prevM = prevMonth.month() + 1
    const prevMonthLastDay = prevMonth.endOf('month').date()
    const weekArr = ['日', '月', '火', '水', '木', '金', '土']
    for (let d = 21; d <= prevMonthLastDay; d++) {
        const cur = dayjs(`${prevY}-${prevM}-${d}`)
        arr.push({ day: d, week: weekArr[cur.day()]! })
    }
    const currY = curMonthBase.year()
    const currM = curMonthBase.month() + 1
    for (let d = 1; d <= 20; d++) {
        const cur = dayjs(`${currY}-${currM}-${d}`)
        arr.push({ day: d, week: weekArr[cur.day()]! })
    }
    return arr
})

// 7日1行カレンダー行列
const calendarRows = computed(() => {
    const rows: Array<Array<{ day: number; week: string } | null>> = []
    const list = [...dateList.value]
    if (list.length === 0) return rows
    const weekMap: Record<string, number> = { 日: 0, 月: 1, 火: 2, 水: 3, 木: 4, 金: 5, 土: 6 }
    const firstItem = list[0]!
    const emptyCount = weekMap[firstItem.week] ?? 0
    let currentRow: Array<{ day: number; week: string } | null> = []
    for (let i = 0; i < emptyCount; i++) currentRow.push(null)
    list.forEach(item => {
        currentRow.push(item)
        if (currentRow.length === 7) {
            rows.push([...currentRow])
            currentRow = []
        }
    })
    if (currentRow.length > 0) {
        while (currentRow.length < 7) currentRow.push(null)
        rows.push([...currentRow])
    }
    return rows
})

// 自分の社員データ抽出
const currentStaff = computed(() => {
    let targetStaff: StaffShift | null = null
    groupList.value.forEach(g => {
        g.shopList.forEach(s => {
            const find = s.staffList.find(st => st.staffId === loginStaffId.value)
            if (find) targetStaff = find
        })
    })
    return targetStaff
})

// 年月切替
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

// テキスト取得
const getTypePresetText = (code: string) => {
    const t = allShiftTypes.find(i => i.code === code)
    return t?.text ?? ''
}
// セル情報取得
const getCellShiftInfo = (staff: StaffShift | null, ym: string, day: number) => {
    if (!staff) return { code: '', finalText: '' }
    const monthShift = staff.shiftMap[ym]
    if (!monthShift) return { code: '', finalText: '' }
    for (const code in monthShift) {
        const dayMap = monthShift[code]
        if (dayMap && Object.prototype.hasOwnProperty.call(dayMap, day)) {
            const presetText = getTypePresetText(code)
            const customText = dayMap[day] || ''
            return { code, finalText: presetText || customText }
        }
    }
    return { code: '', finalText: '' }
}
// 背景色取得
const getShiftBg = (code: string) => shiftBgMap[code] || '#fff'
</script>

<style scoped lang="scss">
.mobile-shift-page {
    padding: 12px;
    background: #f5f7fa;
    min-height: 100vh;
    box-sizing: border-box;
}

.back-wrap {
    margin-bottom: 12px;
}

.top-card {
    margin-bottom: 16px;

    .card-row {
        display: flex;
        justify-content: space-around;
        font-size: 16px;
        padding: 8px 0;
    }
}

.month-switch {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    margin: 16px 0;

    .current-ym {
        font-size: 18px;
        font-weight: 500;
    }
}

.cal-wrap {
    width: 100%;
    overflow-x: auto;

    .shift-table {
        width: 100%;
        table-layout: fixed;
        border-collapse: collapse;
    }

    .week-th {
        width: calc(100% / 7);
        height: 40px;
        background: #b8c8e0;
        font-size: 14px;
        border: 1px solid #999;

        &:first-child {
            color: #f53f3f;
        }

        &:last-child {
            color: #0066ff;
        }
    }

    .cell-box {
        width: calc(100% / 7);
        height: 56px;
        border: 1px solid #999;
        position: relative;
        padding: 2px;

        .shift-text {
            font-size: 13px;
            position: absolute;
            top: 2px;
            left: 2px;
            word-break: break-all;
        }

        .day-num {
            font-size: 14px;
            position: absolute;
            bottom: 2px;
            right: 4px;
        }

        &:first-child {
            color: #f53f3f;
        }

        &:last-child {
            color: #0066ff;
        }
    }
}
</style>