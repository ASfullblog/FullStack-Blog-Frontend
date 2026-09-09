# Frontend

本文档说明当前前端的真实结构、请求方式，以及小游戏和后台的新改动。

## 技术栈

- Vue 3
- TypeScript
- Vite
- Element Plus
- Pinia
- Vue Router
- Axios

## 目录重点

```text
frontend/
├─ src/
│  ├─ api/                    接口封装
│  ├─ components/
│  │  ├─ Games/               小游戏组件
│  │  └─ admin/               后台布局与通用组件
│  ├─ router/
│  │  └─ admin/               后台路由
│  ├─ stores/                 Pinia 状态
│  ├─ utils/
│  │  └─ request.ts           Axios 实例
│  └─ views/
│     ├─ Games.vue            小游戏中心
│     └─ admin/               后台页面
└─ package.json
```

## 请求层

核心文件：`src/utils/request.ts`

当前规则：
- 开发环境走 `'/api'`
- 生产环境走线上后端地址
- 请求拦截器自动附加 `Authorization: Bearer <token>`
- 响应拦截器统一返回后端响应体里的 `data/code/message` 结构

### 本轮修复

此前 `request.ts` 里的开发环境 `baseURL` 写法有问题，导致部分接口在本地开发环境下路径不稳定。这一处已经修复。

## 小游戏中心

核心页面：`src/views/Games.vue`

### 当前行为

1. 页面挂载时调用 `getGameList()`
2. 后端只返回 `is_published = 1` 的游戏
3. 用户点击某个游戏后：
   - 切换到对应组件
   - 调用 `trackGameView(slug)` 统计浏览量

### 当前映射关系

前端内部仍然保留一层 `slug -> 组件ID` 映射，例如：
- `parking-rush` -> `parking`
- `tetris` -> `tetris`
- `link-match` -> `linkmatch`

这意味着：
- 展示来源已改成数据库
- 组件渲染仍由前端本地组件承载

## 停车场小游戏

组件：`src/components/Games/ParkingRush.vue`

### 已完成的后端接入

- 关卡列表和关卡详情从后端读取
- 过关结果提交到后端
- 排行榜、用户进度、难度保存都已接接口

### 本轮修复

停车场页面之前会在未登录时直接请求需要登录的接口。现在已经收敛为：
- 通用游戏用户数据接口在未登录时直接返回默认值
- 停车场难度保存接口在未登录时不再请求后端

这类 401 属于“前端调用时机不对”，不是后端鉴权中间件错误。

## 后台页面

### 新增小游戏管理页

页面：`src/views/admin/GameManagement.vue`

能力：
- 拉取 `/api/admin/games`
- 展示游戏名称、slug、简介、浏览量、评分、排序
- 切换 `isPublished`

### 后台布局更新

文件：`src/components/admin/AdminLayout.vue`

新增：
- 左侧菜单“小游戏管理”
- 用户菜单中的“返回前台”按钮
- 图标：`TopLeft`
- 位置：在“退出登录”上方

### 仪表盘更新

页面：`src/views/admin/Dashboard.vue`

新增数据来源：
- `/api/admin/dashboard/stats`

新增展示：
- 文章浏览量
- 小游戏浏览量
- 总浏览量

## 路由

后台新增路由：

```ts
/admin/games
```

对应页面：

```ts
src/views/admin/GameManagement.vue
```

## 当前前端问题结论

### 已确认并修复的 401 原因

1. `request.ts` 的开发环境 `baseURL` 异常
2. 停车场接口路径写错
3. 未登录时主动请求鉴权接口

### 尚未处理完的前端范围

1. `Games.vue` 样式仍偏重、偏花，不符合你想要的“简约 + iOS”方向
2. 除停车场外，其他小游戏还没有像停车场一样完整后端化
3. 游戏关卡配置的统一结构还没有抽象成单独配置模型

## 开发命令

```bash
cd frontend
npm install
npm run dev
npm run build
```

## 前端下一步建议

按优先级继续做：

1. 继续把 `game.vue` 和小游戏组件的数据源迁到后端
2. 把游戏中心和非详情页视觉风格收敛
3. 给小游戏管理页补搜索、排序、分页
