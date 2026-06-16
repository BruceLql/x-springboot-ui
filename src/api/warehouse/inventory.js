import request from '@/utils/request';

// 库存管理 API
export function useInventoryApi() {
	return {
		// 货物库存列表（分页）
		goodsList: (params) => {
			return request({
				url: '/warehouse/inventory/goods/list',
				method: 'get',
				params
			});
		},
		// SKU库存列表（分页）
		skuList: (params) => {
			return request({
				url: '/warehouse/inventory/sku/list',
				method: 'get',
				params
			});
		}
	};
}
