<template>
  <!-- 最外层容器绑定全局drop，实现拖出页面任意空白/下方分类区松手删除 -->
  <div class="container" @dragover.prevent @drop="onGlobalDrop">
    <div class="page-title">シフト表作成</div>
    <!-- 上部年月按钮区域 -->
    <el-card shadow="hover" class="top-card print-hide">
      <div class="line1">
        <span>店舗：{{ singleShop.code }}　{{ singleShop.name }}</span>
      </div>
      <!-- 自定义年月左右箭头 -->
      <div class="line2 flex-row">
        <span>指定年月：</span>
        <el-button icon="ArrowLeft" @click="prevMonth"></el-button>
        <span>{{ currentYearMonth }}</span>
        <el-button icon="ArrowRight" @click="nextMonth"></el-button>
      </div>
      <div class="btn-row">
        <el-button @click="tempSave">一時保存</el-button>
        <el-button type="primary" @click="submitSave">登録</el-button>
        <el-button @click="printPage">印刷</el-button>
      </div>
    </el-card>

    <!-- 排班表格区域 -->
    <div class="shop-table-wrap print-area">
      <div class="one-shop-block">
        <el-card shadow="hover" style="margin: 12px 0">
          <table class="shift-table">
            <thead>
              <!-- 第一行：年月汇总行 同月合并colspan -->
              <tr>
                <th colspan="4" rowspan="3" class="title-th">
                  {{ singleShop.name }} {{ currentYM }}
                </th>
                <template v-for="(item, idx) in dayList" :key="item.date">
                  <th
                    v-if="idx === 0 || dayList[idx - 1]?.showYM !== item.showYM"
                    :colspan="getColSpan(idx)"
                    class="title-th"
                  >
                    {{ item.showYM }}
                  </th>
                </template>
              </tr>
              <!-- 第二行：日 -->
              <tr>
                <!-- <th colspan="4" rowspan="2" class="title-th"></th> -->
                <th v-for="item in dayList" :key="item.date" class="day-head">{{ item.dayNum }}</th>
              </tr>
              <!-- 第三行：曜日 -->
              <tr>
                <th
                  v-for="item in dayList"
                  :key="item.date"
                  :class="[{ sun: item.week === 0, sat: item.week === 6 }]"
                  class="week-head"
                >
                  {{ item.weekName }}
                </th>
              </tr>
              <!-- 第四行：役職・氏名 -->
              <tr>
                <th class="fixed-th">役職</th>
                <th class="fixed-th">氏名</th>
                <th class="fixed-th">休暇</th>
                <th class="fixed-th">設定</th>
                <th v-for="item in dayList" :key="item.date" class="empty-th"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(emp, idx) in singleShop.empList" :key="idx">
                <td class="fixed-cell">{{ emp.post }}</td>
                <td class="fixed-cell">{{ emp.name }}</td>
                <td class="fixed-cell">{{ emp.restTotal }}</td>
                <td class="fixed-cell">{{ emp.setRest }}</td>
                <td
                  v-for="day in dayList"
                  :key="day.date"
                  class="drop-cell"
                  @dragover.prevent
                  @drop="handleDrop($event, idx, day.date, 'single')"
                  @dragstart="cellDragStart($event, idx, day.date, 'single')"
                  draggable="true"
                >
                  <div
                    class="split-bg"
                    v-if="emp.colorMap[day.date]"
                    :style="{ background: emp.colorMap[day.date] }"
                  ></div>
                  <div
                    class="cell-text"
                    :class="getTextAlign(emp, day.date)"
                    :style="{ color: getTextColor(emp, day.date) }"
                  >
                    {{
                      ['早', '中', '遅'].includes(emp.cellText[day.date] ?? '')
                        ? ''
                        : (emp.cellText[day.date] ?? '')
                    }}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </el-card>
      </div>
    </div>

    <!-- 下方三大拖拽分类：文字在前、色块在后 -->
    <div class="bottom-type-wrap print-area" :style="{ gridTemplateColumns: bottomGridColumns }">
      <!-- 出勤区分（business_type !== 03 时显示） -->
      <div class="type-col" v-if="businessType !== '03'">
        <div class="col-title">出勤区分</div>
        <div
          v-for="item in workTypeList"
          :key="item.code"
          class="drag-item"
          draggable="true"
          @dragstart="dragStart($event, item)"
        >
          <span class="item-text">{{ item.name }}</span>
          <div class="small-block" :style="{ background: item.bg }">
            <span
              v-if="item.text"
              class="block-text"
              :class="getPreviewAlign(item.text)"
              :style="{ color: getPreviewColor(item.text) }"
            >
              {{ item.text }}
            </span>
          </div>
        </div>
      </div>
      <!-- 休暇区分（始终显示） -->
      <div class="type-col print-area">
        <div class="col-title">休暇区分</div>
        <div
          v-for="item in restTypeList"
          :key="item.code"
          class="drag-item"
          draggable="true"
          @dragstart="dragStart($event, item)"
        >
          <span class="item-text">{{ item.name }}</span>
          <div class="small-block" :style="{ background: item.bg }">
            <span
              v-if="item.text"
              class="block-text"
              :class="getPreviewAlign(item.text)"
              :style="{ color: getPreviewColor(item.text) }"
            >
              {{ item.text }}
            </span>
          </div>
        </div>
      </div>
      <!-- 3. 応援区分・会議他区分（始终显示） -->
      <div class="type-col print-area">
        <div class="col-title">応援区分・会議他区分</div>
        <div
          v-for="item in supportTypeList"
          :key="item.code"
          class="drag-item"
          draggable="true"
          @dragstart="dragStart($event, item)"
        >
          <span class="item-text">{{ item.name }}</span>
          <div class="small-block" :style="{ background: item.bg }">
            <span
              v-if="item.text"
              class="block-text"
              :class="getPreviewAlign(item.text)"
              :style="{ color: getPreviewColor(item.text) }"
            >
              {{ item.text }}
            </span>
          </div>
        </div>
      </div>
      <!-- SSQ出勤区分（business_type === 03 时显示） -->
      <div class="type-col print-area" v-if="businessType === '03'">
        <div class="col-title">出勤区分</div>
        <!-- 用Grid实现自适应多列布局 -->
        <div
          class="new-work-grid new-work-grid--custom"
          :style="{ gridTemplateColumns: newWorkGridColumns }"
        >
          <div
            v-for="item in newWorkTypeList"
            :key="item.kinmuIdx"
            class="drag-item"
            draggable="true"
            @dragstart="
              dragStart($event, {
                kinmuCd: '01',
                code: `new-work-${item.kinmuIdx}`,
                name: `${item.displayText}: ${item.kinmuStartTime}~${item.kinmuEndTime}`,
                bg: item.bg,
                text: getCircledNum(item.kinmuIdx),
                textAlign: 'center',
              })
            "
          >
            <!-- 左侧显示：出勤名称 + 时间段 -->
            <span class="item-text"
              >{{ item.displayText }}: {{ item.kinmuStartTime }}~{{ item.kinmuEndTime }}</span
            >
            <!-- 右侧绿色背景 + 序号 -->
            <div class="small-block small-block--custom" :style="{ background: item.bg }">
              <span class="block-text center">{{ getCircledNum(item.kinmuIdx) }}</span>
            </div>
            <span class="item-text">{{ item.kinmuTime }}</span>
          </div>
        </div>
      </div>
    </div>
    <!-- 当月特殊説明イベント一覧 -->
    <el-card shadow="hover" style="margin: 20px 0" class="print-area">
      <div style="display: flex; justify-content: center; align-items: center; position: relative">
        <!-- 标题 -->
        <div class="event-title">{{ Number(selectYM.split('-')[1]) }}月主要イベント一覧</div>
        <!-- 右侧操作按钮 -->
        <div
          style="position: absolute; right: 8px; margin: 0 0 15px 0; display: flex; gap: 8px"
          class="print-hide"
        >
          <el-button type="primary" @click="toggleEventEdit">変更</el-button>
          <el-button type="primary" @click="openAddEvent">追加</el-button>
          <el-button type="success" @click="saveAllEvent">保存</el-button>
        </div>
      </div>

      <div class="event-wrap print-area">
        <!-- 左欄 表格 -->
        <div class="event-col">
          <table class="event-table">
            <thead>
              <tr>
                <th class="th-no">項</th>
                <th class="th-day">日付</th>
                <th class="th-content">イベント内容</th>
                <th style="width: 80px">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(item, idx) in leftEventList"
                :key="item.id"
                :class="idx % 2 === 0 ? 'odd' : 'even'"
              >
                <td>{{ item.no }}</td>
                <td v-if="!eventEditMode">{{ item.day }}</td>
                <td v-if="eventEditMode">
                  <el-date-picker
                    v-model="item.fullDate"
                    type="date"
                    value-format="YYYY-MM-DD"
                    @change="updateEventShowDay(item)"
                  />
                </td>
                <td v-if="!eventEditMode">{{ item.content }}</td>
                <td v-if="eventEditMode">
                  <el-input v-model="item.content" maxlength="20" placeholder="20文字以内" />
                </td>
                <td>
                  <el-button type="danger" size="small" icon="Delete" @click="deleteEvent(item.id)"
                    >削除</el-button
                  >
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 右欄 表格 -->
        <div class="event-col print-area">
          <table class="event-table">
            <thead>
              <tr>
                <th class="th-no">項</th>
                <th class="th-day">日付</th>
                <th class="th-content">イベント内容</th>
                <th style="width: 80px">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(item, idx) in rightEventList"
                :key="item.id"
                :class="idx % 2 === 0 ? 'odd' : 'even'"
              >
                <td>{{ item.no }}</td>
                <td v-if="!eventEditMode">{{ item.day }}</td>
                <td v-if="eventEditMode">
                  <el-date-picker
                    v-model="item.fullDate"
                    type="date"
                    value-format="YYYY-MM-DD"
                    @change="updateEventShowDay(item)"
                  />
                </td>
                <td v-if="!eventEditMode">{{ item.content }}</td>
                <td v-if="eventEditMode">
                  <el-input v-model="item.content" maxlength="20" placeholder="20文字以内" />
                </td>
                <td>
                  <el-button type="danger" size="small" icon="Delete" @click="deleteEvent(item.id)"
                    >削除</el-button
                  >
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </el-card>

    <!-- ==========追加：他店情報エリア（非ドラッグ）========== -->
    <div
      class="other-shop-title print-hide"
      style="margin-top: 20px; font-weight: bold; font-size: 15px"
    >
      他店情報
    </div>
    <div class="other-shop-wrap print-hide">
      <div v-for="shop in groupShopList" :key="shop.code" class="one-shop-block">
        <el-card shadow="hover" style="margin: 12px 0">
          <table class="shift-table" border="1" cellpadding="2" cellspacing="0" width="100%">
            <thead>
              <tr>
                <th colspan="4" rowspan="3" class="title-th">{{ shop.name }} {{ currentYM }}</th>
                <template v-for="(item, idx) in dayList" :key="item.date">
                  <th
                    v-if="idx === 0 || dayList[idx - 1]?.showYM !== item.showYM"
                    :colspan="getColSpan(idx)"
                    class="title-th"
                  >
                    {{ item.showYM }}
                  </th>
                </template>
              </tr>
              <tr>
                <th v-for="item in dayList" :key="item.date" class="day-head">{{ item.dayNum }}</th>
              </tr>
              <tr>
                <th
                  v-for="item in dayList"
                  :key="item.date"
                  :class="[{ sun: item.week === 0, sat: item.week === 6 }]"
                  class="week-head"
                >
                  {{ item.weekName }}
                </th>
              </tr>
              <tr>
                <th class="fixed-th">役職</th>
                <th class="fixed-th">氏名</th>
                <th class="fixed-th">休暇</th>
                <th class="fixed-th">設定</th>
                <th v-for="item in dayList" :key="item.date" class="empty-th"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(emp, idx) in shop.empList" :key="idx">
                <td class="fixed-cell">{{ emp.post }}</td>
                <td class="fixed-cell">{{ emp.name }}</td>
                <td class="fixed-cell">{{ emp.restTotal }}</td>
                <td class="fixed-cell">{{ emp.setRest }}</td>
                <!-- 【关键】去掉draggable、@drop、@dragstart，禁止拖拽 -->
                <td v-for="day in dayList" :key="day.date" class="drop-cell">
                  <div
                    class="split-bg"
                    v-if="emp.colorMap[day.date]"
                    :style="{ background: emp.colorMap[day.date] }"
                  ></div>
                  <!-- <div
                    class="cell-text"
                    v-if="emp.cellText[day.date] == '希'"
                    style="color: red; font-size: 14px"
                  >
                    {{ emp.cellText[day.date] }}
                  </div>
                  <div class="cell-text" v-if="emp.cellText[day.date] != '希'">
                    {{ emp.cellText[day.date] }}
                  </div> -->
                  <div
                    class="cell-text"
                    :class="getTextAlign(emp, day.date)"
                    :style="{ color: getTextColor(emp, day.date) }"
                  >
                    {{
                      ['早', '中', '遅'].includes(emp.cellText[day.date] ?? '')
                        ? ''
                        : (emp.cellText[day.date] ?? '')
                    }}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </el-card>
      </div>
    </div>

    <!-- 応援弹窗 -->
    <el-dialog v-model="supportModalVisible" title="応援先店舗選択" width="70%">
      <el-tabs v-model="activeSupportTab">
        <el-tab-pane label="グループ内応援" name="inner">
          <el-table :data="innerShopList" border stripe>
            <el-table-column label="店舗コード" prop="code" />
            <el-table-column label="店舗名" prop="name" />
            <el-table-column label="操作">
              <template #default="scope">
                <el-button size="small" @click="selectSupportShop(scope.row)">選択</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="グループ以外応援" name="outer">
          <!-- 検索エリア -->
          <div
            style="
              display: flex;
              gap: 12px;
              align-items: center;
              margin-bottom: 10px;
              flex-wrap: wrap;
            "
          >
            <!-- 業態下拉：選択すると店舗候補が自動絞込 -->
            <el-select
              v-model="outerSearchForm.businessType"
              placeholder="業態を選択"
              style="width: 160px"
              clearable
            >
              <el-option
                v-for="bt in businessTypeOptions"
                :key="bt.value"
                :label="bt.label"
                :value="bt.value"
              />
            </el-select>

            <!-- 入力可能店舗下拉 filterable -->
            <el-select
              v-model="outerSearchForm.shopKeyword"
              filterable
              placeholder="店舗コードまたは名称を入力"
              style="width: 320px"
              clearable
            >
              <el-option
                v-for="opt in outerShopOptions"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </el-select>
            <el-button type="primary" @click="searchOuterShop">検索</el-button>
          </div>
          <el-table :data="outerShopList" border stripe>
            <el-table-column label="店舗コード" prop="code" />
            <el-table-column label="店舗名" prop="name" />
            <el-table-column label="操作">
              <template #default="scope">
                <el-button size="small" @click="selectSupportShop(scope.row)">選択</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>
    <!-- 特殊説明追加弹窗 -->
    <el-dialog v-model="eventAddDialogVisible" title="特殊日説明追加" width="600">
      <el-form :model="eventAddForm" label-width="75px">
        <el-form-item label="日付">
          <el-date-picker
            v-model="eventAddForm.fullDate"
            type="date"
            :disabled-date="disabledDate"
            placeholder="日付を選択"
            value-format="YYYY-MM-DD"
            @change="handleDateChange"
            :key="pickerKey"
          />
        </el-form-item>
        <el-form-item label="内容">
          <el-input
            v-model="eventAddForm.content"
            type="textarea"
            rows="3"
            :maxlength="20"
            placeholder="説明文を入力、20 文字以内"
          ></el-input>
          <!-- 字符数提示 -->
          <div class="char-count">{{ eventAddForm.content.length }} / 20</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="eventAddDialogVisible = false">キャンセル</el-button>
        <el-button type="primary" @click="submitAddEvent">登録</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'

