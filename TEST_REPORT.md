# 充电桩地图图标显示问题 - 测试与修复文档

## 版本: v10-final
## 日期: 2026-04-12

---

## 一、问题概述

地图中无法显示充电桩图标，充电站标记和聚合功能完全失效。

---

## 二、详细代码分析 - 发现的错误

### 错误 #1: 数据文件缺失（致命 - P0）

**位置**: `data/station_list.json` 和 `data/station_details.json`
**现象**: 代码通过 `fetch('./data/station_list.json')` 和 `fetch('./data/station_details.json')` 加载数据，但项目中完全不存在 `data/` 目录和这两个JSON文件。
**影响**: `loadStationsData()` 函数抛出异常，`stations` 数组永远为空，地图上不会有任何标记。
**修复**: 创建 `public/data/station_list.json`（15个充电站数据）和 `public/data/station_details.json`（充电站详情数据）。

---

### 错误 #2: AMap.Icon 使用了不存在的 `content` 属性（致命 - P0）

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

---

### 错误 #3: MarkerCluster API 版本不兼容（致命 - P0）

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

---

### 错误 #4: computed 属性直接赋值（中等 - P1）

**位置**: `src/views/HomeView.vue`
**原代码**: `@close="currentStation = null"` - `currentStation` 是 computed 属性，不能直接赋值
**修复**: 创建 `closeStationDetail()` 方法，调用 `stationsStore.setCurrentStation(null)`

---

### 错误 #5: 插件名称兼容性问题（中等 - P1）

**位置**: `index.html` script标签
**原代码**: `plugin=AMap.MarkerCluster`
**分析**: AMap 2.0 中聚合插件名称可能是 `AMap.MarkerCluster` 或 `AMap.MarkerClusterer`，不同版本有差异
**修复**: 同时加载两个插件名 `plugin=AMap.MarkerCluster,AMap.MarkerClusterer`，代码中使用 `AMap.MarkerCluster || AMap.MarkerClusterer` 兼容

---

## 三、修复版本记录

### v10-final-fix-1: 初始修复
- 创建数据文件 `public/data/station_list.json` 和 `public/data/station_details.json`
- 修复 `AMap.Icon` 的 `content` 属性错误，改为 `AMap.Marker.content`
- 添加 MarkerCluster 插件名称兼容性处理

### v10-final-fix-2: MarkerCluster API 重写
- 完全重写 `mapService.js` 的 `updateMarkers()` 方法
- 改用 AMap 2.0 的数据驱动方式：`{lnglat, weight, station}` 格式
- 添加 `renderMarker` 回调自定义非聚合点样式
- 修复 `renderClusterMarker` 中 `context.markers` → `context.data`
- 添加 fallback 机制：当 MarkerCluster 不可用时直接添加标记到地图

### v10-final-fix-3: 组件修复
- 创建缺失的 Vue 组件（StationDetail, ReservationPanel, ChargingPanel 等10个组件）
- 修复 `HomeView.vue` 中 computed 属性赋值问题
- 优化 MapView.vue 的地图初始化逻辑

---

## 四、测试结果

### 测试环境
- 服务器: Vite dev server (http://localhost:3000/)
- 浏览器: Chrome
- 高德地图版本: 2.0

### 测试项目

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

---

## 五、关键代码变更摘要

### mapService.js - 核心修复

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

---

## 六、数据文件说明

### station_list.json
包含15个充电站的基础信息，分布在合肥市各区：
- 蜀山区: 5个站 (S001, S002, S003, S005, S014)
- 包河区: 3个站 (S004, S007, S008)
- 蜀山区/高新区: 2个站 (S009, S013)
- 瑶海区: 1个站 (S010)
- 庐阳区: 1个站 (S011)
- 经开区: 1个站 (S012)
- 蜀山区: 1个站 (S006)
- 其他: 1个站 (S015)

### station_details.json
包含每个充电站的详细信息：
- 分时电价（8个时段）
- 充电桩列表（含功率、接口类型、状态）
- 用户评价
- 站点指引
