# ChargingMap 测试报告

## 当前版本：v12（2026-10-21）

本报告只记录**本次实际执行**的验证。任何没有真正运行过的项目都会明确标注“未执行”及原因，不把计划、推演或历史结论当作当前结果。

### 验证边界（先读）

- **未打开任何浏览器**：本次任务受用户明令约束，禁止启动浏览器 / Playwright / dev server / preview / 截图。因此 `npm run preview` 冒烟、390×844 手机视口截图、键盘走查均**未执行**（详见第四节）。
- **无真实高德 key**：本地 `.env.local` 仅含占位值。地图加载、图标视觉、聚合外观、信息窗口点击等依赖真实 JSAPI 的项目标注为“待真实 key 验证（步骤见 README「高德地图配置」与「部署」）”。
- 自动化命令执行环境：Windows + PowerShell 5.1，Node v22.23.2，npm 10.9.8，源码 HEAD `02eeae3`（后续 `2d4a6b7` 仅新增部署工作流，不改变应用源码）。

---

## 一、自动化命令结果（实际运行）

| 命令 | 退出码 | 关键输出 |
| --- | --- | --- |
| `npm run lint` | **0** | ESLint 无告警、无错误（无输出即通过） |
| `npm run test -- --run` | **0** | `Test Files 21 passed (21)`；`Tests 137 passed (137)`；Duration 5.86s |
| `npm run check:data` | **0** | `data layout: sharded (5 files); list=500 stations, details=500 entries`；`[OK] 500 stations, 8 assertions passed` |
| `npm run build` | **0** | 86 modules transformed；built in 1.85s；dist 30 个文件、合计 **2,556,782 B** |
| `npm run check:a11y`（附加） | **0** | `37 icon-only button(s) scanned across 109 buttons, all have an accessible name` |

原始输出保存在 `.omo/evidence/task-30-lint2.log`、`task-30-vitest.log`、`task-30-check-data.log`、`task-30-build.log`、`task-30-a11y.log`。

### 构建产物要点（v12）

| 文件 | 字节 | 说明 |
| --- | --- | --- |
| `assets/index-C0aqKA8Y.js` | 158,509 | 应用入口 chunk（gzip 40.28 kB） |
| `assets/vendor-vue-DG3S4Wqb.js` | 103,784 | Vue / Pinia / Router vendor chunk（gzip 40.59 kB） |
| `assets/index-BmcZBf8u.css` | 175,373 | 主样式（gzip 42.12 kB） |
| `assets/logo-C9KChHPi.webp` | 4,386 | 品牌 Logo（原 PNG 3,929,078 B） |
| `data/station_list.json` | 246,499 | 500 站列表 |
| `data/details/part-01..05.json` | 301,767–313,867 / 片 | 详情分片，每片 100 站 |
| **dist 合计** | **2,556,782** | 30 个文件 |

---

## 二、体积对照（T1 基线 → v12）

| 指标 | 基线（T1，`d75c2d5`） | v12（当前） | 变化 |
| --- | --- | --- | --- |
| `station_list.json` | 986,523 B | 246,499 B | **-75.0%** |
| 详情数据 | 6,217,664 B（单文件） | 1,533,753 B（5 分片，单片 ≤ 313,867 B） | **-75.3%** |
| 入口 JS（index + vendor） | 344,533 B | 262,293 B（158,509 + 103,784） | **-23.9%** |
| 主 CSS | 173,007 B | 175,373 B | +1.4%（新增 a11y/面板样式） |
| Logo 资产 | 3,929,078 B（PNG） | 4,386 B（WebP） | **-99.9%** |
| dist 总体积 | 11,895,688 B（9 文件） | 2,556,782 B（30 文件） | **-78.5%** |

数据体积下降来自“500 站 + 详情分片 + 精简字段”，入口 JS 下降来自 vendor 分包与组件按需加载；CSS 略增属于可接受范围。

---

## 三、原 10 项手动用例逐项映射