// 实例仓库
const userStore = useUserStore()

type DragItem = {
  kinmuCd: string
  code: string
  name: string
  bg: string
  text?: string
  textAlign?: 'left' | 'center' | 'right'
}
type DayItem = {
  date: string
  dayNum: number
  week: number
  weekName: string | undefined
  showYM: string
}
type EmpItem = {
  post: string
  name: string
  restTotal: number
  setRest: number
  colorMap: Record<string, string>
  cellText: Record<string, string>
  hopeDays: string[] // 希望休日期数组 'yyyy-MM-dd'
}
type ShopItem = { code: string; name: string; empList: EmpItem[] }
type SupportShop = { code: string; name: string; businessType: string }

// SSQ 出勤区分
type NewWorkItem = {
  kinmuIdx: number
  kinmuStartTime: string
  kinmuEndTime: string
  kinmuTime: string
  kinmuNickName?: string
  patternName: string
  bg: string // 固定绿色背景
  displayText: string // 最终显示文本（优先别名）
}

type EventItem = {
  id: number
  yearMonth: string // YYYY-MM 年月(和selectYM格式一致，筛选用)
  day: string // 表示用 6/05
  fullDate: string // yyyy-MM-dd 排序用完整日付
  content: string
  no: number // 画面表示連番1,2,3…
}

