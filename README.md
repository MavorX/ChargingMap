# ⚡ VWer-Charging

电动汽车充电站查找与管理应用 —— 基于高德地图的一站式充电服务解决方案

## 项目简介

VWer-Charging 是一款面向电动汽车车主的充电站查找与管理 Web 应用。用户可以通过地图直观地发现周边充电站，查看实时充电桩状态、分时电价、用户评价等信息，并完成预约充电、即时充电、在线支付、充电评价等全流程操作。

## 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Vue | 3.5 | 前端框架 |
| Pinia | 2.3 | 状态管理 |
| Vue Router | 4.4 | 路由管理 |
| TailwindCSS | 3.4 | UI 样式（本地构建） |
| Font Awesome | 7.2 | 图标库（本地 npm 包） |
| 高德地图 JS SDK | 2.0 | 地图、定位、导航 |
| Vite | 6.0 | 构建工具 |

## 功能概览

### 🗺️ 地图与站点发现

- **3D 地图展示** — 基于高德地图 3D 视图，默认定位合肥区域
- **自动/手动定位** — 页面加载自动获取用户位置，支持 GPS 优先定位
- **站点标记** — 圆形图标 + 闪电 SVG + 状态标签，颜色反映可用状态（绿色=有可用、黄色=紧张、红色=已满、灰色=维护中）
- **标记聚合** — 缩小时自动聚合显示，聚合圈显示站点数量和可用数，hover 放大效果
- **信息窗口** — 点击标记弹出详情窗口，含站名、快慢充可用数、地址、价格和导航按钮
- **驾车导航** — 使用 AMap.Driving 路线规划，自动绘制路线并显示距离和时间
- **地图缩放** — 右下角浮动按钮控制放大/缩小

### 📋 站点列表与筛选

- **站点列表** — 底部弹出面板展示附近充电站
- **关键词搜索** — 按站名和地址搜索
- **多条件组合筛选** — 快充可用/慢充可用/24小时/可预约四种多选，支持自由组合
- **高级筛选** — 按充电公司、接口类型、充电功率筛选（通过筛选面板入口进入）
- **状态标签** — "有可用"（绿色）/ "已满"（红色）/ "维护中"（灰色）
- **会员价标识** — 支持会员价的站点显示标签
- **距离与评分** — 显示距离（公里）和星级评分

### 📖 站点详情

- 基本信息（站名、地址、距离、快慢充可用数、电价、评分、状态）
- 营业时间、停车费、联系电话
- 充电桩详情（名称、功率、接口类型、状态）
- 分时电价（各时段电价和会员价）
- 用户评价（用户名、星级、内容、日期）
- 站点指引
- 收藏（持久化到 localStorage）/ 分享（Web Share API）
- 快捷操作：预约充电 / 导航 / 开始充电

### 📅 预约充电

- 充电桩选择（显示可用桩的功率和接口类型）
- 未来 7 天日期选择
- 6 个时间段选择（已满时段不可选）
- 车辆选择（从已添加车辆中选择）
- 充电量设置（10-100 kWh）
- 实时费用预估

### ⚙️ 充电设置

- 充电桩选择
- 目标电量滑块（50%-100%）
- 充电模式：即时充电 / 智能充电（低谷时段自动充电）
- 充电完成通知开关
- 费用提醒开关 + 金额阈值设置
- 设置持久化到 localStorage

### 🔋 充电中

- SVG 圆环动态电量进度
- 实时充电时长、已充电量、预计费用
- 功率进度条
- 预计剩余时间
- 手动结束充电 / 达到目标自动停止

### 💳 支付

- 充电详情（时长、电量、电价、服务费）
- 优惠券选择（支持满减券、折扣券、免费券三种类型）
- 三种支付方式（微信支付、支付宝、钱包余额）
- 费用明细（充电费、服务费、优惠券抵扣、实付金额）
- 模拟支付流程 + 加载动画
- 支付成功页面 + 充电摘要（显示实际支付金额）

### ⭐ 评价

- 1-5 星评分 + 文字描述
- 评价内容输入 + 字数统计
- 设施标签多选（充电速度快/价格合理/环境整洁/停车方便）
- 图片上传（可选）
- 提交评价获 5 积分奖励

