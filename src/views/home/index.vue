<template>
	<div class="home">
		<!-- 统计概览卡片 -->
		<el-row :gutter="15" class="stats-row">
			<el-col :xs="12" :sm="12" :md="6" v-for="(v, k) in statsList" :key="k">
				<div class="stat-card" :style="{ borderTopColor: v.color }">
					<div class="stat-card-icon" :style="{ background: v.iconBg }">
						<i :class="v.icon" :style="{ color: v.color }"></i>
					</div>
					<div class="stat-card-body">
						<div class="stat-card-value" :id="`statNum${k}`"></div>
						<div class="stat-card-label">{{ v.label }}</div>
					</div>
				</div>
			</el-col>
		</el-row>

		<!-- 用户 + 通知 -->
		<el-row :gutter="15">
			<el-col :md="24" :lg="16" :xl="16" class="mb15">
				<el-card shadow="never">
					<div slot="header"><span>欢迎回来</span></div>
					<div class="user-item">
						<div class="user-item-left">
							<img :src="getUserInfos.photo" />
						</div>
						<div class="user-item-right overflow">
							<el-row>
								<el-col :span="24" class="right-title mb15 one-text-overflow">
									{{ currentTime }}，{{ getUserInfos.userName }}，{{ dailyMessage }}
								</el-col>
								<el-col :span="24">
									<el-col :xs="12" :sm="12" :md="8" class="right-l-v">
										<div class="right-label">昵称：</div>
										<div class="right-value">{{userInfo.name}}</div>
									</el-col>
									<el-col :xs="12" :sm="12" :md="16" class="right-l-v">
										<div class="right-label">身份：</div>
										<div class="right-value">{{ userInfo.userName === 'admin' ? '超级管理' : '普通用户' }}</div>
									</el-col>
								</el-col>
							</el-row>
						</div>
					</div>
				</el-card>
			</el-col>
			<el-col :md="24" :lg="8" :xl="8" class="mb15">
				<el-card shadow="never">
					<div slot="header"><span>{{ $t('message.card.title2') }}</span></div>
					<div class="info">
						<Scroll :data="newsInfoList" class="info-scroll" :class-option="optionSingleHeight">
							<ul class="info-ul">
								<li v-for="(v, k) in newsInfoList" :key="k" class="info-item" @click="onNewsInfoListClick(v)">
									<div class="info-item-left" v-text="v.title"></div>
									<div class="info-item-right" v-text="v.date"></div>
								</li>
							</ul>
						</Scroll>
					</div>
				</el-card>
			</el-col>
		</el-row>

		<!-- ECharts 图表 -->
		<el-row :gutter="15" class="mt15">
			<el-col :md="24" :lg="8" :xl="8" class="mb15">
				<el-card shadow="never">
					<div slot="header"><span>{{ $t('message.card.title6') }}</span></div>
					<div class="charts">
						<div class="charts-right"><div ref="homeStockRef" class="h100"></div></div>
					</div>
				</el-card>
			</el-col>
			<el-col :md="24" :lg="16" :xl="16" class="mb15">
				<el-card shadow="never">
					<div slot="header"><span>{{ $t('message.card.title7') }}</span></div>
					<div class="charts">
						<div class="charts-left mr7"><div ref="homeLaboratoryRef" class="h100"></div></div>
					</div>
				</el-card>
			</el-col>
		</el-row>

		<!-- 超时监控 -->
		<el-row :gutter="15">
			<el-col :md="24" :lg="16" :xl="16" class="home-lg">
				<el-card shadow="never">
					<div slot="header"><span>{{ $t('message.card.title8') }}</span></div>
					<div class="charts">
						<div class="charts-left mr7"><div ref="homeOvertimeRef" class="h100"></div></div>
					</div>
				</el-card>
			</el-col>
			<el-col :md="24" :lg="8" :xl="8">
				<el-card shadow="never">
					<div slot="header"><span>{{ $t('message.card.title9') }}</span></div>
					<div class="home-charts">
						<div class="home-charts-item" v-for="(v, k) in chartsRightList" :key="k">
							<div class="home-charts-item-left">
								<div class="home-charts-item-title">{{ v.title }}</div>
								<div class="home-charts-item-num" :style="{ color: v.color }" :id="`titleNum${k + 1}`"></div>
							</div>
							<div class="home-charts-item-right">
								<i :class="v.icon" :style="{ color: v.color }"></i>
							</div>
						</div>
					</div>
				</el-card>
			</el-col>
		</el-row>
	</div>
</template>