// 弹窗関連
const eventAddDialogVisible = ref(false)
interface EventAddForm {
  fullDate: string
  showDay: string
  content: string
}
// 初始化表单
const eventAddForm = ref<EventAddForm>({
  fullDate: '',
  showDay: '',
  content: '',
})

let eventIdSeed = 1 // 自增ID

const userRole = computed(() => {
  return userStore.userInfo?.role
})
const selectYM = ref('2026-06')
const currentYM = computed(() => selectYM.value.replace('-', '年') + '月')
const currentYearMonth = computed(() => selectYM.value.replace('-', ''))

let dragCurrent: DragItem | null = null
let dropTargetInfo: { empIdx: number; date: string; flag: string | number } | null = null
let cellDragInfo: { empIdx: number; date: string; flag: string | number } | null = null

// 希望休底色（浅灰对半）
const hopeBg = 'linear-gradient(90deg,#eeeeee 50%,#eeeeee 50%)'

// 上月
const prevMonth = () => {
  let [y = new Date().getFullYear(), m = new Date().getMonth() + 1] = selectYM.value
    .split('-')
    .map(Number)
  m--
  if (m < 1) {
    y--
    m = 12
  }
  const mm = String(m).padStart(2, '0')
  selectYM.value = `${y}-${mm}`
  makeDayRange()
}
// 下月
const nextMonth = () => {
  let [y = new Date().getFullYear(), m = new Date().getMonth() + 1] = selectYM.value
    .split('-')
    .map(Number)
  m++
  if (m > 12) {
    y++
    m = 1
  }
  const mm = String(m).padStart(2, '0')
  selectYM.value = `${y}-${mm}`
  makeDayRange()
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
// --- SSQ出勤区分响应式数据 ---
const newWorkTypeList = ref<NewWorkItem[]>([])

// --- SSQ预设全量出勤区分数据（店铺无配置时用）---
const defaultNewWorkList: NewWorkItem[] = [
  {
    kinmuIdx: 1,
    kinmuStartTime: '09:00',
    kinmuEndTime: '15:45',
    kinmuTime: '6:00',
    kinmuNickName: 'AA',
    patternName: '出勤①',
    bg: 'linear-gradient(90deg,#73d055 50%,#73d055 50%)',
    displayText: 'A', //接口处理时动态生成，优先取别名： item.kinmu_nick_name || item.pattern_name
  },
  {
    kinmuIdx: 2,
    kinmuStartTime: '09:00',
    kinmuEndTime: '16:45',
    kinmuTime: '7:00',
    patternName: '出勤②',
    bg: 'linear-gradient(90deg,#73d055 50%,#73d055 50%)',
    displayText: 'B',
  },
  {
    kinmuIdx: 3,
    kinmuStartTime: '09:00',
    kinmuEndTime: '18:25',
    kinmuTime: '8:00',
    patternName: '出勤③',
    bg: 'linear-gradient(90deg,#73d055 50%,#73d055 50%)',
    displayText: 'C',
  },
  {
    kinmuIdx: 4,
    kinmuStartTime: '09:00',
    kinmuEndTime: '19:25',
    kinmuTime: '9:00',
    patternName: '出勤④',
    bg: 'linear-gradient(90deg,#73d055 50%,#73d055 50%)',
    displayText: '出勤④',
  },
  {
    kinmuIdx: 5,
    kinmuStartTime: '09:00',
    kinmuEndTime: '20:25',
    kinmuTime: '10:00',
    patternName: '出勤⑤',
    bg: 'linear-gradient(90deg,#73d055 50%,#73d055 50%)',
    displayText: '出勤⑤',
  },
  {
    kinmuIdx: 6,
    kinmuStartTime: '09:30',
    kinmuEndTime: '16:15',
    kinmuTime: '6:00',
    patternName: '出勤⑥',
    bg: 'linear-gradient(90deg,#73d055 50%,#73d055 50%)',
    displayText: '出勤⑥',
  },
  // {
  //   kinmuIdx: 7,
  //   kinmuStartTime: '09:30',
  //   kinmuEndTime: '17:15',
  //   patternName: '出勤⑦',
  //   bg: 'linear-gradient(90deg,#73d055 50%,#73d055 50%)',
  //   displayText: '出勤⑦',
  // },
  // {
  //   kinmuIdx: 8,
  //   kinmuStartTime: '09:30',
  //   kinmuEndTime: '18:55',
  //   patternName: '出勤⑧',
  //   bg: 'linear-gradient(90deg,#73d055 50%,#73d055 50%)',
  //   displayText: '出勤⑧',
  // },
  // {
  //   kinmuIdx: 9,
  //   kinmuStartTime: '09:30',
  //   kinmuEndTime: '19:55',
  //   patternName: '出勤⑨',
  //   bg: 'linear-gradient(90deg,#73d055 50%,#73d055 50%)',
  //   displayText: '出勤⑨',
  // },
  // {
  //   kinmuIdx: 10,
  //   kinmuStartTime: '09:30',
  //   kinmuEndTime: '20:55',
  //   patternName: '出勤⑩',
  //   bg: 'linear-gradient(90deg,#73d055 50%,#73d055 50%)',
  //   displayText: '出勤⑩',
  // },
  // {
  //   kinmuIdx: 11,
  //   kinmuStartTime: '10:30',
  //   kinmuEndTime: '17:15',
  //   patternName: '出勤⑪',
  //   bg: 'linear-gradient(90deg,#73d055 50%,#73d055 50%)',
  //   displayText: '出勤⑪',
  // },
  // {
  //   kinmuIdx: 12,
  //   kinmuStartTime: '10:30',
  //   kinmuEndTime: '18:15',
  //   patternName: '出勤⑫',
  //   bg: 'linear-gradient(90deg,#73d055 50%,#73d055 50%)',
  //   displayText: '出勤⑫',
  // },
  // {
  //   kinmuIdx: 13,
  //   kinmuStartTime: '10:30',
  //   kinmuEndTime: '19:55',
  //   patternName: '出勤⑬',
  //   bg: 'linear-gradient(90deg,#73d055 50%,#73d055 50%)',
  //   displayText: '出勤⑬',
  // },
  // {
  //   kinmuIdx: 14,
  //   kinmuStartTime: '10:30',
  //   kinmuEndTime: '20:55',
  //   patternName: '出勤⑭',
  //   bg: 'linear-gradient(90deg,#73d055 50%,#73d055 50%)',
  //   displayText: '出勤⑭',
  // },
  // {
  //   kinmuIdx: 15,
  //   kinmuStartTime: '10:30',
  //   kinmuEndTime: '21:55',
  //   patternName: '出勤⑮',
  //   bg: 'linear-gradient(90deg,#73d055 50%,#73d055 50%)',
  //   displayText: '出勤⑮',
  // },
  // {
  //   kinmuIdx: 16,
  //   kinmuStartTime: '11:00',
  //   kinmuEndTime: '17:45',
  //   patternName: '出勤⑯',
  //   bg: 'linear-gradient(90deg,#73d055 50%,#73d055 50%)',
  //   displayText: '出勤⑯',
  // },
  // {
  //   kinmuIdx: 17,
  //   kinmuStartTime: '11:00',
  //   kinmuEndTime: '18:45',
  //   patternName: '出勤⑰',
  //   bg: 'linear-gradient(90deg,#73d055 50%,#73d055 50%)',
  //   displayText: '出勤⑰',
  // },
  // {
  //   kinmuIdx: 18,
  //   kinmuStartTime: '11:00',
  //   kinmuEndTime: '20:25',
  //   patternName: '出勤⑱',
  //   bg: 'linear-gradient(90deg,#73d055 50%,#73d055 50%)',
  //   displayText: '出勤⑱',
  // },
  // {
  //   kinmuIdx: 19,
  //   kinmuStartTime: '11:00',
  //   kinmuEndTime: '21:25',
  //   patternName: '出勤⑲',
  //   bg: 'linear-gradient(90deg,#73d055 50%,#73d055 50%)',
  //   displayText: '出勤⑲',
  // },
  // {
  //   kinmuIdx: 20,
  //   kinmuStartTime: '11:00',
  //   kinmuEndTime: '22:25',
  //   patternName: '出勤⑳',
  //   bg: 'linear-gradient(90deg,#73d055 50%,#73d055 50%)',
  //   displayText: '出勤⑳',
  // },
  // {
  //   kinmuIdx: 21,
  //   kinmuStartTime: '15:40',
  //   kinmuEndTime: '22:25',
  //   patternName: '出勤㉑',
  //   bg: 'linear-gradient(90deg,#73d055 50%,#73d055 50%)',
  //   displayText: '出勤㉑',
  // },
  // {
  //   kinmuIdx: 22,
  //   kinmuStartTime: '14:40',
  //   kinmuEndTime: '22:25',
  //   patternName: '出勤㉒',
  //   bg: 'linear-gradient(90deg,#73d055 50%,#73d055 50%)',
  //   displayText: '出勤㉒',
  // },
  // {
  //   kinmuIdx: 23,
  //   kinmuStartTime: '13:00',
  //   kinmuEndTime: '22:25',
  //   patternName: '出勤㉓',
  //   bg: 'linear-gradient(90deg,#73d055 50%,#73d055 50%)',
  //   displayText: '出勤㉓',
  // },
  // {
  //   kinmuIdx: 24,
  //   kinmuStartTime: '12:00',
  //   kinmuEndTime: '22:25',
  //   patternName: '出勤㉔',
  //   bg: 'linear-gradient(90deg,#73d055 50%,#73d055 50%)',
  //   displayText: '出勤㉔',
  // },
  // {
  //   kinmuIdx: 25,
  //   kinmuStartTime: '14:40',
  //   kinmuEndTime: '21:25',
  //   patternName: '出勤㉕',
  //   bg: 'linear-gradient(90deg,#73d055 50%,#73d055 50%)',
  //   displayText: '出勤㉕',
  // },
  // {
  //   kinmuIdx: 26,
  //   kinmuStartTime: '13:40',
  //   kinmuEndTime: '21:25',
  //   patternName: '出勤㉖',
  //   bg: 'linear-gradient(90deg,#73d055 50%,#73d055 50%)',
  //   displayText: '出勤㉖',
  // },
  // {
  //   kinmuIdx: 27,
  //   kinmuStartTime: '12:00',
  //   kinmuEndTime: '21:25',
  //   patternName: '出勤㉗',
  //   bg: 'linear-gradient(90deg,#73d055 50%,#73d055 50%)',
  //   displayText: '出勤㉗',
  // },
  // {
  //   kinmuIdx: 28,
  //   kinmuStartTime: '10:00',
  //   kinmuEndTime: '21:25',
  //   patternName: '出勤㉘',
  //   bg: 'linear-gradient(90deg,#73d055 50%,#73d055 50%)',
  //   displayText: '出勤㉘',
  // },
  // {
  //   kinmuIdx: 29,
  //   kinmuStartTime: '14:10',
  //   kinmuEndTime: '20:55',
  //   patternName: '出勤㉙',
  //   bg: 'linear-gradient(90deg,#73d055 50%,#73d055 50%)',
  //   displayText: '出勤㉙',
  // },
  // {
  //   kinmuIdx: 30,
  //   kinmuStartTime: '13:10',
  //   kinmuEndTime: '20:55',
  //   patternName: '出勤㉚',
  //   bg: 'linear-gradient(90deg,#73d055 50%,#73d055 50%)',
  //   displayText: '出勤㉚',
  // },
  // {
  //   kinmuIdx: 31,
  //   kinmuStartTime: '11:30',
  //   kinmuEndTime: '20:55',
  //   patternName: '出勤㉛',
  //   bg: 'linear-gradient(90deg,#73d055 50%,#73d055 50%)',
  //   displayText: '出勤㉛',
  // },
  // {
  //   kinmuIdx: 32,
  //   kinmuStartTime: '13:40',
  //   kinmuEndTime: '20:55',
  //   patternName: '出勤㉜',
  //   bg: 'linear-gradient(90deg,#73d055 50%,#73d055 50%)',
  //   displayText: '出勤㉜',
  // },
  // {
  //   kinmuIdx: 33,
  //   kinmuStartTime: '12:40',
  //   kinmuEndTime: '20:25',
  //   patternName: '出勤㉝',
  //   bg: 'linear-gradient(90deg,#73d055 50%,#73d055 50%)',
  //   displayText: '出勤㉝',
  // },
  // {
  //   kinmuIdx: 34,
  //   kinmuStartTime: '10:00',
  //   kinmuEndTime: '20:25',
  //   patternName: '出勤㉞',
  //   bg: 'linear-gradient(90deg,#73d055 50%,#73d055 50%)',
  //   displayText: '出勤㉞',
  // },
  // {
  //   kinmuIdx: 35,
  //   kinmuStartTime: '16:10',
  //   kinmuEndTime: '22:55',
  //   patternName: '出勤㉟',
  //   bg: 'linear-gradient(90deg,#73d055 50%,#73d055 50%)',
  //   displayText: '出勤㉟',
  // },
  // {
  //   kinmuIdx: 36,
  //   kinmuStartTime: '15:10',
  //   kinmuEndTime: '22:55',
  //   patternName: '出勤㊱',
  //   bg: 'linear-gradient(90deg,#73d055 50%,#73d055 50%)',
  //   displayText: '出勤㊱',
  // },
  // {
  //   kinmuIdx: 37,
  //   kinmuStartTime: '13:30',
  //   kinmuEndTime: '22:55',
  //   patternName: '出勤㊲',
  //   bg: 'linear-gradient(90deg,#73d055 50%,#73d055 50%)',
  //   displayText: '出勤㊲',
  // },
  // {
  //   kinmuIdx: 38,
  //   kinmuStartTime: '12:30',
  //   kinmuEndTime: '22:55',
  //   patternName: '出勤㊳',
  //   bg: 'linear-gradient(90deg,#73d055 50%,#73d055 50%)',
  //   displayText: '出勤㊳',
  // },
  // {
  //   kinmuIdx: 39,
  //   kinmuStartTime: '11:30',
  //   kinmuEndTime: '22:55',
  //   patternName: '出勤㊴',
  //   bg: 'linear-gradient(90deg,#73d055 50%,#73d055 50%)',
  //   displayText: '出勤㊴',
  // },
  // {
  //   kinmuIdx: 40,
  //   kinmuStartTime: '15:10',
  //   kinmuEndTime: '21:55',
  //   patternName: '出勤㊵',
  //   bg: 'linear-gradient(90deg,#73d055 50%,#73d055 50%)',
  //   displayText: '出勤㊵',
  // },
  // {
  //   kinmuIdx: 41,
  //   kinmuStartTime: '14:10',
  //   kinmuEndTime: '21:55',
  //   patternName: '出勤㊶',
  //   bg: 'linear-gradient(90deg,#73d055 50%,#73d055 50%)',
  //   displayText: '出勤㊶',
  // },
  // {
  //   kinmuIdx: 42,
  //   kinmuStartTime: '12:30',
  //   kinmuEndTime: '21:55',
  //   patternName: '出勤㊷',
  //   bg: 'linear-gradient(90deg,#73d055 50%,#73d055 50%)',
  //   displayText: '出勤㊷',
  // },
  // {
  //   kinmuIdx: 43,
  //   kinmuStartTime: '11:30',
  //   kinmuEndTime: '21:55',
  //   patternName: '出勤㊸',
  //   bg: 'linear-gradient(90deg,#73d055 50%,#73d055 50%)',
  //   displayText: '出勤㊸',
  // },
]

// 数字转带圈字符的映射（1-50 覆盖你的 1-43）
const circledMap: Record<number, string> = {
  1: 'A',
  2: 'B',
  3: 'C',
  4: '④',
  5: '⑤',
  6: '⑥',
  // 7: '⑦',
  // 8: '⑧',
  // 9: '⑨',
  // 10: '⑩',
  // 11: '⑪',
  // 12: '⑫',
  // 13: '⑬',
  // 14: '⑭',
  // 15: '⑮',
  // 16: '⑯',
  // 17: '⑰',
  // 18: '⑱',
  // 19: '⑲',
  // 20: '⑳',
  // 21: '㉑',
  // 22: '㉒',
  // 23: '㉓',
  // 24: '㉔',
  // 25: '㉕',
  // 26: '㉖',
  // 27: '㉗',
  // 28: '㉘',
  // 29: '㉙',
  // 30: '㉚',
  // 31: '㉛',
  // 32: '㉜',
  // 33: '㉝',
  // 34: '㉞',
  // 35: '㉟',
  // 36: '㊱',
  // 37: '㊲',
  // 38: '㊳',
  // 39: '㊴',
  // 40: '㊵',
  // 41: '㊶',
  // 42: '㊷',
  // 43: '㊸',
}

// 转换函数，数字转带圈字符
const getCircledNum = (num: number): string => {
  return circledMap[num] || String(num)
}

// --- 列数自适应计算属性 ---
const newWorkGridColumns = computed(() => {
  const len = newWorkTypeList.value.length
  if (len <= 15) return '1fr' // 15个以内单列
  if (len <= 30) return '1fr 1fr' // 16-30个两列
  return '1fr 1fr 1fr' // 31-43个三列
})

// --- 权限字段（复用你现有的 userStore）---
const businessType = ref(userStore.userInfo?.businessType ?? '')
// 临时预设为 01，用于本地调试预览效果
// const businessType = ref('03')
// 判断是否是SSQ出勤模式,改动SSQ出勤区分模块宽度用
const isNewWorkMode = computed(() => businessType.value === '03')

const supportModalVisible = ref(false)
const activeSupportTab = ref('inner')
const innerShopList = ref<SupportShop[]>([
  { code: '1248', name: '福山本店', businessType: '01' },
  { code: '1129', name: '広島駅前店', businessType: '01' },
])

const dayList = ref<DayItem[]>([])

// 员工配置希望休日期示例（可自由修改日期）
const singleShop = ref<ShopItem>({
  code: '1124800',
  name: '福山本店',
  empList: [
    {
      post: '店長',
      name: '田中太郎',
      restTotal: 9,
      setRest: 9,
      colorMap: {},
      cellText: {},
      hopeDays: ['2026-06-03', '2026-06-08'],
    },
    {
      post: '副店長',
      name: '田中次郎',
      restTotal: 9,
      setRest: 9,
      colorMap: {},
      cellText: {},
      hopeDays: ['2026-06-12'],
    },
    {
      post: '店員',
      name: '田中三郎',
      restTotal: 9,
      setRest: 9,
      colorMap: {},
      cellText: {},
      hopeDays: [],
    },
  ],
})
const groupShopList = ref<ShopItem[]>([
  {
    code: '1124800',
    name: '広島本店',
    empList: [
      {
        post: '店長',
        name: '田中太郎',
        restTotal: 9,
        setRest: 9,
        colorMap: {},
        cellText: {},
        hopeDays: ['2026-06-05'],
      },
      {
        post: '副店長',
        name: '田中三郎',
        restTotal: 8,
        setRest: 9,
        colorMap: {},
        cellText: {},
        hopeDays: ['2026-06-09'],
      },
    ],
  },
  {
    code: '1124801',
    name: '広島駅前店',
    empList: [
      {
        post: '店長',
        name: '鈴木一郎',
        restTotal: 8,
        setRest: 8,
        colorMap: {},
        cellText: {},
        hopeDays: ['2026-05-31'],
      },
      {
        post: '副店長',
        name: '鈴木三郎',
        restTotal: 8,
        setRest: 9,
        colorMap: {},
        cellText: {},
        hopeDays: ['2026-06-17'],
      },
    ],
  },
])

// 全イベントマスタ：全月データを保持
const allEventList = ref<EventItem[]>([
  {
    id: eventIdSeed++,
    yearMonth: '2026-06',
    day: '6/3',
    fullDate: '2026-06-03',
    content: '店長全員WEB研修',
    no: 0,
  },
  {
    id: eventIdSeed++,
    yearMonth: '2026-06',
    day: '6/8',
    fullDate: '2026-06-08',
    content: '外部応援人員面接',
    no: 0,
  },
  {
    id: eventIdSeed++,
    yearMonth: '2026-05',
    day: '5/28',
    fullDate: '2026-05-28',
    content: '前月棚卸作業',
    no: 0,
  },
])

// 取得合併列数
const getColSpan = (startIdx: number) => {
  let count = 0
  const ym = dayList.value[startIdx]?.showYM ?? ''
  for (let i = startIdx; i < dayList.value.length; i++) {
    if (dayList.value[i]?.showYM === ym) count++
    else break
  }
  return count
}

// 生成：前月21日～当月20日、区分年月 21～末=前月、1～20=当月
const makeDayRange = () => {
  dayList.value = []
  const [selY = new Date().getFullYear(), selM = new Date().getMonth() + 1] = selectYM.value
    .split('-')
    .map(Number)
  // 開始：前月21日
  let startY = selY
  let startM = selM - 1
  if (startM < 1) {
    startY = selY - 1
    startM = 12
  }
  const startDate = new Date(startY, startM - 1, 21)
  // 終了：当月20日
  const endDate = new Date(selY, selM - 1, 20)

  const weekArr = ['日', '月', '火', '水', '木', '金', '土']
  const curr = new Date(startDate)
  while (curr <= endDate) {
    const y = curr.getFullYear()
    const m = curr.getMonth() + 1
    const d = curr.getDate()
    const fullDate = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    // 表示用年月
    const showYM = `${m}月`
    dayList.value.push({
      date: fullDate,
      dayNum: d,
      week: curr.getDay(),
      weekName: weekArr[curr.getDay()],
      showYM,
    })
    curr.setDate(curr.getDate() + 1)
  }
  const workBg = 'linear-gradient(90deg,#73d055 50%,#73d055 50%)'
  // 遍历本店员工填充希望休
  singleShop.value.empList.forEach((emp) => {
    dayList.value.forEach((d) => {
      emp.colorMap[d.date] = workBg
    })

    emp.hopeDays.forEach((date) => {
      emp.cellText[date] = '希'
      emp.colorMap[date] = '#fff'
    })
  })
  // =====他店初期化=====
  groupShopList.value.forEach((shop) => {
    shop.empList.forEach((emp) => {
      dayList.value.forEach((d) => {
        emp.colorMap[d.date] = workBg
      })
      emp.hopeDays.forEach((date) => {
        emp.cellText[date] = '希'
        emp.colorMap[date] = '#fff'
      })
    })
  })
}

// 拖拽开始保存当前拖拽項目
const dragStart = (e: DragEvent, item: DragItem) => {
  dragCurrent = item
  cellDragInfo = null

  // 创建和drop-cell同尺寸预览DOM：32px × 28px
  const dragThumb = document.createElement('div')
  dragThumb.style.width = '32px'
  dragThumb.style.height = '28px'
  dragThumb.style.background = item.bg
  dragThumb.style.position = 'absolute'
  dragThumb.style.top = '-9999px'
  dragThumb.style.left = '-9999px'
  dragThumb.style.display = 'flex'
  dragThumb.style.alignItems = 'center'
  dragThumb.style.justifyContent = 'center'
  dragThumb.style.overflow = 'hidden'

  // 内部文字
  if (item.text) {
    const span = document.createElement('span')
    span.textContent = item.text
    span.style.fontSize = '12px'
    span.style.color = getPreviewColor(item.text)
    // 对齐逻辑和表格保持统一
    const align = getPreviewAlign(item.text)
    if (align === 'left') span.style.paddingLeft = '20%'
    if (align === 'right') span.style.paddingRight = '20%'
    dragThumb.appendChild(span)
  }

  document.body.appendChild(dragThumb)
  // setDragImage(预览DOM, 鼠标X偏移, 鼠标Y偏移) 居中吸附
  e.dataTransfer!.setDragImage(dragThumb, 16, 14)
  e.dataTransfer!.effectAllowed = 'move'
  e.dataTransfer!.setData('text/plain', JSON.stringify(item))

  // 拖拽结束销毁临时dom，防止残留
  setTimeout(() => {
    document.body.removeChild(dragThumb)
  }, 0)
}
// 格子拖拽開始記錄位置
const cellDragStart = (e: DragEvent, empIdx: number, date: string, flag: string | number) => {
  cellDragInfo = { empIdx, date, flag }
  dragCurrent = null
}

// 空白處放下：清空数据（恢复希望休？不，拖拽清空后不再自动回希）
const onGlobalDrop = () => {
  if (!cellDragInfo) return
  const { empIdx, date, flag } = cellDragInfo
  let targetEmp!: EmpItem
  if (flag === 'single') {
    targetEmp = singleShop.value.empList[empIdx]!
  }
  delete targetEmp.colorMap[date]
  delete targetEmp.cellText[date]
  cellDragInfo = null
}

// 格子放下
const handleDrop = (e: DragEvent, empIdx: number, date: string, flag: string | number) => {
  e.preventDefault()
  if (!dragCurrent) return
  let targetEmp!: EmpItem
  if (flag === 'single') {
    targetEmp = singleShop.value.empList[empIdx]!
  }

  // 応援→彈窗選店
  if (dragCurrent.kinmuCd === '03') {
    dropTargetInfo = { empIdx, date, flag }
    supportModalVisible.value = true
    return
  }
  // 普通区分：覆蓋原有希
  targetEmp.colorMap[date] = dragCurrent.bg
  targetEmp.cellText[date] = dragCurrent.text ?? ''
}

// 応援選完店：区分名+店コード+店名
const selectSupportShop = (row: SupportShop) => {
  if (!dropTargetInfo || !dragCurrent) return
  const { empIdx, date, flag } = dropTargetInfo
  let targetEmp!: EmpItem
  if (flag === 'single') {
    targetEmp = singleShop.value.empList[empIdx]!
  }
  targetEmp.colorMap[date] = dragCurrent.bg
  targetEmp.cellText[date] = `${row.code}`

  supportModalVisible.value = false
  dropTargetInfo = null
  ElMessage.success('店舗選択完了')
}

// 排班表获取文字对齐
const getTextAlign = (emp: EmpItem, date: string) => {
  // 可根据code匹配对齐，也可以存到cell额外字段，简易方案：按文字匹配
  const txt = emp.cellText[date] ?? ''
  if (['早'].includes(txt)) return 'left'
  if (['中', '希', '㊒', '㊕', '会議'].includes(txt)) return 'center'
  if (['遅'].includes(txt)) return 'right'
  return 'center'
}
// 排班表希望休/有給/特：红色字体，其余黑色
const getTextColor = (emp: EmpItem, date: string) => {
  const txt = emp.cellText[date] ?? ''
  if (['希', '㊒', '㊕'].includes(txt)) return 'red'
  return '#000'
}

// 预览色块文字对齐：和getTextAlign规则一模一样，只传文本
const getPreviewAlign = (txt: string) => {
  if (['早'].includes(txt)) return 'left'
  if (['中', '希', '㊒', '㊕', '会議'].includes(txt)) return 'center'
  if (['遅'].includes(txt)) return 'right'
  return 'center'
}

// 预览色块字体颜色：和getTextColor规则一模一样
const getPreviewColor = (txt: string) => {
  if (['希', '㊒', '㊕'].includes(txt)) return 'red'
  return '#000'
}

// --- 拉取店铺出勤区分数据 ---
const fetchNewWorkList = async (shopCode: string) => {
  try {
    // 这里替换成你的实际接口调用
    // const res = await api.getShopWorkList(shopCode, selectYM.value)
    // 临时断言为 any，绕过 TS 检查
    const res: any = null
    // const res = null // 模拟接口返回为空的情况

    if (res && res.length > 0) {
      // 后端有数据：格式化并赋值
      newWorkTypeList.value = res
        .map((item: any) => ({
          kinmuIdx: item.kinmu_idx,
          kinmuStartTime: item.kinmu_start_time,
          kinmuEndTime: item.kinmu_end_time,
          kinmuTime: item.kinmu_time,
          kinmuNickName: item.kinmu_nick_name,
          patternName: item.pattern_name,
          bg: 'linear-gradient(90deg,#73d055 50%,#73d055 50%)',
          displayText: item.kinmu_nick_name || item.pattern_name,
        }))
        .sort((a: NewWorkItem, b: NewWorkItem) => a.kinmuIdx - b.kinmuIdx) // 按序号排序
    } else {
      // 无数据：使用预设全量数据
      newWorkTypeList.value = [...defaultNewWorkList]
    }
  } catch (err) {
    console.error('拉取出勤区分失败，使用默认数据', err)
    newWorkTypeList.value = [...defaultNewWorkList]
  }
}

// --- 在 onMounted 中调用初始化 ---
onMounted(() => {
  makeDayRange()
  // 拉取当前店铺的出勤区分配置
  fetchNewWorkList(singleShop.value.code)
})

// ===========特殊説明イベント一覧=================
// 現在選択年月のデータ抽出 + 日付古い順ソート
const filterMonthEvent = computed(() => {
  // 先拆分年月并做类型兜底，避免 undefined
  const ymParts = selectYM.value.split('-')
  const selY = Number(ymParts[0])
  const selM = Number(ymParts[1])

  // 校验年月是否为有效数字，防止 NaN
  if (isNaN(selY) || isNaN(selM) || selM < 1 || selM > 12) {
    return []
  }

  // 计算周期开始日期：前一个月的21日
  let startY = selY
  let startM = selM - 1
  if (startM < 1) {
    startY--
    startM = 12
  }
  const startDate = new Date(startY, startM - 1, 21)
  startDate.setHours(0, 0, 0, 0)

  // 计算周期结束日期：当前月的20日
  const endDate = new Date(selY, selM - 1, 20)
  endDate.setHours(23, 59, 59, 999)

  // 3. 过滤日期范围内的事件
  const arr = allEventList.value.filter((item) => {
    const itemDate = new Date(item.fullDate)
    return itemDate >= startDate && itemDate <= endDate
  })

  // 4. 按日期升序排序并重新生成序号
  arr.sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime())
  arr.forEach((item, idx) => {
    item.no = idx + 1
  })

  return arr
})

