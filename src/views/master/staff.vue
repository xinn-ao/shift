<template>
  <div class="container">
    <!-- 画面タイトル -->
    <div class="page-title">従業員</div>

    <!-- 検索・ボタン同一el-card、1行検索、2行ボタン右寄せ -->
    <el-card shadow="hover" class="search-card">
      <!-- 上段：検索エリア -->
      <el-form
        inline
        label-width="55px"
        v-if="['JINJI_USER', 'SYSTEM_USER'].includes(userStore.role)"
        @submit.native.prevent
      >
        <el-form-item label="店番">
          <el-input
            v-model="search.shopCode"
            placeholder="店番を入力"
            clearable
            style="width: 180px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="searchData" :disabled="!search.shopCode"
            >検索</el-button
          >
        </el-form-item>
      </el-form>

      <!-- 下段：追加・変更・保存 右寄せ -->
      <div class="btn-group">
        <el-button type="primary" @click="handleEdit" :disabled="!excuteSearch && tableData"
          >変更</el-button
        >
        <el-button type="primary" @click="handleAdd" :disabled="!excuteSearch">追加</el-button>
        <el-button type="success" :disabled="!editFlag" @click="handleSaveAll">保存</el-button>
      </div>
    </el-card>

    <!-- 一覧：el-table -->
    <el-table :data="tableData" border style="width: 100%; margin-top: 10px">
      <el-table-column label="社員番号" align="center">
        <template #default="{ row }">
          <el-input v-if="row.isNew" v-model="row.empCode" size="small" />
          <span v-else>{{ row.empCode }}</span>
        </template>
      </el-table-column>
      <el-table-column label="従業員名" align="center">
        <template #default="{ row }">
          <el-input v-if="isEditMode || row.isNew" v-model="row.empName" size="small" />
          <span v-else>{{ row.empName }}</span>
        </template>
      </el-table-column>
      <el-table-column label="店舗" align="center">
        <template #default="{ row }">
          <!-- <el-input v-if="row.isNew" v-model="row.shopName" size="small" /> -->
          <span>{{ row.shopName }}</span>
        </template>
      </el-table-column>
      <el-table-column label="配属開始日" align="center">
        <template #default="{ row }">
          <el-date-picker
            class="table-date-picker"
            style="width: 160px"
            v-if="row.isNew"
            v-model="row.startDate"
            type="date"
            size="small"
            format="YYYY/MM/DD"
            value-format="YYYY/MM/DD"
          />
          <span v-else>{{ row.startDate || '' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="配属終了日" align="center">
        <template #default="{ row }">
          <el-date-picker
            class="table-date-picker"
            style="width: 160px"
            v-if="isEditMode || row.isNew"
            v-model="row.endDate"
            type="date"
            size="small"
            format="YYYY/MM/DD"
            value-format="YYYY/MM/DD"
          />
          <span v-else>{{ row.endDate || '' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="役職コード" align="center">
        <template #default="{ row }">
          <el-input v-if="row.isNew" v-model="row.postCode" size="small" />
          <span v-else>{{ row.postCode }}</span>
        </template>
      </el-table-column>
      <el-table-column label="役職名" align="center">
        <template #default="{ row }">
          <el-input v-if="row.isNew" v-model="row.postName" size="small" />
          <span v-else>{{ row.postName }}</span>
        </template>
      </el-table-column>
      <el-table-column label="出勤区分" align="center">
        <template #default="{ row }">
          <el-select
            v-if="isEditMode || row.isNew"
            v-model="row.workTypeCode"
            placeholder="選択"
            size="small"
          >
            <el-option
              v-for="opt in workTypeOptions"
              :key="opt.code"
              :label="opt.name"
              :value="opt.code"
            />
          </el-select>
          <span v-else>{{ getWorkTypeName(row.workTypeCode) }}</span>
        </template>
      </el-table-column>
    </el-table>

    <!-- 统一样式确认弹窗 -->
    <el-dialog
      v-model="saveDialogVisible"
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
          <el-button @click="handleCancel">キャンセル</el-button>
          <el-button type="primary" @click="handleConfirm">確認</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useUserStore } from '@/stores/user'
import { ElMessage, ElMessageBox } from 'element-plus'
const userStore = useUserStore()
const excuteSearch = ref(false)
interface ShopItem {
  code: string
  name: string
}
interface EmpRow {
  tempId: number
  empCode: string
  empName: string
  shopName: string
  startDate: string | null
  endDate: string | null
  postCode: string
  postName: string
  workTypeCode: string
  isNew: boolean
  shopCode: string
}

const editFlag = ref(false)

const search = reactive({
  shopCode: '',
})
const isEditMode = ref(false)

const tableData = ref<EmpRow[]>([])
const originBackup = ref<EmpRow[]>([])
let seq = 1

const formatDateStr = (y: number, m: number, d: number) => {
  const mm = String(m).padStart(2, '0')
  const dd = String(d).padStart(2, '0')
  return `${y}/${mm}/${dd}`
}
const searchData = () => {
  isEditMode.value = false
  if (!search.shopCode) {
    tableData.value = []
    originBackup.value = []
    return
  }
  const allEmpData: EmpRow[] = [
    {
      tempId: seq++,
      empCode: 'E001',
      empName: '田中太郎',
      shopName: '岡山総本店',
      shopCode: '11',
      startDate: formatDateStr(2025, 1, 1),
      endDate: null,
      postCode: 'P01',
      postName: '店長',
      workTypeCode: 'work',
      isNew: false,
    },
    {
      tempId: seq++,
      empCode: 'E002',
      empName: '鈴木花子',
      shopName: '岡山総本店',
      shopCode: '11',
      startDate: formatDateStr(2025, 2, 1),
      endDate: null,
      postCode: 'P02',
      postName: '店員',
      workTypeCode: 'work',
      isNew: false,
    },
    {
      tempId: seq++,
      empCode: 'P001',
      empName: '田中花子',
      shopName: '岡山総支店',
      shopCode: '12',
      startDate: formatDateStr(2025, 1, 1),
      endDate: null,
      postCode: 'P01',
      postName: '店長',
      workTypeCode: 'work',
      isNew: false,
    },
    {
      tempId: seq++,
      empCode: 'P002',
      empName: '鈴木太郎',
      shopName: '岡山総支店',
      shopCode: '12',
      startDate: formatDateStr(2025, 2, 1),
      endDate: null,
      postCode: 'P02',
      postName: '店員',
      workTypeCode: 'work',
      isNew: false,
    },
  ]
  const filterData = allEmpData.filter((row) => row.shopCode === search.shopCode)
  originBackup.value = JSON.parse(JSON.stringify(filterData))
  tableData.value = filterData
  excuteSearch.value = true
}
if (['SHOP_USER', 'SUB_SHOP_USER', 'GROUP_USER'].includes(userStore.userInfo.role)) {
  search.shopCode = userStore.userInfo.storeCd
  searchData()
}
interface WorkTypeItem {
  code: string
  name: string
}
// 出勤区分下拉リスト
const workTypeOptions = ref<WorkTypeItem[]>([
  { code: 'work', name: '出勤' },
  { code: 'early1', name: '時差出勤(早番)' },
  { code: 'half1', name: '時差出勤(中番)' },
  { code: 'late1', name: '時差出勤(遅番)' },
  { code: 'unpaid', name: '無給' },
])
//コード→名称変換
const getWorkTypeName = (code: string) => {
  const find = workTypeOptions.value.find((p) => p.code === code)
  return find?.name || ''
}
const handleAdd = () => {
  editFlag.value = true
  const newRow: EmpRow = {
    tempId: seq++,
    empCode: '',
    empName: '',
    shopName: tableData.value.filter((row) => row.shopCode === search.shopCode)[0]?.shopName || '',
    startDate: null,
    endDate: null,
    postCode: '',
    postName: '',
    workTypeCode: '',
    isNew: true,
    shopCode: search.shopCode,
  }
  tableData.value.push(newRow)
}

const handleEdit = () => {
  isEditMode.value = true
  editFlag.value = true
}

// 弹窗状态
const saveDialogVisible = ref(false)

// 点击保存按钮，打开弹窗
const handleSaveAll = () => {
  saveDialogVisible.value = true
}
// 弹窗点击确认
const handleConfirm = () => {
  saveDialogVisible.value = false
  // 原有确认后的业务逻辑完全不变
  tableData.value.forEach((item) => (item.isNew = false))
  originBackup.value = JSON.parse(JSON.stringify(tableData.value))
  isEditMode.value = false
  ElMessage.success('保存完了して、一覧更新しました。')
}

// 弹窗点击取消
const handleCancel = () => {
  saveDialogVisible.value = false
  //   ElMessage.info('登録をキャンセルしました')
}
</script>

<style scoped>
.container {
  background-color: #f5f7fa;
  min-height: 80vh;
  padding: 16px;
}

/* テーブル内専用日付選択器 縮小スタイル */
:deep(.table-date-picker .el-date-editor.el-input__inner) {
  padding: 0 4px !important;
  /* 左右内余白削減 */
  font-size: 11px !important;
  /* 文字サイズ縮小 */
  min-width: 0 !important;
  width: 40px !important;
}

/* カレンダーアイコン幅縮小 */
:deep(.table-date-picker .el-input__suffix) {
  width: 16px !important;
}

:deep(.table-date-picker .el-input__suffix-inner) {
  font-size: 12px;
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
