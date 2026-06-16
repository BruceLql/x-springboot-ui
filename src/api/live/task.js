import request from '@/utils/request';

// 直播任务管理 API
export function useLiveTaskApi() {
	return {
		// 任务列表（分页）
		list: (params) => {
			return request({
				url: '/live/task/list',
				method: 'get',
				params
			});
		},
		// 任务详情（含统计）
		info: (taskId) => {
			return request({
				url: `/live/task/info/${taskId}`,
				method: 'get'
			});
		},
		// 创建任务
		create: (data) => {
			return request({
				url: '/live/task/create',
				method: 'post',
				data
			});
		},
		// 更新任务
		update: (data) => {
			return request({
				url: '/live/task/update',
				method: 'put',
				data
			});
		},
		// 启动任务
		start: (taskId) => {
			return request({
				url: `/live/task/start/${taskId}`,
				method: 'post'
			});
		},
		// 停止任务
		stop: (taskId) => {
			return request({
				url: `/live/task/stop/${taskId}`,
				method: 'post'
			});
		},
		// 删除任务
		delete: (taskId) => {
			return request({
				url: `/live/task/delete/${taskId}`,
				method: 'delete'
			});
		},
		// 清空任务数据
		clearData: (taskId) => {
			return request({
				url: `/live/task/data/clear/${taskId}`,
				method: 'delete'
			});
		},
		// 任务统计
		statistics: (taskId) => {
			return request({
				url: `/live/task/statistics/${taskId}`,
				method: 'get'
			});
		},
		// 聊天数据
		chatList: (params) => {
			return request({
				url: '/live/task/data/chat',
				method: 'get',
				params
			});
		},
		// 礼物数据
		giftList: (params) => {
			return request({
				url: '/live/task/data/gift',
				method: 'get',
				params
			});
		},
		// 点赞数据
		likeList: (params) => {
			return request({
				url: '/live/task/data/like',
				method: 'get',
				params
			});
		},
		// 关注数据
		followList: (params) => {
			return request({
				url: '/live/task/data/follow',
				method: 'get',
				params
			});
		},
		// 用户进入数据
		userEnterList: (params) => {
			return request({
				url: '/live/task/data/userEnter',
				method: 'get',
				params
			});
		},
		// 电商数据
		ecomList: (params) => {
			return request({
				url: '/live/task/data/ecom',
				method: 'get',
				params
			});
		},
		// 电商榜单实时数据
		rankData: (taskId) => {
			return request({
				url: `/live/task/rankData/${taskId}`,
				method: 'get'
			});
		},
		// 直播间实时数据（在线人数+排行榜）
		liveData: (taskId) => {
			return request({
				url: `/live/task/liveData/${taskId}`,
				method: 'get'
			});
		}
	};
}