// 禁用日期的逻辑
// 日期禁用逻辑
const disabledDate = computed(() => {
  return (time: Date) => {
    // 1. 解析年月并做类型校验
    const ymParts = selectYM.value.split('-')
    const year = Number(ymParts[0])
    const month = Number(ymParts[1])

    // 无效年月直接禁用所有日期
    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      return true
    }

    // 2. 转为 0-11 的月份
    const currentMonth = month - 1

    // 3. 计算周期起止日期
    let startYear = year
    let startMonth = currentMonth - 1
    if (startMonth < 0) {
      startYear--
      startMonth = 11 // 上一年12月
    }
    const startDate = new Date(startYear, startMonth, 21)
    const endDate = new Date(year, currentMonth, 20, 23, 59, 59)

    // 不在范围内的日期禁用
    return time < startDate || time > endDate
  }
})

// データを左右2列分割：横詰め（先横後縦）
const leftEventList = computed(() => {
  const list = filterMonthEvent.value
  // 取所有索引为偶数的元素（0, 2, 4...）
  return list.filter((_, idx) => idx % 2 === 0)
})
const rightEventList = computed(() => {
  const list = filterMonthEvent.value
  // 取所有索引为奇数的元素（1, 3, 5...）
  return list.filter((_, idx) => idx % 2 === 1)
})

