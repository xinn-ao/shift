import request from '@/utils/request'

export interface StaffVo {
  staffId: string | undefined
  staffCode: string | undefined
  staffName: string | undefined
  password: string | undefined
  role: string
  businessType: string | null
  storeCd: string | null
}

export interface StaffQueryVo {
  staffId: string
  password: string
}
// 后端统一返回 ViewResult
export interface ViewResult<T> {
  code: string | number
  data: T
  msg: string
}

/**
 * 社員情報の取得
 * @param params 検索条件
 */
export function getStaffInfo(params: StaffQueryVo): Promise<ViewResult<StaffVo>> {
  return request({
    url: '/master/staff/login',
    method: 'post',
    data: params || {},
  })
}
