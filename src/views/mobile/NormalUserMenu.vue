<template>
    <div class="mobile-menu-page">
        <h2 class="title">メニュー</h2>
        <div class="menu-list">
            <el-card class="menu-item" shadow="hover" @click="$router.push({ name: 'MobileRequestLeave' })">
                <div class="text">希望休設定</div>
            </el-card>
            <el-card class="menu-item" shadow="hover" @click="$router.push({ name: 'MobileShiftView' })">
                <div class="text">シフト参照</div>
            </el-card>
            <el-card class="menu-item" shadow="hover" @click="$router.push({ name: 'MobilePwdEdit' })">
                <div class="text">パスワード変更</div>
            </el-card>
            <!-- ログアウト 同样式、红色背景 -->
            <el-card class="menu-item logout-item" shadow="hover" @click="handleLogout">
                <div class="text">ログアウト</div>
            </el-card>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

// 退出登录
const handleLogout = () => {
    userStore.logout()
    router.push('/login')
}
</script>

<style scoped>
.mobile-menu-page {
    padding: 16px;
    background: #f5f7fa;
    min-height: 100vh;
    box-sizing: border-box;
}

.title {
    text-align: center;
    margin: 30px 0;
    font-size: 22px;
}

.menu-list {
    max-width: 480px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 16px;
    width: 100%;
}

.menu-item {
    padding: 32px 0;
    cursor: pointer;
}

.text {
    font-size: 18px;
    text-align: center;
}

/* 登出卡片红色背景+白色文字 */
.logout-item {
    background-color: #f53f3f !important;
}

.logout-item .text {
    color: #fff;
}
</style>