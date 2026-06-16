<h1> x-springboot-ui </h1>

![Image text](https://img.shields.io/badge/Vue-2.6.14-green.svg)
![Image text](https://img.shields.io/badge/Element%20UI-2.15.6-blue.svg)
![Image text](https://img.shields.io/badge/node-12~16-green.svg)

#### 📚 后台项目

[X-SpringBoot 后端](https://github.com/BruceLql/x-springboot)

#### 🚧 环境准备

Node.js >= 12.x 且 <= 16.14.0（Vue CLI 4 兼容性要求）

```bash
# 克隆项目
git clone https://github.com/BruceLql/x-springboot-ui.git

# 进入项目
cd x-springboot-ui

# 安装依赖
npm install

# 运行项目（开发模式，端口 9999）
npm run dev

# 打包发布（输出到 ui/ 目录）
npm run build
```

> Node 17+ 需使用 `NODE_OPTIONS=--openssl-legacy-provider`（已内置在 scripts 中）

#### ⚡ 技术栈

| 类别 | 技术 | 版本 |
|------|------|------|
| 前端框架 | Vue 2 (Options API + Composition API 插件) | 2.6.14 |
| UI 组件库 | Element UI | 2.15.6 |
| 路由 | Vue Router | 3.5.3 |
| 状态管理 | Vuex | 3.6.2 |
| HTTP 客户端 | Axios | 0.24.0 |
| 实时通信 | SockJS + STOMP (WebSocket) | — |
| 图表 | ECharts | 5.2.2 |
| Markdown | marked + highlight.js | — |
| 国际化 | vue-i18n | 8.26.7 |
| 构建工具 | Vue CLI 4 (webpack) | 4.5.15 |
| CSS 预处理 | SCSS/Sass | — |

#### 📦 功能模块

- **AI 对话** — SSE 流式 Markdown 渲染、知识库管理、面试模拟
- **直播监控** — 实时数据面板、WebSocket 推送、电商统计
- **货仓管理 (WMS)** — 货物/供应商/入库/出库/库存/组商品/盘点
- **RBAC 权限** — 用户/角色/菜单/权限管理
- **短链服务** — 短链生成、访问统计、分表管理
- **短信/文件/参数** — 系统配置管理
- **主题切换** — 暗黑/明亮模式、多布局切换
- **多语言** — 简体中文/繁體中文/English

#### 🔧 开发配置

- **开发端口**: `9999`
- **API 代理**: 请求代理到 `http://localhost:8080`（后端 Spring Boot）
- **WebSocket 代理**: 支持 WebSocket 转发
- **环境变量**: 复制 `.env.example` 为 `.env.development`，配置 `VUE_APP_BASE_API`

#### 🚀 部署

```bash
npm run build   # 输出到 ui/ 目录
```

nginx 配置示例：
```nginx
server {
    listen 80;
    server_name localhost;
    client_max_body_size 100m;

    location / {
        root /path/to/ui;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Real-IP $remote_addr;
        if (!-e $request_filename) {
            proxy_pass http://127.0.0.1:8080;
        }
    }

    location ^~ /api/ {
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_pass http://127.0.0.1:8080;
    }
}
```

#### 📚 参考

- UI 框架模板：[vue-next-admin](https://gitee.com/lyt-top/vue-next-admin)
- 开发文档：[vue-next-admin-doc](https://lyt-top.gitee.io/vue-next-admin-doc-preview)
