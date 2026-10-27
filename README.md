# ⚡ VWer-Charging

基于 Vue 与高德地图的电动汽车充电服务演示项目。

## 项目简介

项目使用上海 1500 个、合肥 500 个假设站点（共 2000 站）演示找站、筛选、查看详情、路线规划、预约、充电、结算和评价。**定位到哪里，就按实际位置与地图视野展示附近的数据，不需要选择城市。**站点、枪位、电价和车辆参数均可使用模拟数据，重点是交互连贯、状态一致，以及符合现实常识的操作顺序，而非接入真实运营商。

充电需明确选择充电桩，看到插枪提醒后点击「已插好」，等待连接检测与启动效果才开始计量；结束时确认停止，再提醒拔枪。没有真实控桩或扣款，用户不需要操作设备测试台，也不需要手输枪码。

## 技术栈

| 技术           | 版本  | 用途            |
| ------------ | --- | ------------- |
| Vue          | 3.5 | 前端框架          |
| Pinia        | 2.3 | 状态管理          |
| Vue Router   | 4.4 | 路由管理          |
| TailwindCSS  | 3.4 | UI 样式（本地构建）   |
| Font Awesome | 7.2 | 图标库（本地 npm 包） |
| 高德地图 JS SDK  | 2.0 | 地图、定位、导航      |
| Vite         | 6.0 | 构建工具          |
| Vitest       | 3.2 | 单元测试          |
| ESLint       | 9.x | 代码检查          |

## 功能概览

### 🗺️ 地图与站点发现

- **3D 地图展示** — 基于高德地图 3D 视图，跟随设备定位，也可自由拖动、缩放浏览；没有城市模式或城市切换入口
- **自动/手动设备定位** — 地图初始化后请求设备位置，也可点击重新定位；显示报告误差，拒绝用 IP/城市位置冒充当前位置，无法授权时明确提示
- **站点数据** — 上海 1500 站覆盖 16 个区及 80 余条道路走廊，保留合肥 500 站；列表和标记统一按地图视野展示，不依赖真实地点检索权限
- **状态标记** — 用文字与颜色展示模拟可用数、已满、维护；缩小时聚合
- **信息窗口** — 站名、地址、空闲枪数、电价、收藏与详情
- **驾车导航** — 通过高德路线规划展示导航交互；模拟站点地址不作为实际出行依据
- **地图缩放** — 右下角浮动按钮控制放大/缩小
- **导航栏** — 地图上方浮动导航栏，显示当前位置信息和快捷操作
- **顶部选中态** — 探索、收藏、充电记录随当前内容切换；账户子页保持账户入口选中，顶部切换不累积过时返回栈

### 📋 站点列表与筛选

- **站点列表** — 移动端底部弹出面板 / 桌面端左侧固定列表面板
- **关键词搜索** — 对全部站点按站名/地址筛选，再按视野及分页展示；多个搜索入口共享状态，没有隐藏的城市筛选
- **组合筛选** — 快慢充可用、营业、预约、接口及功率
- **列表收起** — 左侧收起后仍在左侧保留展开入口；保留原列表 DOM、滚动位置、搜索和筛选
- **状态标签** — 展示模拟站点的可用状态、电价与评分
- **距离** — 有定位时显示直线估算，非行车里程；没有定位则不填默认距离
- **分页展示** — 点击「加载更多」展示本批剩余结果，不声称已检索全部站点
- **桌面端内联详情** — 列表与地图选站都在左侧展示详情，不跳到右侧抽屉

### 📖 站点详情

- 模拟站名、地址、距离、快慢充枪位、功率、接口、分时电价、评分和评价
- 营业时间、停车规则与站点指引
- 详情主操作「选择充电桩」进入设置，不会直接开始充电
- 收藏（持久化到 localStorage）/ 分享（Web Share API）

### 📅 预约演示

- 充电桩选择（快充+慢充可用桩，显示功率和接口类型）
- 未来 7 天日期选择
- 6 个时间段选择（已满时段不可选）
- 车辆选择（从已添加车辆中选择）
- 充电量设置（10-100 kWh）
- 实时费用预估

### ⚙️ 充电设置与接枪

- 必须明确选择充电桩；默认提供示例车辆与可调整的起始/目标电量
- 检查接口兼容、电池容量、车辆/枪功率及目标范围
- 「下一步」只打开插枪弹窗，不开始计量；「已插好，开始检测」后显示连接检测、车辆通信与启动效果
- 取消插枪弹窗不产生订单，检测期间防重复点击，失败可重试或返回换桩
- 从管理车辆返回会保留已选桩和表单参数
- 默认 60× 加速方便体验，可切换正常速度；界面明确标注演示速度

