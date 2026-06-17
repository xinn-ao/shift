import request from '@/utils/request'

// 门店查询条件 ShopQueryVo
export interface ShopQueryVo {
  shopCode?: string
  // 根据后端实际字段补充
}

// 门店实体 ShopVo
export interface ShopVo {
  id?: number
  blockId: number
  groupId: number
  shopName: string
  shopCode: string
  address?: string
  status?: number
  // 补充后端所有字段
}

// 后端统一返回 ViewResult
export interface ViewResult<T> {
  code: string | number
  data: T
  msg: string
}

/**
 * 门店列表查询
 * @param params 查询条件
 */
export function getShopList(params: ShopQueryVo): Promise<ViewResult<ShopVo[]>> {
    return request({
      url: '/master/shop/shopSearchList',
      method: 'post',
      data: params || {}
    })
}

/**
 * 门店保存（新增/编辑）
 * @param data 门店集合
 */
export function saveShop(data: ShopVo[]): Promise<ViewResult<string>> {
  return request.post('/master/shopSave', data)
}

/**
 * 门店删除
 * @param data 待删除门店集合
 */
export function deleteShop(data: ShopVo[]): Promise<ViewResult<string>> {
  return request.post('/master/shopDelete', data)
}