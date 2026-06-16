import request from '@/utils/request';

// 供应商管理 API
export function useSupplierApi() {
	return {
		// 供应商列表（分页）
		list: (params) => {
			return request({
				url: '/warehouse/supplier/list',
				method: 'get',
				params
			});
		},
		// 供应商详情
		info: (supplierId) => {
			return request({
				url: `/warehouse/supplier/info/${supplierId}`,
				method: 'get'
			});
		},
		// 新增供应商
		save: (data) => {
			return request({
				url: '/warehouse/supplier/save',
				method: 'post',
				data
			});
		},
		// 修改供应商
		update: (data) => {
			return request({
				url: '/warehouse/supplier/update',
				method: 'put',
				data
			});
		},
		// 删除供应商
		delete: (supplierId) => {
			return request({
				url: `/warehouse/supplier/delete/${supplierId}`,
				method: 'delete'
			});
		},
		// 供应商下拉选项
		options: () => {
			return request({
				url: '/warehouse/supplier/options',
				method: 'get'
			});
		},
		// 查询供应商关联货物
		getGoods: (supplierId) => {
			return request({
				url: `/warehouse/supplier/goods/${supplierId}`,
				method: 'get'
			});
		},
		// 绑定货物（批量）
		bindGoods: (data) => {
			return request({
				url: '/warehouse/supplier/bindGoods',
				method: 'post',
				data
			});
		},
		// 解绑货物
		unbindGoods: (data) => {
			return request({
				url: '/warehouse/supplier/unbindGoods',
				method: 'post',
				data
			});
		}
	};
}
