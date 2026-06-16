import request from '@/utils/request';

export function useShortLinkApi() {
	return {
		generate: (data) => {
			return request({
				url: '/shortlink/generate',
				method: 'post',
				data
			});
		},
		list: (params) => {
			return request({
				url: '/shortlink/list',
				method: 'get',
				params
			});
		},
		detail: (linkId) => {
			return request({
				url: `/shortlink/detail/${linkId}`,
				method: 'get'
			});
		},
		delete: (linkId) => {
			return request({
				url: '/shortlink/delete',
				method: 'post',
				data: { linkId }
			});
		},
		updateStatus: (data) => {
			return request({
				url: '/shortlink/updateStatus',
				method: 'post',
				data
			});
		},
		stats: (linkId) => {
			return request({
				url: `/shortlink/stats/${linkId}`,
				method: 'get'
			});
		},
		redirect: (shortCode) => {
			return request({
				url: `/shortlink/${shortCode}`,
				method: 'get'
			});
		}
	};
}
