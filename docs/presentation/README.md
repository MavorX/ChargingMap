# ChargingMap 中英双语项目介绍

- **[PowerPoint：ChargingMap_Project_Overview_ZH-EN.pptx](ChargingMap_Project_Overview_ZH-EN.pptx)**
- [PDF 阅读版](ChargingMap_Project_Overview_ZH-EN.pdf)
- [10 页总览预览](ChargingMap_Preview.png)

16:9，10 页，同页中文 + English。少文字，截图、坐标分布、原生流程图和数据卡为主；技术依据与测试限制放在每页讲稿备注中。

## 内容

1. 项目封面 / A connected charging journey
2. 完整体验 / Discover → connect → complete
3. 设计模拟数据 / Road-guided, demand-driven synthetic data
4. 可复现与分片 / Seed, deterministic output & lazy detail
5. 双色地图 / Two themes, one map, no style reload
6. 搜索筛选联动 / Map, list & filters in sync
7. 充电顺序 / Select → plug → check → stop → unplug → checkout
8. 双语与响应式 / Bilingual, light/dark, desktop/mobile
9. 质量验证 / Tests, data contracts & dependency audit
10. 在线演示 / Try the demo

沿用品牌绿 `#008C82`、深色 `#002733`、荧光强调 `#C2FE06`。未打包公司原始 `.potx`、模板手册、企业字体或环境密钥。

## 编辑与来源

- 标题、正文、卡片与流程图为可编辑对象；界面和分布图为图片。
- 使用系统字体 Microsoft YaHei / Segoe UI，未嵌入或分发字体；其他系统若字体替换，需重新检查换行。
- `assets/` 为**正式演示素材**，不是调试截图；采自本轮本地真实高德 SDK + 模拟业务，保留地图版权。分布图直接根据仓库上海坐标与近似道路绘制，不是真实 POI。
- `live-review.json` 记录本轮 42 个状态及主题请求验证；测试数字和边界见 [TEST_REPORT.md](../../TEST_REPORT.md)。
- 在线演示可能仍运行旧部署；PPT 截图与测试不等于线上版本已更新。

## 重新生成 PPT

从仓库根目录执行，Python 3.10+：

```bash
python -m pip install -r scripts/requirements-presentation.txt
python scripts/build-presentation.py

# 可选：使用本机 LibreOffice 导出 PDF，并生成逐页 PNG 与总览
python scripts/build-presentation.py --render-soffice /path/to/soffice --preview-dir /path/to/temporary/previews
```

脚本不依赖公司模板，也不读取 `.env`。运行后写入当前目录中的 PPTX；带渲染参数时还生成 PDF 和 `ChargingMap_Preview.png`。逐页 PNG 请输出到临时目录，避免误提交全部调试产物。测试数写在生成脚本的质量页与备注中，测试变化后应同时更新，避免引用过期指标。

## 重新采集真实界面

1. 在本地配置有效高德 JSAPI key/security code，启动**根路径** Vite 开发服务器；演示样例可设置 `VITE_DEMO=true`。
2. 安装 Playwright Chromium（`npx playwright install chromium`），或通过 `BROWSER_EXECUTABLE` 指向已安装的 Edge。
3. 运行：

```bash
node scripts/capture-presentation.mjs http://127.0.0.1:5177/ /path/to/temporary/captures
```

脚本显式设置上海测试相机，不冒充设备定位；测量实际 SDK 的明暗切换、保留节点与请求数，并检查面板标题和横向溢出。它不是生产控桩、GPS 或驾车 API 验收，也不在 CI 中自动连接外部地图服务。

确认截图正确后，按 `build-presentation.py` 的素材清单复制到 `assets/`，更新 `live-review.json`，再生成 PPT/PDF。抓取输出、请求日志、浏览器 profile 与临时失败截图留在临时目录，不提交密钥或原始公司模板。