### 👤 用户中心

- 用户信息（头像、昵称、会员等级、积分）
- 钱包余额、优惠券数量
- 充电记录、优惠券管理、我的钱包、我的车辆、我的收藏
- 通知中心（未读角标、标记已读、全部已读）
- 帮助中心
- 设置面板

### 🌙 全局功能

- **深色模式** — 亮色/深色主题切换，设置持久化
- **加载状态** — 全局 Loading 遮罩层 + 毛玻璃效果
- **消息提示** — Toast 提示（成功/错误/警告/信息四种类型）
- **面板过渡动画** — 滑入/滑出/淡入淡出
- **按钮交互反馈** — 点击缩放效果
- **毛玻璃效果** — Header 和面板顶部 backdrop-blur
- **Logo 回首页** — 点击 Logo 清除当前选中站点并回到地图初始状态

## 业务流程

```
地图点击站点标记 → 站点详情面板
站点列表点击站点 → 站点详情面板
站点详情 → 预约充电 → 预约成功提示
站点详情 → 充电设置 → 开始充电 → 充电中 → 结束充电 → 支付面板 → 支付成功 → 评价面板
Header 通知按钮 → 通知中心
Header 用户按钮 → 用户中心 → 通知中心
Header 定位按钮 → 地图定位到用户位置
Header Logo → 回到地图初始状态
站点列表筛选按钮 → 筛选面板
```

## 项目结构

```
v10-final/
├── index.html                        # 入口 HTML，含高德地图 SDK 和安全密钥配置
├── package.json                      # 项目依赖与脚本
├── vite.config.js                    # Vite 构建配置
├── tailwind.config.js                # TailwindCSS 主题配置
├── postcss.config.js                 # PostCSS 配置
├── generate_stations.js              # 充电站数据生成脚本
├── public/
│   └── data/
│       ├── station_list.json         # 站点列表数据
│       └── station_details.json      # 站点详情数据
└── src/
    ├── main.js                       # 应用入口，路由/Pinia/Font Awesome 配置
    ├── App.vue                       # 根组件，全局状态（深色模式/Toast/Loading）
    ├── assets/
    │   └── main.css                  # TailwindCSS + 自定义组件样式
    ├── views/
    │   └── HomeView.vue              # 主页面，面板联动控制中心
    ├── components/
    │   ├── Header.vue                # 顶部导航栏
    │   ├── map/
    │   │   ├── MapView.vue           # 高德地图视图
    │   │   └── NavigationBar.vue     # 导航状态栏
    │   ├── station/
    │   │   ├── StationsList.vue      # 站点列表面板
    │   │   ├── StationDetail.vue     # 站点详情面板
    │   │   ├── StationDetailInline.vue # 站点详情内联面板（地图信息窗口）
    │   │   └── DesktopStationList.vue # 桌面端站点列表
    │   ├── reservation/
    │   │   └── ReservationPanel.vue  # 预约充电面板
    │   ├── charging/
    │   │   ├── ChargingSettings.vue  # 充电设置面板
    │   │   └── ChargingPanel.vue     # 充电中面板
    │   ├── payment/
    │   │   ├── PaymentPanel.vue      # 支付面板
    │   │   └── PaymentSuccess.vue    # 支付成功页面
    │   ├── review/
    │   │   └── ReviewPanel.vue       # 评价面板
    │   ├── user/
    │   │   ├── UserProfile.vue       # 用户中心面板
    │   │   ├── NotificationsPanel.vue# 通知中心面板
    │   │   ├── VehiclePanel.vue      # 车辆管理面板
    │   │   ├── ChargingHistoryPanel.vue # 充电记录面板
    │   │   ├── CouponsPanel.vue      # 优惠券面板
    │   │   ├── WalletPanel.vue       # 钱包面板
    │   │   ├── FavoritesPanel.vue    # 收藏面板
    │   │   ├── HelpCenterPanel.vue   # 帮助中心面板
    │   │   └── SettingsPanel.vue     # 设置面板
    │   ├── filter/
    │   │   └── VehicleFilter.vue     # 筛选面板
    │   └── common/
    │       ├── Loading.vue           # 加载遮罩
    │       └── Toast.vue             # 消息提示
    ├── services/
    │   ├── api.js                    # API 服务（数据加载 + 模拟支付/评价）
    │   └── mapService.js             # 地图服务（标记管理/聚合/定位/导航/资源销毁）
    └── store/
        ├── index.js                  # Pinia 导出
        └── modules/
            ├── stations.js           # 站点状态管理（筛选/收藏/距离计算）
            ├── charging.js           # 充电状态管理（充电模拟/设置持久化）
            ├── reservation.js        # 预约状态管理
            └── user.js               # 用户状态管理（主题/通知/车辆/钱包）
```

