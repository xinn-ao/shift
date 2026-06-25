<template>
  <div class="login-container">
    <div class="login-box">
      <h2 class="login-title">ログイン</h2>
      <div class="manual-link-box" style="text-align: right; margin-bottom: 12px">
        <el-link type="primary" href="/file/操作マニュアル.pdf" download>マニュアルをダウンロード</el-link>
      </div>
      <el-form ref="loginFormRef" :model="loginForm" label-width="90px" class="login-form">
        <el-form-item label="アカウント" prop="employeeCode">
          <el-input v-model="loginForm.staffId" placeholder="アカウントを入力" clearable></el-input>
        </el-form-item>

        <el-form-item label="パスワード" prop="password">
          <el-input v-model="loginForm.password" type="password" placeholder="パスワードを入力" show-password></el-input>
        </el-form-item>

        <el-form-item label-width="0">
          <div style="width: 100%; display: flex; justify-content: center">
            <el-button type="primary" class="login-btn" :loading="loading" :disabled="!loginForm.staffId || !loginForm.password" @click="handleLogin">
              ログイン
            </el-button>
          </div>
        </el-form-item>
        <el-form-item label-width="0">
          <div style="color: red; font-size: 13px; display: flex; justify-content: center">
            ※：パスワードを忘れた場合、店長に連絡して初期化してください。
          </div>
        </el-form-item>
      </el-form>
    </div>
    <!-- 下部copyright -->
    <div class="copyright">©{{ year }} Copyright</div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { loginApi } from '@/api/user'
import { type StaffQueryVo, type StaffVo } from '@/api/staff'

const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)
// 現在年取得
const year = new Date().getFullYear()

// 登录表单
const loginForm = reactive<StaffQueryVo>({
  staffId: '',
  password: '',
})
// 模拟账号权限映射（对接后端时这里换成接口请求）
const userMap: Record<string, { role: string; username: string }> = {
  u_001: { role: 'IT_ADMIN', username: 'IT管理員' },
  user: { role: 'NORMAL_USER', username: '店員' },
  subshop: { role: 'SUB_SHOP_USER', username: '副店長' },
  shop: { role: 'SHOP_USER', username: '店長' },
  group: { role: 'GROUP_USER', username: 'グループ長' },
  block: { role: 'BLOCK_USER', username: 'ブロック長' },
  jinji: { role: 'JINJI_USER', username: '人事部' },
}

const staffInfo = ref<StaffVo | null>(null)

