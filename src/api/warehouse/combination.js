import request from '@/utils/request';

// 组商品（SKU搭配）管理 API
export function useCombinationApi() {
	return {
		// SKU列表（分页）
		list: (params) => {
			return request({
				url: '/warehouse/combination/list',
				method: 'get',
				params
			});
		},
		// SKU详情
		info: (skuId) => {
			return request({
				url: `/warehouse/combination/info/${skuId}`,
				method: 'get'
			});
		},
		// 创建SKU搭配
		create: (data) => {
			return request({
				url: '/warehouse/combination/create',
				method: 'post',
				data
			});
		},
		// 确定布款
		arrange: (skuId) => {
			return request({
				url: `/warehouse/combination/arrange/${skuId}`,
				method: 'post'
			});
		},
		// 取消布款
		cancel: (skuId) => {
			return request({
				url: `/warehouse/combination/cancel/${skuId}`,
				method: 'post'
			});
		},
		// 布款回滚
		rollback: (skuId) => {
			return request({
				url: `/warehouse/combination/rollback/${skuId}`,
				method: 'post'
			});
		},
		// 删除SKU
		delete: (skuId) => {
			return request({
				url: `/warehouse/combination/delete/${skuId}`,
				method: 'delete'
			});
		},
		// 查询可搭配货物
		availableGoods: () => {
			return request({
				url: '/warehouse/combination/availableGoods',
				method: 'get'
			});
		}
	};
}