## 架构设计

### 状态管理

项目使用 Pinia 进行状态管理，按业务领域拆分为 4 个独立 Store：

| Store | 职责 |
|-------|------|
| `stations` | 站点数据加载、筛选、收藏、距离计算、导航状态 |
| `charging` | 充电过程模拟、充电设置管理 |
| `reservation` | 预约记录的创建与取消 |
| `user` | 用户信息、车辆管理、通知、钱包交易、深色模式 |

### 地图服务

[mapService.js](src/services/mapService.js) 封装了 `MapManager` 类，统一管理高德地图交互：

- **标记渲染** — 自定义 SVG 图标，颜色根据可用状态动态计算
- **聚合显示** — 兼容 AMap 2.0 的 MarkerCluster API，支持 `renderMarker` / `renderClusterMarker` 自定义渲染
- **信息窗口** — 自定义 HTML 内容，含关闭按钮和导航交互
- **用户定位** — 异步加载 Geolocation 插件，GPS 优先定位
- **路线规划** — 异步加载 Driving 插件，自动绘制驾车路线
- **降级处理** — MarkerCluster 不可用时直接添加标记到地图
- **资源管理** — 提供 `destroy()` 方法清理标记、路线、信息窗口等资源，防止内存泄漏

### 面板联动

[HomeView.vue](src/views/HomeView.vue) 作为面板联动控制中心，通过 `ref` 状态变量控制各面板的显示/隐藏，并通过 `Transition` 组件实现滑入/滑出/淡入淡出动画。面板间的数据传递通过 Pinia Store 和 `inject/provide` 实现。

### 数据流

```
JSON 文件 → api.js (fetch) → Pinia Store → Vue 组件
localStorage ←→ Pinia Store (收藏/主题/充电设置)
CustomEvent ←→ mapService.js ←→ HomeView.vue (地图交互)
```

## 数据存储

| 数据 | 存储方式 | 说明 |
|------|----------|------|
| 站点列表 | JSON 文件 | `public/data/station_list.json` |
| 站点详情 | JSON 文件 | `public/data/station_details.json` |
| 收藏站点 | localStorage | key: `favoriteStations` |
| 主题设置 | localStorage | key: `isDarkMode` |
| 充电设置 | localStorage | key: `chargingSettings` |
| 用户信息 | Pinia 内存 | 模拟数据 |
| 预约记录 | Pinia 内存 | 模拟数据 |
| 通知数据 | Pinia 内存 | 模拟数据 |
| 钱包交易 | Pinia 内存 | 模拟数据（支持充值/支付/退款三种类型） |

## 快速开始

### 环境要求

- Node.js >= 18
- npm >= 9

### 安装与运行