// 强制刷新组件
const pickerKey = ref(0)
// 特殊说明開弹窗重置表单
const openAddEvent = () => {
  eventAddForm.value = {
    fullDate: '',
    showDay: '',
    content: '',
  }
  eventAddDialogVisible.value = true
}

// 日付選択後自動生成表示用 月/日
const formatDate = (dateVal: string | Date | null): string => {
  if (!dateVal) return ''

  let year: number, month: number, day: number

  if (typeof dateVal === 'string') {
    // 直接按字符串拆分，彻底避开new Date()的时区问题
    const parts = dateVal.split('-')
    if (parts.length !== 3) return ''
    year = Number(parts[0])
    month = Number(parts[1])
    day = Number(parts[2])
  } else if (dateVal instanceof Date) {
    // 用UTC时间获取，避免时区偏移
    year = dateVal.getUTCFullYear()
    month = dateVal.getUTCMonth() + 1
    day = dateVal.getUTCDate()
  } else {
    return ''
  }

  // 校验日期有效性
  if (isNaN(year) || isNaN(month) || isNaN(day)) return ''
  if (month < 1 || month > 12 || day < 1 || day > 31) return ''

  return `${month}/${day}`
}

// 日付選択後自動生成表示用 月/日
const handleDateChange = (val: string | Date | null) => {
  console.log('原始val:', val)
  eventAddForm.value.showDay = formatDate(val)
  console.log('处理后showDay:', eventAddForm.value.showDay)
}