### 🔋 充电进度与结束

- 电量圆环、功率、时长、电量、费用与剩余时间；按功率 × 时间计算，避免数字明显不合常理
- 选中枪位在使用期间显示占用，停止后仍需拔枪归位才恢复可用
- 返回地图继续演示，提供进度恢复入口；「结束充电」有独立确认，避免误触
- 停止完成后提示拔枪，再查看账单；目标电量自动停止也遵循停止 → 拔枪的顺序
- 结束确认打开期间自动充满时，旧确认随状态收起，焦点转到「已拔枪，查看账单」，不会留下无效结束按钮
- 刷新恢复上次保存进度并标记中断，不补记离线电量

### 💳 支付演示（不涉及真实交易）

- 充电详情（时长、电量、电价、服务费）
- 优惠券选择（支持满减券、折扣券、免费券三种类型）
- 三种支付方式（微信支付、支付宝、钱包余额）
- 费用明细（充电费、服务费、优惠券抵扣、实付金额）
- 模拟支付流程 + 加载动画
- 支付失败不结算，处理中锁定选项；异步响应返回后重新检查订单身份、余额和优惠券条件
- 支付成功页面 + 充电摘要（显示实际支付金额）

### ⭐ 评价

- 1-5 星评分 + 文字描述
- 评价内容输入 + 字数统计
- 设施标签多选（充电速度快/价格合理/环境整洁/停车方便）
- 本地图片预览与移除（可选，最多 3 张，每张不超过 5MB；尚未接入服务端上传）
- 提交测试评价获 5 个测试积分，同一订单只奖励一次；没有向运营商发布评价

### 👤 我的账户

- 首页及钱包、车辆、记录、优惠券、收藏、通知、设置、帮助共九页统一使用 `AccountPanel`，不再混用旧版渐变大卡片
- 钱包余额、可用券数量、积分明细；积分每笔订单评价仅奖励一次，当前无兑换功能
- 充电记录支持站点/车辆搜索、状态筛选和订单明细；账户和记录页可恢复当前未完成订单
- 优惠券分可使用、已使用和已过期；「去使用」实际进入当前订单或找站流程，结算再次核对门槛与有效期
- 钱包提供演示充值/提现和收支筛选；金额范围与两位小数校验、余额变化复核、防重复确认
- 车辆可添加、编辑、设为默认、删除并本地保存；未保存修改需确认放弃，当前会话使用的车辆禁止编辑/删除
- 收藏站点可打开详情，取消收藏需确认；空态提供找站入口
- 通知支持未读筛选、逐条已读和全部已读；已读状态本地保留
- 帮助支持关键词、分类、答案折叠与无结果重置
- 设置支持昵称、深色模式、页面内消息及充电结束提示，并保留到当前浏览器；不提供无实际作用的自动支付或退出登录按钮

### 🌙 全局功能

- **中英文切换** — 顶部语言按钮或「设置 → 界面语言」即时切换，刷新后保留选择；英文覆盖站点、充电、结算和账户页面，支持中英文站名/地址搜索，金额仍使用人民币
- **深色模式** — 亮色/深色主题切换，设置持久化，DOM 操作统一由 App.vue watch 管理
- **加载状态** — 地图、列表和提交操作提供局部等待与失败反馈
- **消息提示** — Toast 提示（成功/错误/警告/信息四种类型）
- **面板过渡动画** — 滑入/滑出/淡入淡出
- **按钮交互反馈** — 选中、禁用和处理中有明确状态，不靠放大移动布局
- **界面层次** — 单色主操作、轻边框卡片与中性内容层，地图控件不会越过业务弹层
- **Logo 回首页** — 点击 Logo 清除当前选中站点并回到地图初始状态
- **响应式布局** — 移动端底部弹出面板 + 桌面端左右分栏布局

## 业务流程

```
地图点击站点标记 → 站点详情面板
站点列表点击站点 → 站点详情面板（桌面端左侧内联详情）
站点详情 → 选择充电桩 / 车辆 / 目标 → 请插好充电枪 → 已插好 → 连接检测与启动效果
→ 充电进度 → 确认结束 → 停止完成 → 拔枪提醒 → 账单 → 模拟支付 / 自愿评价
关闭进度面板 → 演示继续 → 会话入口恢复；刷新网页 → 恢复保存进度并提示中断
Header 通知按钮 → 通知中心
Header 用户按钮 → 用户中心 → 通知中心/充电记录/优惠券/钱包/车辆/收藏/设置/帮助
Header 定位按钮 → 地图定位到用户位置
Header Logo → 回到地图初始状态
站点列表筛选按钮 → 筛选面板
```

