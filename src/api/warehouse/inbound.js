import request from '@/utils/request';

// 入库管理 API
export function useInboundApi() {
	return {
		// 入库记录列表（分页）
		list: (params) => {
			return request({
				url: '/warehouse/inbound/list',
				method: 'get',
				params
			});
		},
		// 入库单详情
		detail: (orderId) => {
			return request({
				url: `/warehouse/inbound/detail/${orderId}`,
				method: 'get'
			});
		},
		// 入库明细列表
		items: (orderId) => {
			return request({
				url: `/warehouse/inbound/items/${orderId}`,
				method: 'get'
			});
		},
		// 批量货物入库
		batch: (data) => {
			return request({
				url: '/warehouse/inbound/batch',
				method: 'post',
				data
			});
		},
		// 取消入库批次
		cancel: (batchNo) => {
			return request({
				url: `/warehouse/inbound/cancel/${batchNo}`,
				method: 'post'
			});
		}
	};
}
