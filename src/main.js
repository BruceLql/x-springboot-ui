import Vue from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';

import Particles from 'vue-particles';
import Element from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
import '@/theme/index.scss';
import { i18n } from '@/i18n/index.js';
import { globalComponentSize } from '@/utils/componentSize.js';

Vue.use(Particles);
Vue.use(Element, { i18n: (key, value) => i18n.t(key, value), size: globalComponentSize });

Vue.config.productionTip = false;
Vue.prototype.bus = new Vue();

// 全局翻译方法：智能判断是中文还是 i18n key
Vue.prototype.$mt = function(key) {
	if (!key) return '';
	// 如果包含中文，直接返回原值
	if (/[\u4e00-\u9fa5]/.test(key)) return key;
	// 否则尝试翻译
	try {
		const result = this.$t(key);
		// 如果翻译结果和 key 相同（说明没有找到翻译），返回原值
		return result === key ? key : result;
	} catch (e) {
		return key;
	}
};

new Vue({
	router,
	store,
	i18n,
	render: (h) => h(App),
}).$mount('#app');