## 项目结构

```
vwcharging/
├── index.html                        # 入口 HTML（viewport-fit=cover）
├── package.json                      # 项目依赖与脚本
├── vite.config.js                    # base / vendor 分包 / analyze 构建
├── vitest.config.js                  # Vitest 配置（jsdom + 演示数据环境）
├── tailwind.config.js                # TailwindCSS 主题、z-index 令牌
├── postcss.config.js                 # PostCSS 配置
├── generate_stations.js              # 双城市确定性数据生成（--count / --seed / --out-dir）
├── scripts/
│   ├── prebuild-check.mjs            # 构建前校验 VITE_AMAP_KEY / VITE_BASE
│   ├── validate-data.mjs             # npm run check:data
│   └── check-a11y.js                 # npm run check:a11y（icon-only 按钮扫描）
├── .github/workflows/
│   ├── ci.yml                        # lint + test + check:data + build
│   └── deploy-pages.yml              # 手动触发的 GitHub Pages 部署
├── public/
│   ├── favicon.svg
│   └── data/
│       ├── station_list.json         # 统一站点列表（上海 1500 + 合肥 500）
│       └── details/
│           ├── part-01..05.json      # 合肥详情（每片 100 站，保留旧路径）
│           └── sh-part-01..15.json   # 上海详情（独立分片与缓存）
└── src/
    ├── main.js                       # 应用入口，路由/Pinia/Font Awesome 配置
    ├── App.vue                       # 根组件，全局状态（深色模式/Toast/Loading）
    ├── assets/
    │   ├── main.css                  # TailwindCSS + 自定义组件样式 + a11y 基线
    │   └── logo.webp                 # 80×80 WebP Logo
    ├── views/
    │   └── HomeView.vue              # 主页面，面板编排与地图联动
    ├── components/
    │   ├── Header.vue                # 顶部导航栏（响应式通知角标）
    │   ├── map/
    │   │   ├── MapView.vue           # 高德地图视图
    │   │   └── NavigationBar.vue     # 导航状态栏
    │   ├── station/
    │   │   ├── StationsList.vue      # 站点列表面板（移动端）
    │   │   ├── DesktopStationList.vue # 桌面端站点列表
    │   │   ├── StationDetail.vue     # 站点详情（移动弹层 / 桌面内联共用）
    │   │   ├── StationListCard.vue   # 站点卡片
    │   │   └── StationListControls.vue # 搜索/筛选控件
    │   ├── reservation/ReservationPanel.vue
    │   ├── charging/
    │   │   ├── ChargingSettings.vue
    │   │   └── ChargingPanel.vue
    │   ├── payment/
    │   │   ├── PaymentPanel.vue
    │   │   └── PaymentSuccess.vue
    │   ├── review/ReviewPanel.vue
    │   ├── user/                     # 用户中心 / 通知 / 车辆 / 记录 / 券 / 钱包 / 收藏 / 帮助 / 设置
    │   ├── filter/VehicleFilter.vue
    │   └── common/
    │       ├── PanelShell.vue        # 面板容器（dialog 语义 / 焦点陷阱 / Esc）
    │       ├── Loading.vue
    │       ├── Toast.vue
    │       ├── StarRating.vue
    │       └── ToggleSwitch.vue
    ├── composables/
    │   ├── useStationList.js         # 列表分页/筛选/搜索
    │   └── useAvailableConnectors.js # 快慢充可用桩合并
    ├── constants/headerEvents.js     # Header 事件到面板名的映射
    ├── mocks/userDemo.js             # VITE_DEMO 演示用户数据
    ├── services/
    │   ├── api.js                    # 列表 + 详情分片 + 模拟支付/评价
    │   ├── amapLoader.js             # 高德 JSAPI 动态加载与降级
    │   └── mapService.js             # 标记/聚合/定位/导航/资源销毁
    ├── utils/
    │   ├── format.js
    │   ├── pricing.js
    │   └── stationStatus.js
    ├── store/
    │   ├── index.js
    │   └── modules/
    │       ├── stations.js           # 站点数据、筛选、收藏、距离、搜索
    │       ├── charging.js           # 充电模拟与设置
    │       ├── reservation.js        # 预约记录
    │       ├── user.js               # 用户、车辆、通知、钱包、主题
    │       └── ui.js                 # activePanel 单源面板编排
    └── __tests__/                    # 单元与交互测试（最新结果见 INTERACTION_AUDIT.md）
```

## 架构设计

### 状态管理

