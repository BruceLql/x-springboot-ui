import request from '@/utils/request';

/**
 * AI 知识库 API
 */
export function useKnowledgeApi() {
    return {
        list: (params) => request({ url: '/ai/knowledge/list', method: 'get', params }),
        info: (id) => request({ url: `/ai/knowledge/info/${id}`, method: 'get' }),
        importAll: () => request({ url: '/ai/knowledge/import', method: 'post' }),
        reload: () => request({ url: '/ai/knowledge/reload', method: 'post' }),
        delete: (id) => request({ url: `/ai/knowledge/${id}`, method: 'delete' }),
        search: (data) => request({ url: '/ai/knowledge/search', method: 'post', data }),
    };
}

/**
 * AI 对话 API
 */
export function useChatApi() {
    return {
        // 会话
        listSessions: () => request({ url: '/ai/chat/sessions', method: 'get' }),
        createSession: (data) => request({ url: '/ai/chat/sessions', method: 'post', data }),
        deleteSession: (id) => request({ url: `/ai/chat/sessions/${id}`, method: 'delete' }),
        getMessages: (id) => request({ url: `/ai/chat/sessions/${id}/messages`, method: 'get' }),
        // 对话
        send: (data) => request({ url: '/ai/chat/send', method: 'post', data }),
        // SSE 流式 URL 生成（不通过 axios，直接 fetch/EventSource）
        streamUrl: () => '/ai/chat/send/stream',
    };
}

/**
 * AI 模拟面试 API
 */
export function useInterviewApi() {
    return {
        start: (data) => request({ url: '/ai/interview/start', method: 'post', data }),
        answer: (data) => request({ url: '/ai/interview/answer', method: 'post', data }),
        skip: (sessionId) => request({ url: '/ai/interview/skip', method: 'post', data: { sessionId } }),
        end: (sessionId) => request({ url: '/ai/interview/end', method: 'post', data: { sessionId } }),
        listSessions: () => request({ url: '/ai/interview/sessions', method: 'get' }),
        getDetail: (id) => request({ url: `/ai/interview/sessions/${id}`, method: 'get' }),
    };
}
