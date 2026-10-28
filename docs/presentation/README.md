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

**直接基于用户提供的 `VCTC Template_Rise Up.potx` 生成，不再只借用主题色。**使用原始封面、白底正文、深底正文和结束页四种版式，保留右上角公司字标、左下角“驭势而上 / RISE UP”、封面/结束页曲线背景及模板页脚位置。各页使用模板对应的深/浅色 Logo 原图和原始尺寸、位置。

不上传模板原件、模板手册、企业字体或环境密钥；交付 PPT 中保留实际使用的公司母版、版式和标识，这是正常的模板继承，不是将整份 73 页模板（含手册与示例）打包进演示文稿。

## 编辑与来源

- 标题、正文、卡片与流程图为可编辑对象；界面和分布图为图片。
- 保留模板主题与字体绑定：英文使用模板的 The Group HEAD Light / The Group TEXT，中文使用 Microsoft YaHei；不嵌入或分发企业字体。未安装企业字体时查看器会使用回退字体，其他系统需重新检查换行；Logo 为原始图形，不依赖字体安装。
- 标题及英文副标题使用模板原始占位区域；正文避开右上与左下标识区，页脚更新为项目标题、日期和页码，不冒用模板的示例部门或分类。
- `assets/` 为**正式演示素材**，不是调试截图；采自本轮本地真实高德 SDK + 模拟业务，保留地图版权。分布图直接根据仓库上海坐标与近似道路绘制，不是真实 POI。
- `live-review.json` 记录本轮 42 个状态及主题请求验证；测试数字和边界见 [TEST_REPORT.md](../../TEST_REPORT.md)。
- 在线演示可能仍运行旧部署；PPT 截图与测试不等于线上版本已更新。

## 重新生成 PPT

从仓库根目录执行，Python 3.10+。需将公司提供的原始模板放在 `docs/presentation/VCTC Template_Rise Up.potx`，或用 `--template` 指定本地路径；模板原件不随 Git 提交。

```bash
python -m pip install -r scripts/requirements-presentation.txt
python scripts/build-presentation.py

# 使用其他本地路径的原始模板
python scripts/build-presentation.py --template /path/to/VCTC-template.potx

# 可选：使用本机 LibreOffice 导出 PDF，并生成逐页 PNG 与总览
python scripts/build-presentation.py --render-soffice /path/to/soffice --preview-dir /path/to/temporary/previews
```

脚本要求原始公司模板存在，不会悄悄退回无 Logo 的空白模板，也不读取 `.env`。只在内存中将 POTX 转为可编辑演示，保留四种已用版式及其母版，清理示例页、手册版式、旧占位文案和无关插件/OLE 数据；不修改原始模板。

每次生成都自动验证 **10 页、20 处原始标识实例**：Logo 资源哈希、位置和尺寸必须与原模板相同，正文不得覆盖标识区域。带渲染参数时还生成 PDF 和 `ChargingMap_Preview.png`，并检查 PDF 的 20 处标识区域确实有可见内容。逐页 PNG 请输出到临时目录，避免误提交调试产物。测试数写在生成脚本的质量页与备注中，测试变化后应同步更新。

### 模板回归检查

```bash
python scripts/test_presentation_template.py
```

8 项检查覆盖真实版式/双标识继承、Logo 缺失/移动/图像变更、正文遮挡、手册与 OLE 清理、原始模板不被修改，以及缺失原件时拒绝生成。自定义模板路径可设置 `CHARGINGMAP_TEMPLATE`。这些是文稿检查，不会重新采集界面，也不把历史应用测试当作本次重新运行。

## 重新采集真实界面

1. 在本地配置有效高德 JSAPI key/security code，启动**根路径** Vite 开发服务器；演示样例可设置 `VITE_DEMO=true`。
2. 安装 Playwright Chromium（`npx playwright install chromium`），或通过 `BROWSER_EXECUTABLE` 指向已安装的 Edge。
3. 运行：

```bash
node scripts/capture-presentation.mjs http://127.0.0.1:5177/ /path/to/temporary/captures
```

脚本显式设置上海测试相机，不冒充设备定位；测量实际 SDK 的明暗切换、保留节点与请求数，并检查面板标题和横向溢出。它不是生产控桩、GPS 或驾车 API 验收，也不在 CI 中自动连接外部地图服务。

确认截图正确后，按 `build-presentation.py` 的素材清单复制到 `assets/`，更新 `live-review.json`，再生成 PPT/PDF。抓取输出、请求日志、浏览器 profile 与临时失败截图留在临时目录，不提交密钥或原始公司模板。