项目使用 Pinia 进行状态管理，按业务领域拆分为 5 个独立 Store：

| Store         | 职责                        |
| ------------- | ------------------------- |
| `stations`    | 站点数据加载、筛选、搜索、收藏、距离计算、导航状态 |
| `charging`    | 充电过程模拟、充电设置管理             |
| `reservation` | 预约记录的创建与取消                |
| `user`        | 用户信息、车辆管理、通知、钱包交易、深色模式    |
| `ui`          | `activePanel` 单源面板编排、返回历史栈 |

### 地图服务

[mapService.js](src/services/mapService.js) 封装了 `MapManager` 类，统一管理高德地图交互；[amapLoader.js](src/services/amapLoader.js) 负责 JSAPI 加载与失败降级：

- **标记渲染** — 自定义 SVG 图标，颜色根据可用状态动态计算
- **聚合显示** — 兼容 AMap 2.0 的 MarkerCluster API，支持 `renderMarker` / `renderClusterMarker` 自定义渲染
- **信息窗口** — 全站复用一个 InfoWindow 实例，避免每个标记各建一个
- **用户定位** — 自动定位或点击重定位后展示实际设备坐标，报告误差、来源和权限问题；站点不受城市开关限制
- **路线规划** — 异步加载 Driving 插件，自动绘制驾车路线
- **降级处理** — MarkerCluster 不可用时直接添加标记；地图脚本或密钥不可用时显示降级面板并给出配置指引
- **资源管理** — 提供 `destroy()` 方法清理标记、路线、信息窗口等资源，防止内存泄漏

### 面板联动

[HomeView.vue](src/views/HomeView.vue) 是面板编排入口，所有弹层由 [ui store](src/store/modules/ui.js) 的 `activePanel` 单一状态驱动：`open()` 互斥打开并记录返回栈，`replace()` 用于支付流程内的顺序切换，`close()` 出栈返回，`dismiss()` 终止流程。弹层统一使用 `PanelShell`（`role="dialog"`、焦点陷阱、Esc 关闭、滚动锁定），非首屏面板通过 `defineAsyncComponent` 按需加载。

### 数据流

```
station_list.json → api.js (fetch) → Pinia Store → 站点列表 / 地图 / 详情
data/details/[sh-]part-NN.json → api.js（城市前缀 + 序号推导分片，Promise 级缓存）→ Store
chargerGateway.js（虚拟设备）→ charging 状态机 → chargingModel.js 计量 → 测试账本
localStorage ←→ Pinia Store (收藏/车辆/演示会话与账本/积分/昵称与偏好/主题)
CustomEvent ←→ mapService.js ←→ HomeView.vue (地图交互)
```

## 数据存储

| 数据   | 存储方式         | 说明                                 |
| ---- | ------------ | ---------------------------------- |
| 演示站点 | JSON 文件与分片 | `public/data/`，上海 1500 + 合肥 500 站 |
| 收藏站点 | localStorage | key: `favoriteStations`            |
| 本地车辆 | localStorage | `chargingLocalVehicles` |
| 演示会话 | localStorage | `chargingSandboxSession`，沿用存储键，中断恢复不补电量 |
| 测试账本 | localStorage | `chargingSandboxLedger`，余额/记录/通知/已用券/积分明细；不是真实钱包 |
| 昵称与提醒 | localStorage | `chargingPreferences`，仅当前浏览器 |
| 主题设置 | localStorage | key: `isDarkMode`                  |
| 充电设置 | localStorage | key: `chargingSettings`            |
| 用户信息 | 内存 + 本地偏好 | 空态或 `VITE_DEMO` 初始数据；昵称可修改保存 |
| 预约记录 | Pinia 内存     | 空态或 `VITE_DEMO` 演示数据               |
| 通知/钱包交易 | 内存 + 本地测试账本 | 空态或 `VITE_DEMO` 初始数据，不涉及真实资金 |

## 快速开始

### 环境要求

- Node.js 满足 `package.json` 的 `engines` 要求；本地、CI 与部署统一使用 `.nvmrc` 的 **22.23.2**，不再支持 Node 18/20
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

# 代码检查 / 单元测试 / 数据契约校验
npm run lint
npm run test -- --run
npm run check:data
```

本地使用 Node 版本管理器时可运行 `nvm install` / `nvm use`（或按所用工具读取 `.nvmrc`）。当前 `jsdom` 等开发依赖要求 Node `^22.22.2 || ^24.15.0 || >=26.0.0`；只修改工作流或只看本地测试结果会导致环境不一致。

Git 推送成功、GitHub CI 通过和部署完成是三个不同状态：推送后还需确认**同一提交**的 CI 结果；GitHub Pages 仍须手动触发部署，不能把推送成功当作网站已更新。

### 数据生成

项目包含充电站数据生成脚本，可自定义生成站点数据：

```bash
# 默认生成上海 1500 + 合肥 500 站，共 2000 站（seed=42）
node generate_stations.js

