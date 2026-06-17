<template>
    <div class="container">
        <!-- 画面タイトル -->
        <div class="page-title">店舗</div>

        <!-- 検索・ボタン同一カード内：1行検索、2行ボタン右寄せ -->
        <el-card shadow="hover" class="search-card">
            <!-- 1行目：左右分離レイアウト -->
            <div class="search-line">
                <!-- 左側：店番入力 + 検索ボタン -->
                <el-form inline label-width="55px">
                    <el-form-item label="店番">
                        <el-input v-model="search.shopCode" placeholder="店番を入力" clearable style="width:180px" />
                    </el-form-item>
                    <el-form-item>
                        <el-button type="primary" @click="handleSearch" :disabled="!search.shopCode">検索</el-button>
                    </el-form-item>
                </el-form>
            </div>

            <!-- 2行目：変更・保存 右寄せ -->
            <div class="btn-group">
                <el-button type="primary" :disabled="!tableData.length || editFlag" @click="handleEdit">変更</el-button>
                <el-button type="success" :disabled="!editFlag" @click="handleSave">保存</el-button>
                <el-button type="success" @click="handleImportOrg">組織インポート</el-button>
            </div>
        </el-card>

        <!-- 一覧テーブル -->
        <el-table :data="tableData" border style="width:100%;margin-top:10px" :loading="loading">
            <el-table-column label="ブロック" prop="blockName" align="center" />
            <el-table-column label="グループ" prop="groupName" align="center" />
            <el-table-column label="店舗" prop="shopName" align="center" />
            <el-table-column label="閉店日" align="center">
                <template #default="{ row }">
                    <span v-if="!editFlag">{{ row.closeDate || '-' }}</span>
                    <el-date-picker v-else v-model="row.closeDate" type="date" size="small" format="YYYY/MM/DD"
                        value-format="YYYY/MM/DD" placeholder="閉店日選択" />
                </template>
            </el-table-column>
        </el-table>

        <el-empty v-if="!tableData.length && !loading" description="データが存在しません" />
    </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'

interface ShopRow {
    id: number
    blockName: string
    groupName: string
    shopName: string
    closeDate: string | null
}

// 検索条件
const search = reactive({
    shopCode: ''
})
const loading = ref(false)
// 編集フラグ：true＝閉店日全列編集可能
const editFlag = ref(false)
// 編集前全データ退避
let originAllData: ShopRow[] = []

// テーブルデータ
const tableData = ref<ShopRow[]>([])

// 検索処理
const handleSearch = async () => {
    editFlag.value = false
    loading.value = true
    try {
        // 仮データ
        tableData.value = [
            { id: 1, blockName: '関東', groupName: '青山G', shopName: '青山本店', closeDate: '2025/12/31' },
            { id: 2, blockName: '関東', groupName: 'SSQ', shopName: '新宿SSQ', closeDate: null },
            { id: 3, blockName: '関西', groupName: '大阪G', shopName: '梅田店', closeDate: '2026/03/20' }
        ]
        originAllData = JSON.parse(JSON.stringify(tableData.value))
    } catch {
        ElMessage.error('検索失敗')
    } finally {
        loading.value = false
    }
}

// 組織インポート処理
const handleImportOrg = () => {
    ElMessage.info('組織インポート機能を開く')
}

// 変更：全閉店日編集ON
const handleEdit = () => {
    originAllData = JSON.parse(JSON.stringify(tableData.value))
    editFlag.value = true
}

// 保存：一括保存、編集OFF
const handleSave = async () => {
    loading.value = true
    try {
        // APIへtableData.value一括送信
        ElMessage.success('保存完了')
        editFlag.value = false
        originAllData = JSON.parse(JSON.stringify(tableData.value))
    } catch {
        ElMessage.error('保存失敗、データを戻します')
        tableData.value = JSON.parse(JSON.stringify(originAllData))
    } finally {
        loading.value = false
    }
}
</script>

<style scoped>
.container {
    padding: 16px;
    background-color: #f5f7fa;
    min-height: 80vh;
}
</style>