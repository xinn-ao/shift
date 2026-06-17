<template>
    <el-menu mode="vertical" :router="true" class="side-menu" text-color="#fff" active-text-color="#409eff"
        background-color="#001529" :default-active="activePath" :open-names="openKeys">
        <template v-for="menu in authMenus" :key="menu.path">
            <el-sub-menu :index="menu.path">
                <template #title>
                    <el-icon>
                        <component :is="menu.icon" />
                    </el-icon>
                    <span>{{ menu.label }}</span>
                </template>

                <el-menu-item v-for="child in menu.children" :key="child.path" :index="child.path">
                    {{ child.label }}
                </el-menu-item>
            </el-sub-menu>
        </template>
    </el-menu>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const userStore = useUserStore()
const authMenus = computed(() => userStore.authMenuList)

// 当前激活的菜单路径
const activePath = ref('')
// 展开的一级菜单 index 数组
const openKeys = ref<string[]>([])

// 初始化 + 路由变化时 更新选中、展开状态
const setMenuActive = () => {
    const currentPath = route.path
    activePath.value = currentPath
    openKeys.value = []
    // 找到当前子菜单对应的父菜单，加入展开列表
    for (const menu of authMenus.value) {
        const child = menu.children?.find(item => item.path === currentPath)
        if (child) {
            // 只保留当前父菜单展开，关闭其他
            openKeys.value = [menu.path]
            break
        }
    }
}

// 页面挂载执行一次（登录进入、刷新页面生效）
onMounted(() => {
    setMenuActive()
})

// 监听路由切换（点击菜单跳转也生效）
watch(
    () => route.path,
    () => {
        setMenuActive()
    },
    { immediate: true }
)

// 登录加载完菜单自动选中
watch(authMenus, (newVal) => {
    if (newVal.length > 0) {
        setMenuActive()
    }
}, { deep: true })
</script>

<style scoped lang="scss">
.side-menu {
    border-right: none;
}
</style>