# 分别指定数据数量
node generate_stations.js --shanghai-count 1500 --hefei-count 500 --seed 42

# 两城使用相同数量（兼容原参数，共 600 站）
node generate_stations.js --count 300 --seed 7

# 输出到独立目录，不覆盖仓库数据
node generate_stations.js --count 100 --out-dir ./demo-data
node scripts/validate-data.mjs --list=./demo-data/station_list.json
```

脚本同时生成上海和合肥的数据，**重置式重建**输出目录内的生成文件：清理旧的 `details/part-*.json`、`details/sh-part-*.json` 和遗留的 `station_details.json`，再写入统一的 `station_list.json` 与详情分片；不会删除其他名称的文件。默认 seed=42，上海 1500 站、合肥 500 站。`HF`/`SH` + 6 位序号分别从 `000001` 起，分片号 = `ceil(序号 / 100)`；合肥保留 `part-01.json` 等旧路径，上海使用 `sh-part-01.json` 至 `sh-part-15.json`，缓存不混用。数据按来源分片不代表界面上存在城市模式。

`--shanghai-count`、`--hefei-count` 可分别指定 1..2000 站；`--count` 同时设置两城数量，混用时按命令行顺序覆盖。`--seed` 为 0..4294967295，参数非法直接退出且不写文件。两城使用独立的 mulberry32 随机流，同一参数重复运行逐字节一致，增减上海数据不会改变同参数下的合肥数据。`--out-dir` 可指定独立目录，`--help` 查看内置用法。

### 在上海定位并演示

- 允许浏览器和系统的位置权限。自动定位或点击定位后，地图移动到设备位置；人在上海即可看到视野内的上海模拟站点，不需要额外选择上海。
- 浏览到人民广场附近时可搜索 **`SH000001` 上海·人民广场演示充电站**；陆家嘴 `SH000002`、徐家汇 `SH000003` 也保留常用接口可用。它们不是必经入口，任意营业且枪口可用、车辆兼容的模拟站点都能按正常选桩、接枪、检测、停止、拔枪、结算顺序演示。
- 上海 1500 站不仅分布于黄浦、浦东、徐汇、静安等中心城区，也包括临港、嘉定、松江、青浦西部、奉贤、金山和崇明等区域。拖动或缩放地图自然更新结果；大视野同时包含合肥与上海时，两个地区的站点都可显示。
- 定位失败不伪造上海位置，也不跳回城市中心；仍可浏览地图、搜索并使用模拟数据。地图坐标、门牌、站名、电话、电价及枪位均为假设，不代表真实运营点，不应据此实际前往。

### 演示数据

应用默认以**空态**启动：钱包余额 0，充电记录、优惠券、钱包交易、预约均为空，通知中心仅保留一条欢迎语。运营演示或截图时，可在 `.env.local` 中打开内置演示数据：

```bash
VITE_DEMO=true
```

开启后，用户中心会载入 [src/mocks/userDemo.js](src/mocks/userDemo.js) 中的示例充电记录、钱包交易、优惠券、通知与预约。演示记录和预约统一引用上海首站 `SH000001`，名称和地址与生成数据一致；旧合肥 `HF000001` 仍可加载。该文件随构建静态打包，若被误删会直接构建失败而不是运行时出现空数据。

该开关只决定**初始用户数据**的来源，支付、充电、评价等模拟流程本身不受影响；不设置或设为 `false` 时即为空态，生产/部署环境请保持关闭（部署演示可在构建时显式注入）。

## 高德地图配置

项目使用高德地图 JS SDK 2.0，密钥通过环境变量注入，不硬编码在代码中：

1. 复制 [.env.example](.env.example) 为 `.env.local`（此文件已被 .gitignore 忽略，不会提交）
2. 在 `.env.local` 中填入你的 `VITE_AMAP_KEY` 和 `VITE_AMAP_SECURITY_CODE`

获取密钥请前往 [高德开放平台](https://lbs.amap.com/) 注册并创建应用。

地图需配置对应域名白名单；站点数据由本地 JSON 提供，不需要地点检索权限。地图加载失败时仍可通过列表体验详情、接枪、充电和结算，不接入运营商私钥或支付密钥。

### 定位权限与精度

- 定位需要 HTTPS 或 `localhost`；普通 HTTP 局域网地址不满足安全上下文要求。浏览器站点位置权限、系统位置服务以及内嵌浏览器宿主的授权都可能限制定位，地图能加载不代表定位已获允许。
- Windows/桌面浏览器未必具备 GPS，浏览器可能依赖 Wi-Fi、系统或网络位置服务，同城偏差几百米乃至数公里并不罕见。`enableHighAccuracy` 只是请求更高精度，不是精度保证；页面显示设备**报告的误差**，大误差或未知精度标记为估算。
- 若 OpenCode 内嵌预览的 `navigator.permissions` 返回 `denied`，网站脚本不能替宿主授权。可在普通浏览器检查该站的位置权限，并在 Windows「隐私和安全性 → 位置」检查系统与桌面应用访问；不要把 OpenCode 工具权限或 CORS 配置当作网页定位权限开关。
- 高德定位禁用 IP/城市回退；仅 IP 结果、无效坐标、转换失败不会写成新的设备位置。H5 结果默认由 SDK 转为高德坐标；SDK 同时返回 `isConverted=false` 和 `Convert Success` 时，以转换成功信息避免二次偏移；明确仍为原始坐标的结果才另行转换。
- 地图加载后自动请求设备位置，可手动重新定位；失败时保留当前视野，不会将城市中心偷偷作为设备位置或导航起点。超时、取消或销毁后的晚到结果无权再移动地图；粗略位置用于路线起点时仍标注估算。
- 本项目不能提高硬件或浏览器位置服务本身的精度，也不能证明蓝点与实际位置吻合；真实定位还需在用户设备上核对。设备位置不写入本地账户账本。

## 部署

项目是纯静态单页应用，`npm run build` 的产物在 `dist/`，可托管到任意静态站点。

### GitHub Pages（内置工作流）

仓库包含 [.github/workflows/deploy-pages.yml](.github/workflows/deploy-pages.yml)，只支持手动触发，push 不会自动部署：

1. 打开仓库 **Settings → Pages → Build and deployment → Source**，选择 **GitHub Actions**
2. 打开 **Actions → Deploy to GitHub Pages → Run workflow**，按需填写：
   - `amap_key`：本次构建使用的高德 JS API Key（可选）
   - `amap_security_code`：对应的高德安全密钥（可选）
3. 密钥回退：手动输入 → 仓库 secrets `AMAP_KEY` / `AMAP_SECURITY_CODE` → 字面量 `dummy`。使用 `dummy` 构建时地图显示降级提示，列表与充电演示仍可使用
4. 工作流固定注入 `VITE_BASE=/ChargingMap/` 与 `VITE_DEMO=true`，构建后把 `dist/index.html` 复制为 `dist/404.html`，因此子路径下硬刷新不会落到 GitHub 的 404 页面

配置真实密钥：**Settings → Secrets and variables → Actions → New repository secret**，名称必须为 `AMAP_KEY` 与 `AMAP_SECURITY_CODE`。配置后重新 Run workflow，地图即点亮。不要把密钥写进仓库文件。

### 自定义域名与根路径

项目站点地址是 `https://<user>.github.io/ChargingMap/`，所以 `VITE_BASE` 为 `/ChargingMap/`。若绑定自定义域名，或发布到用户/组织根站点，则改为根路径：