const roleAndAccess = {
  r_01: 'NORMAL_USER',
  r_02: 'SUB_SHOP_USER',
  r_03: 'SHOP_USER',
  r_04: 'GROUP_USER',
  r_05: 'BLOCK_USER',
  r_06: 'JINJI_USER',
  r_07: 'SYSTEM_USER',
  r_08: 'KANSA_USER',
}
// 登录逻辑
const handleLogin = async () => {
  if (!loginForm.staffId || !loginForm.password) {
    ElMessage.warning('アカウントとパスワードを入力してください')
    return
  }
  loading.value = true
  // try {
  //   const res = await loginApi(loginForm)
  //   // 后端成功code=200
  //   if (res.code === 200) {
  //     ElMessage.success('ログイン成功')
  //     staffInfo.value = {
  //       staffId: res.data?.staffId,
  //       staffCode: res.data?.staffCode,
  //       staffName: res.data?.staffName,
  //       password: res.data?.password,
  //       role: res.data?.roleId ? roleAndAccess[res.data?.roleId] : 'NORMAL_USER',
  //       businessType: res.data?.businessType,
  //     }
  //     userStore.login(staffInfo.value)
  //     if (
  //       [
  //         'NORMAL_USER',
  //         'GROUP_USER',
  //         'BLOCK_USER',
  //         'JINJI_USER',
  //         'SYSTEM_USER',
  //         'KANSA_USER',
  //       ].includes(staffInfo.value.role)
  //     ) {
  //       router.push('/shift/shiftView')
  //     } else {
  //       router.push('/shift/shiftSet')
  //     }
  //   } else {
  //     // isInit=1 初期パスワード → 跳转到改密码页面
  //     ElMessage.error(res.message)
  //     router.push('/login')
  //   }
  // } catch (err: any) {
  //   // パスワード違い / アカウント無効(isEnable=0)/配属期限切れ(assignmentEndDate過ぎ)
  //   alert(err.msg || 'ログイン失敗')
  // }
  // const userResult = await getStaffInfo(loginForm);
  // if (userResult.data && userResult.data) {
  //     staffInfo.value = {
  //         staffCode: userResult.data.staffCode,
  //         staffName: userResult.data?.staffName,
  //         password: userResult.data?.password,
  //         id: userResult.data?.id,
  //         role: 'IT_ADMIN'
  //     };
  // }
  if (loginForm.staffId === 'user') {
    staffInfo.value = {
      staffId: loginForm.staffId,
      staffName: '社員',
      password: loginForm.password,
      staffCode: '1',
      role: 'NORMAL_USER',
      businessType: '',
      storeCd: '11',
      menus: ['/mobile'],
      subMenus: ['menu', 'leave', 'shift', 'pwd'],
    };
  } else if (loginForm.staffId === 'shop') {
    staffInfo.value = {
      staffId: loginForm.staffId,
      staffName: '店長',
      password: loginForm.password,
      staffCode: '2',
      role: 'SHOP_USER',
      businessType: '',
      storeCd: '11',
      menus: ['/shift', '/system', '/master'],
      subMenus: ['/shift/shiftSet', '/shift/shiftTypes', '/shift/requestLeave', '/system/passwordEdit', '/system/passwordReset', '/master/staff'],
    };
  } else if (loginForm.staffId === 'shopssq') {
    staffInfo.value = {
      staffId: loginForm.staffId,
      staffName: '店長',
      password: loginForm.password,
      staffCode: '2',
      role: 'SHOP_USER',
      businessType: '03',
      storeCd: '12',
      menus: ['/shift', '/system', '/master'],
      subMenus: ['/shift/shiftSet', '/shift/shiftTypes', '/shift/requestLeave', '/system/passwordEdit', '/system/passwordReset', '/master/staff'],
    };
  } else if (loginForm.staffId === 'subshop') {
    staffInfo.value = {
      staffId: loginForm.staffId,
      staffName: '副店長',
      password: loginForm.password,
      staffCode: '3',
      role: 'SUB_SHOP_USER',
      businessType: '',
      storeCd: '12',
      menus: ['/shift', '/system', '/master'],
      subMenus: ['/shift/shiftSet', '/shift/shiftTypes', '/shift/requestLeave', '/system/passwordEdit', '/master/staff'],
    };
  } else if (loginForm.staffId === 'group') {
    staffInfo.value = {
      staffId: loginForm.staffId,
      staffName: 'グループ長',
      password: loginForm.password,
      staffCode: '4',
      role: 'GROUP_USER',
      businessType: '',
      storeCd: '11',
      menus: ['/shift', '/system', '/master'],
      subMenus: ['/shift/shiftSet', '/shift/shiftView', '/system/passwordEdit', '/system/passwordReset', '/master/staff'],
    };
  } else if (loginForm.staffId === 'block') {
    staffInfo.value = {
      staffId: loginForm.staffId,
      staffName: 'ブロック長',
      password: loginForm.password,
      staffCode: '5',
      role: 'BLOCK_USER',
      businessType: '',
      storeCd: '11',
      menus: ['/shift', '/system'],
      subMenus: ['/shift/shiftView', '/system/passwordEdit'],
    };
  } else if (loginForm.staffId === 'system') {
    staffInfo.value = {
      staffId: loginForm.staffId,
      staffName: 'システム管理者',
      password: loginForm.password,
      staffCode: '6',
      role: 'SYSTEM_USER',
      businessType: '',
      storeCd: '11',
      menus: ['/shift', '/system', '/master'],
      subMenus: ['/shift/shiftView', '/system/passwordEdit', '/system/passwordReset', '/system/holidaySet', '/master/shiftType', '/master/staff', '/master/shop'],
    };
  } else if (loginForm.staffId === 'jinji') {
    staffInfo.value = {
      staffId: loginForm.staffId,
      staffName: '人事部',
      password: loginForm.password,
      staffCode: '7',
      role: 'JINJI_USER',
      businessType: '',
      storeCd: '11',
      menus: ['/shift', '/system', '/master'],
      subMenus: ['/shift/shiftView', '/system/passwordEdit', '/system/passwordReset', '/system/holidaySet', '/master/shiftType', '/master/staff', '/master/shop'],
    };
  } else if (loginForm.staffId === 'kansa') {
    staffInfo.value = {
      staffId: loginForm.staffId,
      staffName: '内部監査部',
      password: loginForm.password,
      staffCode: '8',
      role: 'KANSA_USER',
      businessType: '',
      storeCd: '11',
      menus: ['/shift', '/system'],
      subMenus: ['/shift/shiftView', '/system/passwordEdit'],
    };
  } else {
    staffInfo.value = {
      staffId: loginForm.staffId,
      staffName: '社員',
      password: loginForm.password,
      staffCode: '1',
      role: 'NORMAL_USER',
      businessType: '',
      storeCd: '11',
      menus: ['/mobile'],
      subMenus: ['menu', 'leave', 'shift', 'pwd'],
    };
  }

  ElMessage.success('ログイン成功')
  userStore.login(staffInfo.value);
  if (['NORMAL_USER', 'GROUP_USER', 'BLOCK_USER', 'JINJI_USER', 'SYSTEM_USER', 'KANSA_USER'].includes(staffInfo.value.role)) {
    router.push('/shift/shiftView')
  } else {
    router.push('/shift/shiftSet')
  }
  // 跳转到首页
  loading.value = false
}
</script>

<style scoped lang="scss">
.login-container {
  min-height: 95vh;
  background-color: #f0f2f5;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  overflow-y: hidden;
}

.login-box {
  width: 500px;
  padding: 40px 30px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.login-title {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
}

.login-form {
  .login-btn {
    width: 40%;
    height: 40px;
    font-size: 16px;
  }
}

.copyright {
  position: fixed;
  bottom: 12px;
  font-size: 13px;
  color: #666;
}
</style>
