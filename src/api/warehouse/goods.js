import request from '@/utils/request';

// 货物管理 API
export function useGoodsApi() {
	return {
		// 货物列表（分页）
		list: (params) => {
			return request({
				url: '/warehouse/goods/list',
				method: 'get',
				params
			});
		},
		// 货物详情
		info: (goodsId) => {
			return request({
				url: `/warehouse/goods/info/${goodsId}`,
				method: 'get'
			});
		},
		// 新增货物
		save: (data) => {
			return request({
				url: '/warehouse/goods/save',
				method: 'post',
				data
			});
		},
		// 修改货物
		update: (data) => {
			return request({
				url: '/warehouse/goods/update',
				method: 'put',
				data
			});
		},
		// 删除货物
		delete: (goodsId) => {
			return request({
				url: `/warehouse/goods/delete/${goodsId}`,
				method: 'delete'
			});
		},
		// 货物下拉选项
		options: () => {
			return request({
				url: '/warehouse/goods/options',
				method: 'get'
			});
		}
	};
}
