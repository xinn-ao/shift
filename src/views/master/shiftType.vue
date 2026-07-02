<template>
  <div class="container">
    <!-- 画面タイトル -->
    <div class="page-title">シフト区分</div>

    <!-- 検索＋ボタン同一カード内2行配置：1行検索、2行ボタン右寄せ -->
    <el-card shadow="hover" class="search-card">
      <!-- 1行目：検索エリア -->
      <el-form inline label-width="55px">
        <el-form-item label="業態">
          <el-select
            v-model="search.bizType"
            placeholder="--業態選択--"
            clearable
            style="width: 160px"
          >
            <el-option
              v-for="item in bizList"
              :key="item.code"
              :label="item.name"
              :value="item.code"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="searchData" :disabled="!search.bizType">検索</el-button>
        </el-form-item>
      </el-form>

      <!-- 2行目：変更・追加・保存 右寄せ -->
      <div class="btn-group">
        <el-button type="primary" @click="handleEdit" :disabled="!excuteSearch">変更</el-button>
        <el-button type="primary" @click="handleAdd" :disabled="!excuteSearch">追加</el-button>
        <el-button type="success" :disabled="!editFlag" @click="handleSaveAll">保存</el-button>
      </div>
    </el-card>

    <!-- 一覧テーブル -->
    <el-table :data="tableData" border style="width: 100%; margin-top: 10px">
      <el-table-column label="区分ID" width="90" align="center">
        <template #default="{ row }">
          <el-input v-if="row.isNew && (row.type == '01')" v-model="row.id" size="small" />
          <span v-else>{{ row.id }}</span>
        </template>
      </el-table-column>
      <el-table-column label="区分名" align="center">
        <template #default="{ row }">
          <el-input v-if="(isEditMode || row.isNew) && (row.type == '01')" v-model="row.name" size="small" />
          <span v-else>{{ row.name }}</span>
        </template>
      </el-table-column>
      <el-table-column label="区分タイプ" width="120" align="center">
        <template #default="{ row }">
          <!-- <el-select
            v-if="isEditMode || row.isNew"
            v-model="row.type"
            size="small"
            placeholder="タイプ選択"
            style="width: 90px"
            @change="calcWorkHour(row)"
          >
            <el-option
              v-for="opt in typeOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select> -->
          <span>{{ getTypeName(row.type) }}</span>
        </template>
      </el-table-column>

      <!-- 追加1：勤務開始時間 -->
      <el-table-column label="勤務開始時間" width="140" align="center" v-if="ssqSearch">
        <template #default="{ row }">
          <el-input
            v-if="isEditMode || row.isNew"
            v-model="row.startTime"
            size="small"
            placeholder="HH:MM"
            :disabled="row.type !== '01'"
            @blur="calcWorkHour(row)"
          />
          <span v-else>{{ row.startTime || '-' }}</span>
        </template>
      </el-table-column>

      <!-- 追加2：勤務終了時間 -->
      <el-table-column label="勤務終了時間" width="140" align="center" v-if="ssqSearch">
        <template #default="{ row }">
          <el-input
            v-if="isEditMode || row.isNew"
            v-model="row.endTime"
            size="small"
            placeholder="HH:MM"
            :disabled="row.type !== '01'"
            @blur="calcWorkHour(row)"
          />
          <span v-else>{{ row.endTime || '-' }}</span>
        </template>
      </el-table-column>

      <!-- 追加3：実働時間 -->
      <el-table-column label="実働時間" width="120" align="center" v-if="ssqSearch">
        <template #default="{ row }">
          <el-input
            v-if="isEditMode || row.isNew"
            v-model="row.workHour"
            size="small"
            placeholder="HH:MM"
            :disabled="row.type !== '01'"
          />
          <span v-else>{{ row.workHour || '-' }}</span>
        </template>
      </el-table-column>

      <el-table-column label="説明" align="center">
        <template #default="{ row }">
          <el-input v-if="(isEditMode || row.isNew) && (row.type == '01')" v-model="row.desc" size="small" />
          <span v-else>{{ row.desc }}</span>
        </template>
      </el-table-column>
      <el-table-column label="順番" width="80" align="center">
        <template #default="{ row }">
          <el-input
            v-if="(isEditMode || row.isNew) && (row.type == '01')"
            v-model.number="row.sort"
            size="small"
            type="number"
            style="width: 50px"
          />
          <span v-else>{{ row.sort }}</span>
        </template>
      </el-table-column>
      <el-table-column label="利用状態" width="90" align="center">
        <template #default="{ row }">
          {{ row.useFlag ? '利用可' : '利用不可' }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="260" align="center">
        <template #default="{ row }">
          <el-button type="success" size="small" @click="setStatus(row, true)">利用可</el-button>
          <el-button type="danger" size="small" @click="setStatus(row, false)">利用不可</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 确认弹窗，复用统一样式 -->
    <el-dialog
      v-model="saveAllDialogVisible"
      title="確認"
      width="420px"
      :show-close="true"
      custom-class="message-box-dialog"
      append-to-body
    >
      <div class="msg-content">
        <el-icon color="#909399" size="24">
          <InfoFilled />
        </el-icon>
        <span>現在の内容を保存します。よろしいですか？</span>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="saveAllDialogVisible = false">キャンセル</el-button>
          <el-button type="primary" @click="handleConfirmSaveAll">確認</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { ref, reactive } from 'vue'

interface BizItem {
  code: string
  name: string
}
// インターフェースに時間3項目追加
interface RowItem {
  tempId: number
  id: string
  name: string
  type: string
  desc: string
  sort: number
  useFlag: boolean
  isNew: boolean
  startTime: string // 勤務開始 HH:MM:SS
  endTime: string // 勤務終了 HH:MM:SS
  workHour: string // 実働時間 HH:MM:SS
}

const ssqSearch = ref(false)

// 区分タイプ選択肢
const typeOptions = ref([
  { label: '出勤', value: '01' },
  { label: '休暇', value: '02' },
  { label: '応援', value: '03' },
])

// 区分タイプコード → 表示名取得
const getTypeName = (code: string) => {
  const opt = typeOptions.value.find((item) => item.value === code)
  return opt?.label ?? ''
}

const editFlag = ref(false)
const excuteSearch = ref(false)
const search = reactive({
  bizType: '',
})
const isEditMode = ref(false)
let originSource: RowItem[] = []

const bizList = ref<BizItem[]>([
  { code: '01', name: '青山' },
  { code: '03', name: 'SSQ' },
])

const tableData = ref<RowItem[]>([])
let addSeq = 1

// 時間文字列HH:MM:SS → 合計秒数変換
const timeToSecond = (timeStr: string): number => {
  if (!timeStr) return 0
  const arr = timeStr.split(':').map(Number)
  const h = arr[0] ?? 0
  const m = arr[1] ?? 0
  const s = arr[2] ?? 0
  return h * 3600 + m * 60 + s
}
// 秒数 → HH:MM:SS
const secondToTime = (sec: number): string => {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// 開始・終了時間から実働自動計算
const calcWorkHour = (row: RowItem) => {
  if (row.type !== '01') {
    row.workHour = ''
    return
  }
  const s = timeToSecond(row.startTime)
  const e = timeToSecond(row.endTime)
  if (s === 0 || e === 0) {
    row.workHour = ''
    return
  }
  const diff = e >= s ? e - s : e + 24 * 3600 - s
  row.workHour = secondToTime(diff)
}

const searchData = () => {
  isEditMode.value = false
  const initData: RowItem[] = [
    {
      tempId: addSeq++,
      id: 'D001',
      name: '休日区分A',
      type: '01',
      desc: '定休日設定用',
      sort: 1,
      useFlag: true,
      isNew: false,
      startTime: '09:00',
      endTime: '18:00',
      workHour: '09:00',
    },
    {
      tempId: addSeq++,
      id: 'D002',
      name: '休日区分B',
      type: '02',
      desc: '法定祝日',
      sort: 2,
      useFlag: false,
      isNew: false,
      startTime: '',
      endTime: '',
      workHour: '',
    },
    {
      tempId: addSeq++,
      id: 'D003',
      name: '休日区分C',
      type: '03',
      desc: '臨時公休',
      sort: 3,
      useFlag: true,
      isNew: false,
      startTime: '',
      endTime: '',
      workHour: '',
    },
  ]
  originSource = JSON.parse(JSON.stringify(initData))
  tableData.value = initData
  excuteSearch.value = true
  if (search.bizType === '03') {
    ssqSearch.value = true
  } else {
    ssqSearch.value = false
  }
}

const handleAdd = () => {
  editFlag.value = true
  const newRow: RowItem = {
    tempId: addSeq++,
    id: '',
    name: '',
    type: '01',
    desc: '',
    sort: 0,
    useFlag: false,
    isNew: true,
    startTime: '',
    endTime: '',
    workHour: '',
  }
  tableData.value.push(newRow)
}

const handleEdit = () => {
  editFlag.value = true
  isEditMode.value = true
}

const setStatus = (row: RowItem, flag: boolean) => {
  row.useFlag = flag
}

// 弹窗状态
const saveAllDialogVisible = ref(false)

// 点击保存按钮，只打开弹窗
const handleSaveAll = () => {
  saveAllDialogVisible.value = true
}
// 弹窗确认后执行你原本所有保存逻辑
const handleConfirmSaveAll = () => {
  saveAllDialogVisible.value = false

  // 下面全部是你原来的业务代码，没有任何修改
  console.log('保存送信データ', tableData.value)
  tableData.value.forEach((item) => {
    item.isNew = false
  })
  originSource = JSON.parse(JSON.stringify(tableData.value))
  isEditMode.value = false
  ElMessage.success('保存完了して、一覧更新しました。')
}
</script>

<style scoped>
.container {
  padding: 16px;
  background-color: #f5f7fa;
  min-height: 80vh;
}

.page-title {
  font-size: 20px;
  font-weight: 500;
  margin-bottom: 12px;
}

.search-card {
  padding: 16px;
}

.btn-group {
  margin-top: 12px;
  text-align: right;
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.msg-content {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 5px 0;
}
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