历史用例见附录 A（v10-final，15 站时代）。下表把它们映射到 v12 的可执行证据或明确的待验证项。

| # | 原用例 | v12 验证方式 | 结论 |
| --- | --- | --- | --- |
| 1 | 地图加载（合肥区域） | 需真实高德 key + 浏览器 | **待真实 key 验证**（步骤见 README）；浏览器未执行 |
| 2 | 数据加载（原 15 站） | `npm run check:data`：500 站 / 500 详情 / 8 项断言 | **通过**（数据层） |
| 3 | 充电桩 SVG 图标显示 | `src/__tests__/map-markers.spec.js` 校验标记渲染契约；视觉呈现需浏览器 | 逻辑层**通过**；视觉**未执行**（用户禁止打开网页） |
| 4 | 图标颜色区分（绿/黄/红/灰） | `map-markers.spec.js` 覆盖状态到颜色的映射；实际像素需浏览器 | 逻辑层**通过**；视觉**未执行** |
| 5 | 聚合功能 | `map-markers.spec.js` 覆盖聚合数据与降级路径 | 逻辑层**通过**；浏览器**未执行** |
| 6 | 聚合颜色 | 同上（聚合可用数 → 颜色计算） | 逻辑层**通过**；浏览器**未执行** |
| 7 | 信息窗口 | `src/__tests__/map-info-window.spec.js`：单实例复用、内容与关闭行为 | **通过**（逻辑层） |
| 8 | 点击标记打开详情 | `src/__tests__/panel-orchestration.spec.js`：activePanel 单源编排 | **通过**（逻辑层） |
| 9 | 站点列表打开/分页 | `station-list-card`、`panel-shell`、`viewport-debounce` 等用例 | **通过**（逻辑层） |
| 10 | 编译无错误 | `npm run build` 退出码 0，86 modules | **通过** |

---

## 四、未执行的验证（如实记录）

| 项目 | 状态 | 原因 / 替代证据 |
| --- | --- | --- |
| `npm run preview` 冒烟（HTTP 200、首屏传输体积） | **未执行** | 用户明令禁止打开网页验证；构建产物与 `check:data` 已覆盖静态完整性 |
| 390×844 手机视口截图 / 视觉比对 | **未执行** | 同上；移动端断点逻辑由 `viewport-debounce.spec.js` 单测覆盖，但不等于视觉验收 |
| 键盘走查（Tab 顺序、Esc、焦点陷阱、焦点可见） | **未执行** | 同上；`panel-shell.spec.js` 与 `toast-a11y.spec.js` 仅验证属性/行为契约，不替代真实键盘操作 |
| Lighthouse（LCP/TBT） | **未执行** | 需要浏览器；非本计划门槛 |
| 真实高德 key 下的地图、定位、导航 | **待真实 key 验证** | 本地仅有 dummy key；操作步骤见 README「高德地图配置」「部署」 |
| iOS Safari 真机安全区 | **未验证** | 见下节 |

---

## 五、待真机验证项（继承 T26）

- **(P2, 未验证) iOS Safari 刘海机型底部安全区**：桌面 Chromium 中 `env(safe-area-inset-bottom)` 恒为 `0px`，本地无法验证实际留白。需真机确认：①主 CTA「查看站点列表」、②站点列表底部「加载更多」、③导航中 NavigationBar 按钮组，均与 home 指示条留有间距且不被误触/遮挡；④地址栏收起/展开时页面高度随 `100dvh` 平滑变化、底部无裁切。验证通过前不得视为已通过。详见 `.omo/evidence/task-26-optimize-chargingmap.md` §6。

---

## 附录 A：v10-final 历史记录（2026-04-12，已过时）

> 以下为 v10 时期的原始记录，保留用于追溯。其中的“15 个站点”“Chrome 实测通过”等结论仅代表当时状态，**不构成本次 v12 的验证结果**；v12 的数据规模、组件结构与测试方式均已变化。

### 版本: v10-final
### 日期: 2026-04-12

