import request from '@/utils/request'

// 登录入参类型
export interface LoginForm {
  staffId: string
  password: string
}

// 后端统一返回格式
export interface ResModel<T = any> {
  code: number
  message: string
  data?: T
}

/** 登录接口 */
export function loginApi(data: LoginForm): Promise<ResModel> {
  // 转 form-urlencoded
  const params = new URLSearchParams()
  params.append('staffId', data.staffId)
  params.append('password', data.password)

  return request.post('/api/login', params, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  })
}

/** 登出接口 */
export function logoutApi(): Promise<ResModel> {
  return request.post('/api/logout')
}