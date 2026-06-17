<!-- <template>
    <div>パスワード初期化 画面</div>
</template> -->
<template>
  <div class="reset-container" style="padding: 20px">
    <!-- 画面タイトル -->
    <div class="page-title">パスワード初期化</div>
    <!-- 検索・ボタン同一el-card、1行検索、2行ボタン右寄せ -->
    <el-card shadow="hover" class="search-card" v-if="['JINJI_USER', 'SYSTEM_USER'].includes(userStore.role)">
      <!-- 上段：検索エリア -->
      <el-form inline label-width="90px">
        <el-form-item label="社員番号：">
          <el-input v-model="inputNo" placeholder="社員番号を入力"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch" :disabled="!inputNo">検索</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 员工表格 -->
    <el-table :data="tableData" border style="width:100%;margin-top:10px">
      <el-table-column label="社員番号" prop="staffNo" />
      <el-table-column label="社員名" prop="staffName" />
      <el-table-column label="店舗" prop="shopName" />
      <el-table-column label="操作">
        <template #default="scope">
          <el-button type="primary" @click="openConfirm(scope.row)">初期化</el-button>
        </template>
      </el-table-column>
      <el-table-column label="初期化" prop="resetStatus" />
    </el-table>

    <!-- 确认弹窗（点击初期化按钮弹出） -->
    <el-dialog v-model="dialogVisible" width="520px" :close-on-click-modal="false">
      <div style="font-size: 18px; line-height: 2.2; margin: 0 20px 0 20px">
        <p>社員番号：{{ currStaff.staffNo }}</p>
        <p>社員名：{{ currStaff.staffName }}</p>
        <p>上記の社員のパスワードが社員番号にもどってもよいですか？</p>
      </div>
      <!-- 弹窗底部按钮 -->
      <template #footer>
        <div class="dialog-footer">
          <el-button color="#67c23a" @click="confirmReset">はい</el-button>
          <el-button color="#f56c6c" @click="dialogVisible = false">いいえ</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
const userStore = useUserStore()
// import { getStaffList, resetPwdByStaffNo } from '@/api/user'

// 输入框绑定（实时变，但不立刻检索）
const inputNo = ref('')
// 真正用来检索的关键词（只有点搜索才更新）
const searchNo = ref('')

// 表格数据源
// const staffList = ref([])
// 弹窗开关
const dialogVisible = ref(false)
// 当前选中员工信息
const currStaff = ref({
  staffNo: '',
  staffName: '',
})

// 登录用户信息
// 模拟登录信息
const loginUser = ref({
  staffNo: '1001',
  roleType: 'SHOP_USER',
  storeCd: '1560',
})
// 真实项目用法（替换上面即可）
// const userStore = useUserStore()
// const loginUser = computed(() => ({
//   staffNo: userStore.staffNo,
//   roleType: userStore.roleType
// }))

// 固定模拟数据（页面预览用）
// 对接接口时删除这段即可
// 定义员工TS类型
interface StaffItem {
  staffNo: string
  staffName: string
  shopName: string
  resetStatus: string
  shopCode: string
}
// ref显式约束类型，不再默认never
const staffList = ref<StaffItem[]>([])
// 固定初始数据
staffList.value = [
  { staffNo: '1001', staffName: '山田 太郎', shopName: '岡山総支店', shopCode: '1561', resetStatus: '未初期化' },
  { staffNo: '1002', staffName: '鈴木 花子', shopName: '岡山総支店', shopCode: '1561', resetStatus: '未初期化' },
  { staffNo: '1003', staffName: '田中 健一', shopName: '岡山総本店', shopCode: '1560', resetStatus: '未初期化' },
  { staffNo: '1004', staffName: '佐藤 美咲', shopName: '岡山総本店', shopCode: '1560', resetStatus: '未初期化' },
]

// 表格展示数据，约束和员工一致的类型，自动过滤：SHOP_USER 不显示自己
const tableData = ref<StaffItem[]>([])
// 初始赋值全量
// tableData.value = !['JINJI_USER', 'SYSTEM_USER'].includes(userStore.role) ? [...staffList.value] : []

// 页面加载获取员工列表
// onMounted(async () => {
//   const res = await getStaffList()
//   staffList.value = res
// })

const getFilteredList = (list: StaffItem[]) => {
  // 如果是 SHOP_USER 角色 → 过滤掉自己
  if (userStore.role === 'SHOP_USER') {
    return list.filter((item) => item.staffNo !== loginUser.value.staffNo && item.shopCode === loginUser.value.storeCd)
  }
  // 其他角色（ADMIN等）→ 全部显示
  return list
}

// 初始化表格
tableData.value = !['JINJI_USER', 'SYSTEM_USER'].includes(userStore.role) ? getFilteredList([...staffList.value]) : []

// 打开确认弹窗
const openConfirm = (row: any) => {
  currStaff.value = { ...row }
  dialogVisible.value = true
}

// 确认执行密码初期化
const confirmReset = async () => {
  try {
    // await resetPwdByStaffNo(currStaff.value.staffNo)
    ElMessage.success('パスワード初期化完了')
    dialogVisible.value = false
    // 刷新表格
    // const res = await getStaffList()
    // staffList.value = res

    //模拟状态
    const target = staffList.value.find((i) => i.staffNo === currStaff.value.staffNo)
    if (target) target.resetStatus = '初期化'
  } catch {
    ElMessage.error('初期化失敗')
  }
}

// 检索点击事件
const handleSearch = () => {
  // 把输入框内容赋给真正的检索关键词
  searchNo.value = inputNo.value.trim()

  if (!searchNo.value) {
    // 空検索 → 显示全部
    tableData.value = [...staffList.value]
  } else {
    // 按社員番号过滤
    tableData.value = staffList.value.filter((item) => item.staffNo.includes(searchNo.value))
  }

  // 【预留后端接口】
  // staffList.value = await getStaffList({ staffNo: searchNo.value })
  // tableData.value = [...staffList.value]
}
</script>

<style scoped>
.reset-container {
  min-height: 80vh;
}

.dialog-footer {
  display: flex;
  gap: 30px;
  justify-content: center;
  margin-bottom: 10px;
}

:deep(.dialog-footer .el-button) {
  width: 35%;
  color: #fff;
}

:deep(.el-dialog__footer) {
  padding-top: 0 !important;
}
</style>
