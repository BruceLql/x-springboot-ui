import SockJS from 'sockjs-client';
import Stomp from 'stompjs';
import { Session } from '@/utils/storage';

class LiveWebSocketManager {
    constructor() {
        this.client = null;
        this.subscriptions = {};
        this.connected = false;
        this.reconnectTimer = null;
        this.pendingSubscriptions = [];
    }

    /**
     * 连接 WebSocket
     */
    connect() {
        if (this.connected) return;

        const token = Session.get('token');
        if (!token) {
            console.warn('[LiveWS] 无 token，无法连接');
            return;
        }

        const baseURL = process.env.VUE_APP_BASE_API || '';
        const wsUrl = baseURL + '/ws?token=' + encodeURIComponent(token);

        const socket = new SockJS(wsUrl);
        this.client = Stomp.over(socket);
        this.client.debug = null; // 关闭调试日志

        this.client.connect({ token: token },
            () => {
                this.connected = true;
                console.log('[LiveWS] 已连接');
                // 重订阅之前的所有订阅
                this.pendingSubscriptions.forEach(sub => {
                    this._doSubscribe(sub.taskId, sub.types, sub.callback);
                });
                this.pendingSubscriptions = [];
            },
            (error) => {
                console.error('[LiveWS] 连接失败:', error);
                this.connected = false;
            }
        );
    }

    /**
     * 订阅某个任务的数据更新
     * @param {string} taskId
     * @param {string[]} types - 如 ['statistics', 'chat', 'gift', 'liveData']
     * @param {function} callback - 接收消息: callback(type, data)
     */
    subscribe(taskId, types, callback) {
        if (!taskId || !types || !callback) return;

        if (!this.connected || !this.client) {
            // 缓存待订阅
            this.pendingSubscriptions.push({ taskId, types, callback });
            this.connect();
            return;
        }

        this._doSubscribe(taskId, types, callback);
    }

    _doSubscribe(taskId, types, callback) {
        const key = taskId;
        if (!this.subscriptions[key]) {
            this.subscriptions[key] = [];
        }

        types.forEach(type => {
            const topic = '/topic/live/' + taskId + '/' + type;
            const sub = this.client.subscribe(topic, (message) => {
                try {
                    const body = JSON.parse(message.body);
                    callback(body.type, body.data);
                } catch (e) {
                    console.error('[LiveWS] 消息解析失败:', e);
                }
            });
            this.subscriptions[key].push({ type, sub });
        });
    }

    /**
     * 取消订阅某个任务的所有话题
     * @param {string} taskId
     */
    unsubscribe(taskId) {
        const key = taskId;
        const subs = this.subscriptions[key];
        if (subs) {
            subs.forEach(s => {
                try { s.sub.unsubscribe(); } catch (e) {}
            });
            delete this.subscriptions[key];
        }
        // 清理 pending 中的
        this.pendingSubscriptions = this.pendingSubscriptions.filter(s => s.taskId !== taskId);
    }

    /**
     * 断开连接
     */
    disconnect() {
        if (this.client && this.connected) {
            try { this.client.disconnect(); } catch (e) {}
        }
        this.connected = false;
        this.client = null;
        this.subscriptions = {};
        this.pendingSubscriptions = [];
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
    }
}

export default new LiveWebSocketManager();