// 登録実行
const submitAddEvent = () => {
  const { fullDate, content } = eventAddForm.value

  // 校验1：日期和内容不能为空
  if (!fullDate || !content.trim()) {
    ElMessage.warning('日付と内容を入力してください')
    return
  }
  // 长度校验（双重保险）
  if (content.length > 20) {
    ElMessage.error('内容は20文字以内で入力してください')
    return
  }

  // 直接用 Date 对象解析日期，不依赖字符串格式
  const dateObj = new Date(fullDate)
  if (isNaN(dateObj.getTime())) {
    ElMessage.warning('有効な日付を選択してください')
    return
  }

  // 强制生成 showDay（兜底所有格式问题）
  const finalShowDay = `${dateObj.getMonth() + 1}/${dateObj.getDate()}`
  eventAddForm.value.showDay = finalShowDay

  addNewEvent(finalShowDay, fullDate, content.trim())
  eventAddDialogVisible.value = false
}

const addNewEvent = (showDay: string, fullDate: string, content: string) => {
  const newItem = {
    id: eventIdSeed++,
    yearMonth: selectYM.value,
    day: showDay,
    fullDate: fullDate,
    content: content,
    no: 0,
  }
  allEventList.value.push(newItem)
  ElMessage.success('当月説明追加完了')
}