<script>
import * as echarts from 'echarts';
import Scroll from 'vue-seamless-scroll';
import { CountUp } from 'countup.js';
import { Session } from '@/utils/storage';
import { formatAxis } from '@/utils/formatTime';
import { chartsRightList, newsInfoList, dailyMessage } from './mock';
export default {
	name: 'home',
	components: { Scroll },
	data() {
		return {
			statsList: [
				{ label: '仓库货物总数', icon: 'el-icon-box', color: '#00d4ff', iconBg: 'rgba(0,212,255,.12)' },
				{ label: '入库批次', icon: 'el-icon-sell', color: '#00d68f', iconBg: 'rgba(0,214,143,.12)' },
				{ label: '直播监控任务', icon: 'el-icon-video-camera', color: '#ffaa00', iconBg: 'rgba(255,170,0,.12)' },
				{ label: 'SKU 搭配', icon: 'el-icon-connection', color: '#a78bfa', iconBg: 'rgba(167,139,250,.12)' },
			],
			chartsRightList,
			newsInfoList,
			userInfo: {},
			dailyMessage: {},
			global: {
				homeChartOne: null,
				homeChartTwo: null,
				homeCharThree: null,
			},
		};
	},
	created() {
		this.initUserInfo();
		this.initDailyMessage();
	},
	computed: {
		currentTime() { return formatAxis(new Date()); },
		optionSingleHeight() { return { singleHeight: 28, limitMoveNum: 8, waitTime: 2000 }; },
		getUserInfos() { return this.$store.state.userInfos.userInfos; },
	},
	mounted() {
		this.initHomeStock();
		this.initHomeLaboratory();
		this.initHomeOvertime();
		this.$nextTick(() => this.initNumCountUp());
	},
	methods: {
		initNumCountUp() {
			const vals = [1286, 89, 12, 56];
			this.statsList.forEach((_, i) => {
				new CountUp(`statNum${i}`, vals[i], { duration: 2 }).start();
			});
			new CountUp('titleNum1', Math.random() * 100000, { duration: 2 }).start();
			new CountUp('titleNum2', Math.random() * 100000, { duration: 2 }).start();
			new CountUp('titleNum3', Math.random() * 100000, { duration: 2 }).start();
		},
		initHomeStock() {
			const chart = echarts.init(this.$refs.homeStockRef, 'dark');
			chart.setOption({
				grid: { top: 40, right: 10, bottom: 20, left: 40 },
				tooltip: { trigger: 'item' },
				legend: { left: 'center', textStyle: { color: '#a8b8c8' } },
				series: [{
					type: 'pie', radius: ['45%', '72%'],
					itemStyle: { borderRadius: 6, borderColor: '#0a0e27', borderWidth: 3 },
					label: { color: '#a8b8c8' },
					data: [
						{ value: 580, name: '可用库存', itemStyle: { color: '#00d4ff' } },
						{ value: 200, name: '锁定库存', itemStyle: { color: '#ffaa00' } },
						{ value: 150, name: '占用库存', itemStyle: { color: '#a78bfa' } },
					],
				}],
			});
			window.addEventListener('resize', () => chart.resize());
		},
		initHomeLaboratory() {
			const chart = echarts.init(this.$refs.homeLaboratoryRef, 'dark');
			chart.setOption({
				grid: { top: 40, right: 10, bottom: 20, left: 40 },
				tooltip: { trigger: 'axis' },
				legend: { data: ['入库量', '出库量'], right: 13, textStyle: { color: '#a8b8c8' } },
				xAxis: { data: ['1月','2月','3月','4月','5月','6月'], axisLine: { lineStyle: { color: '#1e3050' } }, axisLabel: { color: '#687080' } },
				yAxis: { type: 'value', name: '数量', axisLine: { lineStyle: { color: '#1e3050' } }, splitLine: { lineStyle: { color: 'rgba(30,48,80,.5)' } }, axisLabel: { color: '#687080' } },
				series: [
					{ name: '入库量', type: 'bar', data: [120,200,150,80,70,110], itemStyle: { color: 'rgba(0,212,255,.7)', borderRadius: [6,6,0,0] } },
					{ name: '出库量', type: 'line', data: [90,180,130,100,60,95], itemStyle: { color: '#00d68f' }, lineStyle: { color: '#00d68f', width: 2 }, symbol: 'circle', symbolSize: 6 },
				],
			});
			window.addEventListener('resize', () => chart.resize());
		},
		initHomeOvertime() {
			const chart = echarts.init(this.$refs.homeOvertimeRef, 'dark');
			chart.setOption({
				grid: { top: 40, right: 10, bottom: 20, left: 40 },
				tooltip: { trigger: 'axis' },
				legend: { data: ['订单量','超时','在线','预警'], right: 13, textStyle: { color: '#a8b8c8' } },
				xAxis: { data: ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'], axisLine: { lineStyle: { color: '#1e3050' } }, axisLabel: { color: '#687080' } },
				yAxis: { type: 'value', axisLine: { lineStyle: { color: '#1e3050' } }, splitLine: { lineStyle: { color: 'rgba(30,48,80,.5)' } }, axisLabel: { color: '#687080' } },
				series: [
					{ name: '订单量', type: 'bar', data: [5,20,36,10,10,20,11,13,10,9,17,19], itemStyle: { color: 'rgba(0,212,255,.6)' }, barGap: '10%' },
					{ name: '超时', type: 'bar', data: [15,12,26,15,11,16,31,13,5,16,13,15], itemStyle: { color: 'rgba(255,61,113,.6)' } },
					{ name: '在线', type: 'line', data: [15,20,16,20,30,8,16,19,12,18,19,14], itemStyle: { color: '#00d68f' }, lineStyle: { color: '#00d68f', width: 2 } },
					{ name: '预警', type: 'line', data: [10,10,13,12,15,18,19,10,12,15,11,17], itemStyle: { color: '#ffaa00' }, lineStyle: { color: '#ffaa00', width: 2, type: 'dashed' } },
				],
			});
			window.addEventListener('resize', () => chart.resize());
		},
		initDailyMessage() { this.dailyMessage = dailyMessage[Math.floor(Math.random() * dailyMessage.length)]; },
		initUserInfo() { if (!Session.get('userInfo')) return; this.userInfo = Session.get('userInfo'); },
		onNewsInfoListClick(v) { window.open(v.link); },
	},
};
</script>

<style scoped lang="scss">
@import './index.scss';
</style>
