<template>
    <div class="layout-container">
        <aside class="layout-sidebar print-hide">
            <div class="sidebar-title">
                {{ userStore.username }}
                <el-button size="small" type="text" class="logout-btn" @click="handleLogout">
                    ログアウト
                </el-button>
            </div>
            <SideMenu />
        </aside>

        <main class="layout-main">
            <div class="main-wrap">
                <router-view />
            </div>
            <!-- 下部copyright -->
            <div class="copyright">©{{ currentYear }} Copyright</div>
        </main>
    </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import SideMenu from './SideMenu.vue'

const router = useRouter()
const userStore = useUserStore()
// 取得現在年
const currentYear = new Date().getFullYear()

// 退出登录
const handleLogout = () => {
    userStore.logout()
    router.push('/login')
}
</script>

<style scoped lang="scss">
.layout-container {
    display: flex;
    height: 98vh;
    overflow: hidden;
}

.layout-sidebar {
    width: 240px;
    background: #001529;
    color: #fff;
    overflow-y: auto;

    .sidebar-title {
        height: 60px;
        line-height: 60px;
        padding: 0 10px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 16px;
        border-bottom: 1px solid #333;
    }

    .logout-btn {
        color: #ccc;
    }

    .logout-btn:hover {
        color: #fff;
    }
}

.layout-main {
    flex: 1;
    background: #f5f7fa;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding: 20px 20px 0;

    .main-wrap {
        flex: 1;
        overflow-y: auto;
    }

    .copyright {
        height: 42px;
        line-height: 42px;
        text-align: center;
        font-size: 13px;
        color: #666;
    }
}
</style>