// 实现动态分配排班预览区域的模块显示比例，1. 计算新出勤的实际列数（根据数据条数）
const newWorkColCount = computed(() => {
  const len = newWorkTypeList.value.length
  if (len <= 15) return 1
  if (len <= 30) return 2
  return 3
})

// 2. 计算新出勤模块所需的总宽度（固定列宽 + 间隙）
const newWorkRequiredWidth = computed(() => {
  const colWidth = 200 // 每列固定宽度
  const gap = 20 // 列间隙
  const count = newWorkColCount.value
  return colWidth * count + gap * (count - 1)
})

// 3. 计算父容器默认三等分宽度（用于判断是否需要扩容）
const defaultColWidth = computed(() => {
  // 这里可以直接用父容器宽度 / 3，或者用一个预估的默认值
  // 方案A：如果父容器宽度固定，直接写死预估（比如 1200px 宽的容器，三等分是 400px）
  return 400
  // 方案B：如果父容器宽度是响应式的，可以用 ref 记录实际宽度，这里先按方案A演示
})

// 4. 判断是否需要扩容
const needExpandNewWork = computed(() => {
  return newWorkRequiredWidth.value > defaultColWidth.value
})
// 5.根据是否需要扩容，生成不同的 gridTemplateColumns
const bottomGridColumns = computed(() => {
  if (!isNewWorkMode.value) {
    // 旧模式：三等分
    return '1fr 1fr 1fr'
  }

  if (!needExpandNewWork.value) {
    // 新模式但列数少，未超出默认宽度：仍然三等分
    return '1fr 1fr 1fr'
  }

  // 新模式且需要扩容：新模块用固定宽度，剩下的两列均分
  const newWorkWidth = `${newWorkRequiredWidth.value}px`
  // 剩下的宽度给休暇和应援，各 1fr
  return `${newWorkWidth} 1fr 1fr`
})

const tempSave = () => ElMessage.success('一時保存完了')
const submitSave = () => ElMessage.success('登録完了')
const printPage = () => window.print()

onMounted(() => makeDayRange())

// グループ以外応援 検索条件
const outerSearchForm = ref({
  businessType: '',
  shopKeyword: '',
})

