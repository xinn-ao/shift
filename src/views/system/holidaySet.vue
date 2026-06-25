<template>
  <div class="container">
    <!-- 画面タイトル -->
    <div class="page-title">月別公休数設定（青山、SSQ）</div>

    <!-- 検索・ボタン同一el-card内、2段構成：上段検索、下段ボタン右寄せ -->
    <el-card shadow="hover" class="search-card">
      <!-- 1行目 検索項目 -->
      <el-form inline label-width="70px">
        <el-form-item label="">
          <el-select
            v-model="search.shopId"
            placeholder="--業態選択--"
            @change="loadData"
            clearable
            style="width: 160px"
          >
            <el-option
              v-for="item in shopList"
              :key="item.shopId"
              :label="item.shopName"
              :value="item.shopId"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="">
          <el-select v-model="search.year" @change="loadData" style="width: 100px">
            <el-option v-for="y in yearList" :key="y" :label="`${y}年`" :value="y" />
          </el-select>
        </el-form-item>
      </el-form>

      <!-- 2行目：保存・キャンセル 右寄せ -->
      <div class="btn-group">
        <el-button type="success" @click="save" :disabled="!search.shopId">保存</el-button>
      </div>
    </el-card>

    <!-- 一覧テーブル -->
    <el-table :data="tableData" border style="width: 100%; margin-top: 10px">
      <el-table-column label="月" width="120" align="center">
        <template #default="{ row }">
          <span :class="{ gray: row.isPassMonth }">{{ row.month }}月</span>
        </template>
      </el-table-column>
      <el-table-column label="公休数" align="center">
        <template #default="{ row }">
          <el-input
            v-model.number="row.holidayCnt"
            type="number"
            min="0"
            size="small"
            style="width: 72px"
            :disabled="row.isPassMonth"
          />
        </template>
      </el-table-column>
    </el-table>

    <!-- 保存 -->
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
          <el-button @click="saveDialogVisible = false">キャンセル</el-button>
          <el-button type="primary" @click="handleConfirmSave">確認</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { ref, reactive, computed, onMounted } from 'vue'

interface ShopItem {
  shopId: string
  shopName: string
}
interface Search {
  shopId: string
  year: number
}
interface TableItem {
  month: number
  holidayCnt: number
  isPassMonth: boolean
}

const now = new Date()
const currentYear = now.getFullYear()
const currentMonth = now.getMonth() + 1

const search: Search = reactive({
  shopId: '',
  year: currentYear,
})

const yearList = computed(() => [currentYear, currentYear + 1])

const shopList = ref<ShopItem[]>([
  { shopId: 'S001', shopName: '青山' },
  { shopId: 'S002', shopName: 'SSQ' },
])

const originBackup = ref<TableItem[]>([])
const tableData = ref<TableItem[]>([])

const loadData = () => {
  if (!search.shopId || !search.year) {
    tableData.value = []
    return
  }
  const arr: TableItem[] = []
  for (let m = 1; m <= 12; m++) {
    const isPass = search.year === currentYear && m < currentMonth
    arr.push({
      month: m,
      holidayCnt: Math.floor(Math.random() * 5),
      isPassMonth: isPass,
    })
  }
  originBackup.value = JSON.parse(JSON.stringify(arr))
  tableData.value = arr
}

onMounted(() => {
  if (search.shopId) loadData()
})

// 弹窗显示状态
const saveDialogVisible = ref(false)

// 点击保存按钮：只打开弹窗，不执行保存逻辑
const save = () => {
  saveDialogVisible.value = true
}
// 弹窗确认：执行你原来全部的保存业务代码
const handleConfirmSave = () => {
  // 先关闭弹窗
  saveDialogVisible.value = false

  console.log('送信データ', tableData.value, search)
  ElMessage.success('保存完了しました。')
  originBackup.value = JSON.parse(JSON.stringify(tableData.value))
}
</script>

<style scoped>
.container {
  background-color: #f5f7fa;
  min-height: 80vh;
  padding: 16px;
}

:deep(.gray) {
  color: #909399;
}

:deep(.el-table__row.gray-row > td) {
  background-color: #f5f7fa;
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
