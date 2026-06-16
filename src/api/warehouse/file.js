import request from '@/utils/request';

// 文件上传 API
export function useFileApi() {
	return {
		// 上传文件
		upload: (file) => {
			const formData = new FormData();
			formData.append('file', file);
			return request({
				url: '/warehouse/file/upload',
				method: 'post',
				data: formData
			});
		}
	};
}
