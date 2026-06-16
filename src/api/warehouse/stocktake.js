import request from '@/utils/request';

// 盘点管理 API
export function useStocktakeApi() {
	return {
		// 盘点记录列表（分页）
		list: (params) => {
			return request({
				url: '/warehouse/stocktake/list',
				method: 'get',
				params
			});
		},
		// 货物库存盘点调整
		adjustGoods: (data) => {
			return request({
				url: '/warehouse/stocktake/adjustGoods',
				method: 'post',
				data
			});
		},
		// 盘点回滚
		rollback: (recordId) => {
			return request({
				url: `/warehouse/stocktake/rollback/${recordId}`,
				method: 'post'
			});
		}
	};
}