#### 一、问题概述

地图中无法显示充电桩图标，充电站标记和聚合功能完全失效。

#### 二、详细代码分析 - 发现的错误

##### 错误 #1: 数据文件缺失（致命 - P0）

**位置**: `data/station_list.json` 和 `data/station_details.json`
**现象**: 代码通过 `fetch('./data/station_list.json')` 和 `fetch('./data/station_details.json')` 加载数据，但项目中完全不存在 `data/` 目录和这两个JSON文件。
**影响**: `loadStationsData()` 函数抛出异常，`stations` 数组永远为空，地图上不会有任何标记。
**修复**: 创建 `public/data/station_list.json`（15个充电站数据）和 `public/data/station_details.json`（充电站详情数据）。

##### 错误 #2: AMap.Icon 使用了不存在的 `content` 属性（致命 - P0）

**位置**: `src/services/mapService.js` - `createStationMarker()` 方法
**原代码**:
```javascript
const icon = new AMap.Icon({
  size: new AMap.Size(40, 48),
  content: svgContent,  // ❌ AMap.Icon 不支持 content 属性
  imageSize: new AMap.Size(40, 48)
});
return new AMap.Marker({
  position: [station.lng, station.lat],
  icon: icon,  // 使用了无效的icon
  offset: new AMap.Pixel(-20, -48),
  ...
});
```
**分析**: 高德地图2.0的 `AMap.Icon` 只支持 `image`（图片URL）、`size`、`imageSize`、`imageOffset` 属性，**不支持 `content`**。SVG内容应该直接作为 `AMap.Marker` 的 `content` 属性。
**修复**: 改为 `new AMap.Marker({ content: svgContent, ... })`

##### 错误 #3: MarkerCluster API 版本不兼容（致命 - P0）

**位置**: `src/services/mapService.js` - `createCluster()` 方法
**原代码问题**:
1. 传递 `AMap.Marker` 实例数组给 `MarkerCluster`，但 AMap 2.0 需要数据对象数组 `{lnglat: [lng, lat], weight: 1}`
2. 使用 `context.markers`（AMap 1.x API），但 AMap 2.0 使用 `context.data`
3. 缺少 `renderMarker` 回调（AMap 2.0 新增，用于自定义非聚合点样式）

**AMap 2.0 MarkerCluster 正确用法**:
```javascript
new AMap.MarkerCluster(map, points, {
  gridSize: 50,
  renderMarker: (context) => {
    // 自定义非聚合点样式 - 设置SVG图标
    const station = context.data[0].station;
    context.marker.setContent(svgContent);
    context.marker.setOffset(new AMap.Pixel(-20, -48));
  },
  renderClusterMarker: (context) => {
    // 自定义聚合点样式 - 显示数量
    const count = context.count;
    context.marker.setContent(div);
  }
});
```

**修复**: 完全重写 `updateMarkers()` 方法，使用 AMap 2.0 的数据驱动方式。

##### 错误 #4: computed 属性直接赋值（中等 - P1）

**位置**: `src/views/HomeView.vue`
**原代码**: `@close="currentStation = null"` - `currentStation` 是 computed 属性，不能直接赋值
**修复**: 创建 `closeStationDetail()` 方法，调用 `stationsStore.setCurrentStation(null)`

##### 错误 #5: 插件名称兼容性问题（中等 - P1）

**位置**: `index.html` script标签
**原代码**: `plugin=AMap.MarkerCluster`
**分析**: AMap 2.0 中聚合插件名称可能是 `AMap.MarkerCluster` 或 `AMap.MarkerClusterer`，不同版本有差异
**修复**: 同时加载两个插件名 `plugin=AMap.MarkerCluster,AMap.MarkerClusterer`，代码中使用 `AMap.MarkerCluster || AMap.MarkerClusterer` 兼容

#### 三、修复版本记录

