<template>
  <div class="password-edit-container">
    <el-card class="form-card">

      <el-form ref="pwdFormRef" :model="pwdForm" :rules="pwdRules" label-width="200px"
        :label-position="isMobile ? 'top' : 'left'" class="pwd-form">
        <el-form-item label="現在のパスワード" prop="oldPassword">
          <el-input v-model="pwdForm.oldPassword" type="password" placeholder="現在のパスワードを入力" show-password />
        </el-form-item>

        <el-form-item label="新しいパスワード" prop="newPassword">
          <el-input v-model="pwdForm.newPassword" type="password" placeholder="新しいパスワードを入力（6～20文字）" show-password />
        </el-form-item>

        <el-form-item label="新しいパスワード（確認）" prop="confirmPassword">
          <el-input v-model="pwdForm.confirmPassword" type="password" placeholder="新しいパスワードを再入力" show-password />
        </el-form-item>
      </el-form>

      <!-- 操作按钮组：PC横向 / 手机纵向 -->
      <div class="btn-group">
        <!-- 手机端返回按钮放到按钮组也可以，这里保留顶部左上角返回，按钮组只放保存・取消 -->
        <el-button icon="ArrowLeft" v-if="userStore.role === 'NORMAL_USER'" type="primary"
          @click="$router.push({ name: 'NormalUserMenu' })">戻る</el-button>
        <el-button color="#67c23a" @click="handleSave"
          :disabled="!pwdForm.oldPassword || !pwdForm.newPassword || !pwdForm.confirmPassword">
          保存
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElForm } from 'element-plus'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const pwdFormRef = ref<InstanceType<typeof ElForm>>()
const userStore = useUserStore()

// 响应式判断是否手机宽度（768px为移动端断点）
const isMobile = computed(() => window.innerWidth <= 768)

const isValid = ref(false)

// 表单数据
const pwdForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

// 校验规则（修正min=0错误，改为6位起）
const pwdRules = reactive({
  oldPassword: [{ required: true, message: '現在のパスワードを入力してください', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '新しいパスワードを入力してください', trigger: 'blur' },
    { min: 6, max: 20, message: 'パスワードは6～20文字で入力してください', trigger: 'blur' },
    {
      validator: (_rule: any, value: string, callback: any) => {
        if (value === pwdForm.oldPassword) {
          callback(new Error('新しいパスワードは現在のパスワードと異なるものを設定してください。'))
        } else {
          callback()
        }
      },
      trigger: 'blur',
    },
  ],
  confirmPassword: [
    { required: true, message: '確認用パスワードを入力してください', trigger: 'blur' },
    {
      validator: (_rule: any, value: string, callback: any) => {
        if (value !== pwdForm.newPassword) {
          callback(new Error('確認用のパスワードが正しくありません。もう一度入力してください。'))
        } else {
          callback()
        }
      },
      trigger: 'blur',
    },
  ],
})

// 保存処理
const handleSave = async () => {
  const valid = await pwdFormRef.value?.validate()
  if (!valid) {
    return false;
  }
  // 後續接口開放後使用
  // const params = { oldPassword: pwdForm.oldPassword, newPassword: pwdForm.newPassword }
  // const res = await request.post('/api/user/updatePassword', params)
  // if (res.code === 200) {
  try {
    ElMessage.success('パスワードの変更に成功しました')
    pwdFormRef.value?.resetFields()
    userStore.logout()
    router.push('/login')
    // } else {
    //   ElMessage.error(res.data.msg || 'パスワードの変更に失敗しました')
    // }
  } catch (error) {
    console.error('パスワード変更失敗', error)
    ElMessage.error('入力内容またはネットワークを確認してください')
  }
}
</script>

<style scoped lang="scss">
.password-edit-container {
  padding: 20px 12px;
  min-height: 100vh;
  box-sizing: border-box;
  background: #f5f7fa;
}

.form-card {
  max-width: 750px;
  margin: 0 auto;
  padding: 20px 16px;
}

.back-box {
  margin-bottom: 16px;
  text-align: left;
}

.pwd-form {
  margin: 10px 0 24px;
}

// PC端樣式
@media (min-width: 769px) {
  .pwd-form :deep(.el-form-item) {
    height: 48px;
  }

  .btn-group {
    display: flex;
    gap: 100px;
    justify-content: center;
  }

  .btn-group :deep(.el-button) {
    width: 140px;
    color: #fff;
  }
}

// 手機端樣式
@media (max-width: 768px) {
  .password-edit-container {
    padding: 12px 8px;
  }

  .form-card {
    width: 100%;
  }

  .pwd-form :deep(.el-form-item) {
    margin-bottom: 18px;
  }

  .pwd-form :deep(.el-form-item__label) {
    margin-bottom: 6px;
  }

  .btn-group {
    display: flex;
    flex-direction: column;
    gap: 14px;
    align-items: center;
  }

  .btn-group :deep(.el-button) {
    width: 100%;
    max-width: 260px;
    height: 44px;
    font-size: 16px;
  }
}
</style>