// 検索実行時に保存する検索条件（テーブル絞込に使用）
const searchCondition = ref({
  businessType: '',
  shopKeyword: '',
})

// 業態選択肢
const businessTypeOptions = ref([
  { label: '', value: '' },
  { label: '青山', value: '01' },
  { label: 'SSQ', value: '03' },
])

// 外部店舗 元データ（固定保存）
const originOuterShopList = ref<SupportShop[]>([
  { code: '1560', name: '岡山総本店', businessType: '01' },
  { code: '1561', name: '岡山総支店', businessType: '01' },
  { code: '3561', name: '倉敷店', businessType: '03' },
  { code: '3562', name: '横浜店', businessType: '03' },
])

// 店舗ドロップダウン候補：業態だけでリアルタイム絞込（検索ボタン不要）
const outerShopOptions = computed(() => {
  return originOuterShopList.value
    .filter((item) => {
      const bt = outerSearchForm.value.businessType
      if (!bt) return true
      return (item as any).businessType === bt
    })
    .map((item) => ({
      label: `${item.code} ${item.name}`,
      value: item.code,
    }))
})

// テーブル表示用データ：検索ボタン押下後の条件で絞込
const filterOuterShopList = computed(() => {
  let list = [...originOuterShopList.value]
  const bt = searchCondition.value.businessType
  const keyword = searchCondition.value.shopKeyword.trim()
  if (!bt && !keyword) {
    return []
  }
  // 業態条件フィルタ
  if (bt) {
    list = list.filter((item) => (item as any).businessType === bt)
  }
  // 店舗コード/名称曖昧検索
  if (keyword) {
    list = list.filter((item) => item.code.includes(keyword) || item.name.includes(keyword))
  }
  return list
})
const outerShopList = computed(() => filterOuterShopList.value)

// 検索ボタンクリック：現在の入力条件を確定しテーブル更新
const searchOuterShop = () => {
  searchCondition.value = {
    businessType: outerSearchForm.value.businessType,
    shopKeyword: outerSearchForm.value.shopKeyword,
  }
}

watch(
  () => outerSearchForm.value.businessType,
  () => {
    outerSearchForm.value.shopKeyword = ''
  },
)

const eventEditMode = ref(false)
let originEventBackup: EventItem[] = []
/** 変更ボタン：編集モード切り替え */
const toggleEventEdit = () => {
  // 編集開始時に元データをバックアップ
  originEventBackup = JSON.parse(JSON.stringify(allEventList.value))
  eventEditMode.value = true
}

/** 日付変更時、画面表示用 day を更新 */
const updateEventShowDay = (item: EventItem) => {
  item.day = formatDate(item.fullDate)
}

/** 単条イベント削除 */
const deleteEvent = (delId: number) => {
  allEventList.value = allEventList.value.filter((e) => e.id !== delId)
  ElMessage.success('削除完了')
}

/** 保存ボタン：追加・編集した内容を確定保存 */
const saveAllEvent = () => {
  // 文字数チェック
  const overItem = allEventList.value.find((e) => e.content.length > 20)
  if (overItem) {
    ElMessage.error(`項${overItem.no}：内容は20文字以内にしてください`)
    return
  }
  // 日付重複チェック（同一日内複数イベント許可しない場合）
  const dateArr = allEventList.value.map((i) => i.fullDate)
  const unique = new Set(dateArr)
  if (unique.size !== dateArr.length) {
    ElMessage.warning('同一日に複数イベントは登録できません')
    return
  }
  eventEditMode.value = false
  ElMessage.success('イベント情報保存完了')
}
</script>

<style scoped>
.container {
  padding: 12px;
  background: #f5f7fa;
}

.top-card {
  margin-bottom: 10px;
}

.line1,
.line2 {
  margin: 5px 0;
  font-size: 15px;
}

.flex-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.btn-row {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
  margin-top: 8px;
}

.shift-table {
  border-collapse: collapse !important;
  border: 0.5px solid #999;
  font-size: 12px;
  width: 100%;
}

.shift-table th,
.shift-table td {
  border: 0.5px solid #999 !important;
  padding: 2px;
  text-align: center;
}

.title-th {
  background: #ffcc00 !important;
  font-size: 18px;
}

.fixed-th {
  background: #f7f7f7;
  width: 70px;
}

.fixed-cell {
  width: 70px;
  height: 28px;
}

.day-head,
.week-head,
.empty-th {
  width: 32px;
  height: 26px;
}

.drop-cell {
  width: 32px;
  height: 28px;
  position: relative;
  padding: 0;
  overflow: hidden;
}

.split-bg {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.cell-text {
  position: relative;
  z-index: 2;
  font-size: 14px;
  line-height: 1.1;
}

.sun {
  color: #f00;
}

.sat {
  color: #0066ff;
}

.bottom-type-wrap {
  display: flex;
  gap: 20px;
  margin-top: 12px;
}

.type-col {
  flex: 1;
}

.col-title {
  font-weight: bold;
  font-size: 14px;
  margin-bottom: 6px;
  padding-bottom: 3px;
  border-bottom: 1px solid #ccc;
}

/* 拖拽项：文字在前，色块在后 */
.drag-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border: 1px solid #eee;
  border-radius: 4px;
  cursor: grab;
}

.item-text {
  font-size: 14px;
  white-space: nowrap;
  width: 150px;
}

.small-block {
  width: 80px;
  height: 26px;
  border-radius: 1px;
  display: flex;
  align-items: center;
}

.block-text {
  width: 100%;
  font-size: 14px;
}

.block-text.left {
  text-align: left;
  padding-left: 25%;
}

.block-text.center {
  text-align: center;
}

.block-text.right {
  text-align: right;
  padding-right: 25%;
}

.cell-text.left {
  text-align: left;
  padding-left: 20%;
}

.cell-text.center {
  width: 100%;
}

.cell-text.right {
  text-align: right;
  padding-right: 20%;
}

.event-title {
  width: 100%;
  font-size: 24px;
  text-align: center;
  padding: 8px 0;
  background: #fff3d9;
  margin: -12px 0 0 0;
  border-radius: 4px 4px 0 0;
  border: 1px dashed #999;
  border-bottom: none;
}

.event-wrap {
  display: flex;
  gap: 100px;
  /* 左右カラム隙間 */
  min-height: 60px;
  overflow-y: auto;
  margin-top: 0;
  padding: 0;
}

.event-col {
  flex: 1;
}

.event-table {
  width: 100%;
  border-collapse: collapse;
  border-left: 1px solid #999;
  border-right: 1px solid #999;
  border-bottom: 1px solid #999;
  font-size: 17px;
}

.event-table th,
.event-table td {
  border: 1px solid #999;
  border-top: 0;
  padding: 6px 4px;
  text-align: center;
}

.event-table thead th {
  background-color: #e8f1e4;
  font-weight: normal;
}

.th-no {
  width: 36px;
}

.th-day {
  width: 65px;
}

.th-content {
  flex: 1;
}

/* 奇偶行背景色 */
.event-table tr.odd {
  background-color: #f2f2f2;
}

.event-table tr.even {
  background-color: #e1ecf6;
}

/* SSQ出勤区分显示 */

/* SSQ出勤区分列间隙 */
.new-work-grid--custom {
  display: grid;
  gap: 10px;
  /* 列之间固定间隙 */
  grid-auto-flow: column;
  grid-template-rows: repeat(15, min-content);
}

/* 关键：给每列设置固定宽度 */
.new-work-grid--custom > * {
  min-width: 250px;
  /* 固定每列宽度，可按需调整 */
}

/* SSQ出勤区分色块宽度 */
.small-block--custom {
  width: 40px !important;
  flex-shrink: 0;
  /* 防止被压缩 */
}

.small-block--custom .block-text {
  font-size: 16px;
}
</style>
