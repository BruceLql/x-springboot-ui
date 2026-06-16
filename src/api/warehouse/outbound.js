import request from '@/utils/request';

// 出库管理 API
export function useOutboundApi() {
	return {
		// 出库记录列表（分页）
		list: (params) => {
			return request({
				url: '/warehouse/outbound/list',
				method: 'get',
				params
			});
		},
		// 报损出库
		damage: (data) => {
			return request({
				url: '/warehouse/outbound/damage',
				method: 'post',
				data
			});
		}
	};
}