```bash
# 安装依赖
npm install

# 启动开发服务器（默认端口 3000）
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

### 数据生成

项目包含充电站数据生成脚本，可自定义生成站点数据：

```bash
node generate_stations.js
```

脚本会在 `public/data/` 目录下生成 `station_list.json` 和 `station_details.json`，默认生成 500 个站点，数据覆盖合肥市各区域，包含多种充电品牌、接口类型和功率等级。

## 高德地图配置

项目使用高德地图 JS SDK 2.0，需要在 [index.html](index.html) 中配置：

1. **API Key** — 替换 `index.html` 中 script 标签的 `key` 参数
2. **安全密钥** — 替换 `window._AMapSecurityConfig.securityJsCode`

获取密钥请前往 [高德开放平台](https://lbs.amap.com/) 注册并创建应用。

## UI 设计体系

项目基于 TailwindCSS 构建了完整的设计体系（见 [tailwind.config.js](tailwind.config.js)）：

- **色彩系统** — primary（蓝）/ secondary（绿）/ accent（紫）/ warning（黄）/ danger（红）/ surface（灰）6 组色阶
- **阴影系统** — soft / soft-md / soft-lg / soft-xl / glow 系列阴影
- **渐变系统** — gradient-mesh / gradient-premium / gradient-energy / gradient-sunset / gradient-ocean / gradient-dark
- **动画系统** — float / pulse-soft / shimmer / slide-up-fade / scale-in / bounce-soft / glow / spin-slow
- **组件类** — glass-effect / glass-card / premium-card / btn-premium / input-premium / status-badge / icon-button

## 更新日志

### v10-final 修复与优化

#### Bug 修复

- **站点状态判断** — 修复站点列表和站点详情（StationsList / StationDetail / StationDetailInline / DesktopStationList）未检查站点维护状态（`openStatus === 0`）的问题，维护中的站点现在正确显示灰色"维护中"标签，而非错误地显示"有可用"
- **支付金额与优惠券一致性** — 修复使用优惠券后，钱包扣款金额（折扣后）与充电记录/钱包交易/支付成功页面显示金额（折扣前）不一致的问题。`PaymentPanel` 现在将实际支付金额（`finalAmount`）通过 `payment-success` 事件传递给 `HomeView`，确保全流程金额一致
- **地图资源泄漏** — 修复 `MapView` 组件卸载时未调用 `mapManager.destroy()` 和未清理防抖定时器的问题，防止标记、路线、信息窗口等资源泄漏
- **筛选入口缺失** — 修复站点列表中缺少筛选入口按钮的问题，在 StationsList 头部添加"筛选"按钮，点击后触发 `show-filter` 事件打开 VehicleFilter 面板
- **通知角标逻辑** — 修复通知中心角标始终显示的问题，现在仅在有未读通知时显示红色角标
- **支付成功页面金额显示** — 修复支付成功页面显示模拟充电费用而非实际支付金额的问题，现在正确显示含优惠券抵扣后的实付金额
- **优惠券折扣计算** — 修复百分比折扣券（如8折券）计算逻辑错误，现在基于充电总金额计算折扣并受最高减免金额限制
- **钱包退款处理** — 修复 `addWalletTransaction` 未处理退款类型的问题，现在充值/支付/退款三种类型均可正确更新余额
- **充电桩选择器初始化** — 修复充电设置和预约面板中充电桩选择器在异步数据加载后不更新的问题，改用 `watch` 响应式初始化
- **Logo 回首页** — 修复点击 Header Logo 无响应的问题，现在点击 Logo 可清除当前站点并回到地图初始状态
- **筛选面板功率类型** — 修复 VehicleFilter 中 `selectedPower` 为字符串类型导致筛选比较异常的问题

#### 代码优化

- **Store 导出优化** — 将 `store/index.js` 从仅导出 `createPinia` 改为统一导出所有 Store 模块（`useStationsStore` / `useChargingStore` / `useReservationStore` / `useUserStore`），方便外部引用
- **收藏数据去重** — 移除 `user.js` 中与 `stations` store 重复的 `favoriteStations` 数据和 `removeFavoriteStation` 方法，统一由 `stations` store 管理收藏功能
- **钱包交易类型简化** — 将 `addWalletTransaction` 中三个重复的 `if-else` 分支合并为 `includes` 检查
- **地图资源管理** — 在 `mapService.js` 中新增 `_clearDirectMarkers()` 和 `destroy()` 方法，组件卸载时正确清理标记、路线、信息窗口等资源，防止内存泄漏
- **筛选面板集成** — 将原本未使用的 `VehicleFilter` 组件集成到站点列表中，添加筛选入口按钮
- **数据生成脚本** — 修复 `generate_stations.js` 中评论日期硬编码年份问题，改用动态获取当前年份

## 注意事项

- 本项目为前端演示应用，支付、预约等流程均为模拟数据，不涉及真实交易
- 高德地图 API Key 和安全密钥为开发测试用途，生产环境请替换为自己的密钥
- 充电站数据由 `generate_stations.js` 脚本随机生成，仅供演示
- 项目当前为单页应用，所有功能在一个页面内通过面板切换实现