```bash
VITE_BASE=/ npm run build
```

`VITE_BASE` 必须以 `/` 开头，否则 `scripts/prebuild-check.mjs` 会在构建开始前直接失败。

### 其他托管方式

GitHub Pages 在中国大陆访问可能较慢甚至不稳定。面向国内用户时，可把同一份 `dist/` 部署到 Vercel、Netlify 或 Gitee Pages：这些平台通常使用根路径，保持 `VITE_BASE=/`；若部署在子路径，按平台要求改成对应前缀。构建命令统一为 `npm run build`，产物目录为 `dist`。

## 安全

### 高德密钥与 securityJsCode

高德 JSAPI 2.0 要求页面在加载 SDK 前设置 `window._AMapSecurityConfig.securityJsCode`（实现见 [src/services/amapLoader.js](src/services/amapLoader.js)）。按高德的设计，这个值必须出现在浏览器端，因此 `VITE_AMAP_SECURITY_CODE` 会随构建进入 `dist/assets/*.js`。这是 JSAPI 2.0 的既定机制，不是本项目把密钥硬编码进源码；但它只能降低密钥被直接盗用的风险，不代表密钥可以公开。

仓库历史上的 `dist/` 曾把带密钥的构建产物一并入库，因此建议：

1. 到[高德开放平台控制台](https://console.amap.com/)为该项目**轮换密钥**：删除旧 Key 与 securityJsCode，重新创建一对，旧值一律视为已泄露
2. 为 Key 配置**域名白名单**，只允许实际使用的域名（如 `<user>.github.io`、自定义域名、本地 `localhost` 调试）
3. 设置**日配额与并发上限**，把潜在滥用的影响限制在可控范围
4. 新密钥只放 `.env.local`（已被 `.gitignore` 忽略）或 CI secrets，不要提交到仓库，也不要出现在 README、issue、截图中
5. 若怀疑密钥已泄露，先轮换再排查访问日志

由于 `securityJsCode` 一定会进入前端产物，公开演示站建议单独申请一把低配额 Key，不要与生产环境共用。

### 历史大文件找回（仅存档用途）

v12 移除了仓库根目录 3.75MB 的 `大众学院logo.png`，替换为 4.4KB 的 WebP。只在需要原始设计稿时才从 Git 历史中找回：

```bash
# 1. 找到曾包含该文件的提交
git log --all --full-history -- "大众学院logo.png"

# 2. 把 <sha> 换成删除前的提交号，取出文件
git checkout <sha> -- "大众学院logo.png"
```

找回后请勿再次提交该文件；当前代码引用的是 `src/assets/logo.webp`。

## UI 设计体系

项目使用 TailwindCSS；当前页面规范见 [DESIGN.md](DESIGN.md)：

- **色彩与层级** — 蓝色主操作、中性表面和轻边框；绿色/琥珀/红色仅承担状态语义，不堆叠渐变与发光
- **账户组件** — `AccountPanel` 统一标题、返回、滚动区与固定底栏，`account-card` / `account-group` / `segmented-control` 统一账户内容
- **操作反馈** — `action-primary` / `action-secondary` 区分主次，选择、不可用、处理中均有明确状态
- **弹层与动效** — `PanelShell` / `DialogModal` 统一焦点和忙碌锁；账户浏览可切换顶部导航，嵌套确认及车辆编辑时锁定；支持减少动态效果

## 更新日志

### 上海定位数据支持与 1500 站扩充（2026-10）

- 撤回此前偏离需求的上海/合肥切换、固定上海目的地及隐藏城市筛选，恢复自动定位；按实际位置和地图视野自然发现站点。
- 上海扩大至 1500 个模拟站点，扩展中心城区与郊区的道路覆盖，保留合肥 500 站及旧详情路径。
- 上海详情扩展至 15 个分片，数据数量可分别配置；收藏、搜索、详情和充电订单不依赖任何城市开关。

### 账户与按钮边界优化（2026-10）

- 修复结束确认期间自动充满留下过时按钮的问题，停止后转向拔枪和账单。
- 顶部导航按当前内容高亮，区分顶层切换与账户内部返回。
- 重做账户全部九页，补齐积分、优惠券实际使用、钱包收支、车辆保护、记录明细、通知筛选和帮助搜索。
- 支付/评价异步结果校验原订单身份，失败不扣余额或发积分；详细按钮边界及验证范围见 [INTERACTION_AUDIT.md](INTERACTION_AUDIT.md)。

### v12 质量与交付（2026-10）

- **质量网** — 引入 Vitest（23 个测试文件 / 152 个用例），覆盖筛选、计价、支付结算、地图生命周期、面板编排、可访问性等核心契约；新增 `npm run check:data` 数据校验与 `npm run check:a11y` 按钮可访问名扫描；CI 固定执行 `format:check` 与 `check:a11y` 门禁
- **数据分片** — 详情从 6.2MB 单文件拆为 `public/data/details/part-01..05.json`（每片 100 站），按 stationId 推导分片并做 Promise 级缓存；生成器改为确定性输出，默认 500 站，`--count` / `--seed` 带范围校验，重复运行逐字节一致
- **演示数据开关** — 新增 `VITE_DEMO`，默认空态；开启后从 `src/mocks/userDemo.js` 载入演示记录，站点统一引用 `HF000001`
- **地图运行时** — 抽出 `amapLoader` 统一加载 SDK、插件与 securityJsCode；地图实例生命周期可测试化，脚本或密钥不可用时显示降级面板与配置指引
- **组件合一** — 新增 `PanelShell`、`StarRating`、`ToggleSwitch`、`StationListCard`、`StationListControls` 与 `useStationList` / `useAvailableConnectors`，收敛列表、详情、面板的重复实现
- **可访问性** — 图标按钮补齐可访问名，面板统一 `role="dialog"`、焦点陷阱与 Esc 关闭，Toast 增加 live region；扫描范围内 37 个 icon-only 按钮全部有可访问名
- **资源体积** — 3.75MB PNG Logo 换为 4.4KB WebP，补齐 favicon；详情分片与 vendor 分包后，入口 JS（index + vendor-vue）由 344,533 B 降至 263,495 B（约 -23.5%），dist 总体积 2,575,553 B（约 2.58MB，30 个文件）
- **v12 收口修复** — 品牌/接口筛选真实生效（列表补齐 connectorTypes）；0 元实付、优惠券有效期与满减门槛严格校验，非法/null 价格拒绝结算；面板底部 safe-area 适配；列表卡支持键盘操作、搜索框补可访问名；分享链接真实复制并在剪贴板不可用时降级；CI 增加格式与 a11y 门禁
- **构建与部署** — 支持 `VITE_BASE` 子路径构建，prebuild 校验缺失 key 与非法 base；新增手动触发的 GitHub Pages 工作流（密钥三级回退 + SPA 404 回退）与安全章节

### v11 Bug 修复

- **充电面板关闭导致充电中断** — 移除 ChargingPanel onUnmounted 中的 stopCharging() 调用，充电在后台继续进行
- **功率筛选比较异常** — VehicleFilter range input 添加 .number 修饰符，确保 selectedPower 为数字类型而非字符串
- **通知角标不响应式更新** — Header navItems 从普通数组改为 computed 属性，badge 基于未读数实时计算
- **预约/充电设置只显示快充桩** — availableConnectors 合并 fastConnectors 和 slowConnectors 的可用桩位
- **站点搜索只过滤已分页数据** — 搜索关键词移入 stations store，filteredStations getter 统一处理搜索和筛选，分页基于搜索后的结果
- **钱包提现交易类型语义不正确** — 提现交易类型从 'payment' 改为 'withdraw'，user store 和 WalletPanel 同步支持

### v11 代码优化

- **深色模式 DOM 操作统一** — 移除 userStore 中的 DOM class 操作，统一由 App.vue watch + immediate 管理
- **搜索状态集中管理** — 搜索关键词从组件本地 ref 迁移到 stations store，与筛选条件统一管理

### v10 Bug 修复

- **站点状态判断** — 修复站点列表和站点详情未检查站点维护状态的问题，维护中站点正确显示灰色"维护中"标签
- **支付金额与优惠券一致性** — 修复使用优惠券后，钱包扣款金额与充电记录/钱包交易/支付成功页面显示金额不一致的问题
- **地图资源泄漏** — 修复 MapView 组件卸载时未调用 mapManager.destroy() 和未清理防抖定时器的问题
- **筛选入口缺失** — 修复站点列表中缺少筛选入口按钮的问题
- **通知角标逻辑** — 修复通知中心角标始终显示的问题
- **支付成功页面金额显示** — 修复显示模拟充电费用而非实际支付金额的问题
- **优惠券折扣计算** — 修复百分比折扣券计算逻辑错误
- **钱包退款处理** — 修复 addWalletTransaction 未处理退款类型的问题
- **充电桩选择器初始化** — 修复充电设置和预约面板中充电桩选择器在异步数据加载后不更新的问题
- **Logo 回首页** — 修复点击 Header Logo 无响应的问题
- **筛选面板功率类型** — 修复 VehicleFilter 中 selectedPower 为字符串类型导致筛选比较异常的问题
- **充电站列表与详情数据一致性** — 修复数据层、UI层、筛选器层三个层面的前后不一致问题

### v10 代码优化

- **Store 导出优化** — store/index.js 统一导出所有 Store 模块
- **收藏数据去重** — 移除 user.js 中与 stations store 重复的收藏数据和方法
- **钱包交易类型简化** — 将 addWalletTransaction 中重复的 if-else 分支合并为 includes 检查
- **地图资源管理** — mapService.js 新增 \_clearDirectMarkers() 和 destroy() 方法
- **筛选面板集成** — 将 VehicleFilter 组件集成到站点列表中
- **数据生成脚本** — 修复评论日期硬编码年份问题

## 注意事项

- 这是演示项目，站点、电价、枪位、充电和交易均为模拟；不作为实际出行或收费依据
- 高德地图 API Key 和安全密钥通过 `.env.local` 环境变量配置，切勿硬编码到代码或提交到仓库
- `public/data` 是默认加载的生成站点；没有真实找站与沙盒模式切换
- 接枪提醒与检测效果用于表达符合常识的操作顺序，不代表真实设备检测
- 本地数据不是可信服务端账本，清理浏览器会丢失，也不能跨设备同步；不应存储敏感资料
- 项目当前为单页应用，所有功能在一个页面内通过面板切换实现