##### v10-final-fix-1: 初始修复
- 创建数据文件 `public/data/station_list.json` 和 `public/data/station_details.json`
- 修复 `AMap.Icon` 的 `content` 属性错误，改为 `AMap.Marker.content`
- 添加 MarkerCluster 插件名称兼容性处理

##### v10-final-fix-2: MarkerCluster API 重写
- 完全重写 `mapService.js` 的 `updateMarkers()` 方法
- 改用 AMap 2.0 的数据驱动方式：`{lnglat, weight, station}` 格式
- 添加 `renderMarker` 回调自定义非聚合点样式
- 修复 `renderClusterMarker` 中 `context.markers` → `context.data`
- 添加 fallback 机制：当 MarkerCluster 不可用时直接添加标记到地图

##### v10-final-fix-3: 组件修复
- 创建缺失的 Vue 组件（StationDetail, ReservationPanel, ChargingPanel 等10个组件）
- 修复 `HomeView.vue` 中 computed 属性赋值问题
- 优化 MapView.vue 的地图初始化逻辑

#### 四、测试结果

##### 测试环境
- 服务器: Vite dev server (http://localhost:3000/)
- 浏览器: Chrome
- 高德地图版本: 2.0

##### 测试项目

| 测试项 | 预期结果 | 实际结果 | 状态 |
|--------|----------|----------|------|
| 地图加载 | 显示合肥区域地图 | 地图正常显示 | ✅ |
| 数据加载 | 15个充电站数据加载 | 数据正常加载 | ✅ |
| 充电桩图标显示 | 显示SVG充电桩标记 | 标记正常显示 | ✅ |
| 图标颜色区分 | 绿/黄/红/灰四种颜色 | 颜色正确区分 | ✅ |
| 聚合功能 | 缩小时聚合显示数量 | 聚合正常工作 | ✅ |
| 聚合颜色 | 聚合点根据可用数量变色 | 颜色正确 | ✅ |
| 信息窗口 | 鼠标悬停显示详情 | 窗口正常弹出 | ✅ |
| 点击事件 | 点击标记打开详情面板 | 事件正常触发 | ✅ |
| 站点列表 | 底部按钮打开列表 | 列表正常显示 | ✅ |
| 编译无错误 | Vite编译无错误 | 无编译错误 | ✅ |

#### 五、关键代码变更摘要

##### mapService.js - 核心修复

**变更前**: 创建 AMap.Marker 实例 → 传给 MarkerCluster（AMap 1.x 方式）
**变更后**: 创建数据对象 `{lnglat, weight, station}` → 传给 MarkerCluster（AMap 2.0 方式）

**renderMarker 回调** (新增):
- 从 `context.data[0].station` 获取站点数据
- 使用 `context.marker.setContent(svgContent)` 设置SVG图标
- 绑定 mouseover/mouseout/click 事件

**renderClusterMarker 回调** (修复):
- 从 `context.data` 遍历获取站点数据（原 `context.markers`）
- 计算聚合内总可用数和总充电桩数
- 动态设置聚合点大小和颜色

#### 六、数据文件说明

##### station_list.json
包含15个充电站的基础信息，分布在合肥市各区：
- 蜀山区: 5个站 (S001, S002, S003, S005, S014)
- 包河区: 3个站 (S004, S007, S008)
- 蜀山区/高新区: 2个站 (S009, S013)
- 瑶海区: 1个站 (S010)
- 庐阳区: 1个站 (S011)
- 经开区: 1个站 (S012)
- 蜀山区: 1个站 (S006)
- 其他: 1个站 (S015)

##### station_details.json
包含每个充电站的详细信息：
- 分时电价（8个时段）
- 充电桩列表（含功率、接口类型、状态）
- 用户评价
- 站点指引

---

## 附录 B：v11 变更索引（无独立测试报告）

v11 的修复项记录在 README「更新日志 → v11 Bug 修复 / v11 代码优化」，本报告不再重复。当前 v12 的 137 个用例覆盖了其中可回归的部分（充电后台继续、功率筛选、通知角标、可用桩合并、搜索范围、钱包交易类型）。
