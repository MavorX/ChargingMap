// Domain errors stay canonical in stores and persisted sessions. Translate
// where displayed so a saved failure also follows the selected language.
export const errors = {
  '预约正在提交，请勿重复操作': 'Your booking is being submitted. Please wait.',
  '真实地点未接入运营商预约，不能锁定真实枪位':
    'Real charger bookings are not supported. Only demo stations can be booked.',
  '预约时段已失效，请重新选择日期和时间':
    'This time slot is no longer available. Choose a new date and time.',
  请完善有效的预约信息: 'Complete the required booking details.',
  '所选预约充电桩已不可用，请重新选择':
    'This booking connector is no longer available. Choose another one.',
  '站点电价无效，暂不可预约':
    'The station rate is unavailable. Booking is not available right now.',
  '预计充电量不能超过车辆电池容量，请调整充电量':
    'The requested energy exceeds the vehicle battery capacity. Reduce the amount.',
  '预约站点已变化，请返回重新选择': 'The booking station has changed. Go back and select it again.',
  '仅获取到 IP 估算位置，未作为当前位置使用；请开启系统位置服务后重试':
    'Only an IP-based estimate was available, so it was not used. Enable system location services and try again.',
  '定位服务返回了无效坐标，请重试':
    'The location service returned invalid coordinates. Please try again.',
  地图未初始化: 'The map is not ready yet.',
  '定位超时，请检查系统位置服务或网络后重试':
    'Location timed out. Check system location services and your connection, then try again.',
  定位请求已取消: 'Location request cancelled',
  '定位需要 HTTPS 或 localhost，请不要使用普通 HTTP 局域网地址':
    'Location requires HTTPS or localhost. An HTTP address on your local network is not supported.',
  '当前浏览器没有提供设备定位，请在支持定位的普通浏览器中打开':
    'This browser does not support device location. Open the app in a standard browser.',
  '定位权限被拒绝，请允许浏览器与系统位置访问；内嵌预览无法授权时请在普通浏览器打开':
    'Location permission was denied. Allow access in your browser and system settings. If an embedded preview cannot request access, open the app in a standard browser.',
  '定位插件加载失败，请重试': 'The location service could not load. Please try again.',
  '定位权限被拒绝，请检查浏览器和系统位置访问；内嵌预览无法授权时请在普通浏览器打开':
    'Location permission was denied. Check browser and system permissions, or open the app in a standard browser instead of an embedded preview.',
  '未能获取设备位置，请检查系统位置服务或网络后重试；不会改用 IP 城市冒充当前位置':
    'Could not locate your device. Check location services and your connection. An IP-based city estimate will not be used as your location.',
  '设备坐标未转换为地图坐标，请重试':
    'The device location could not be converted for the map. Please try again.',
  '设备坐标转换失败，未移动地图，请重试':
    'Location conversion failed. The map was not moved. Please try again.',
  未找到可行路线: 'No driving route found',
  路线规划失败: 'Could not plan a route',
  '安全密钥无效，路线规划服务不可用':
    'Route planning is unavailable because the map security key is invalid.',
  '路线规划失败：{error}': 'Route planning failed: {error}',
  '导航服务初始化失败：{error}': 'Navigation could not start: {error}',
  定位失败: 'Location failed',
  未使用地图中心作为导航起点: 'The map center was not used as your starting point.',
  '高德地图加载超时（10 秒），请检查网络后重试':
    'AMap timed out after 10 seconds. Check your connection and try again.',
  '高德地图 SDK 初始化失败，请检查 VITE_AMAP_KEY 是否有效':
    'AMap could not start. Check that VITE_AMAP_KEY is valid.',
  '高德地图脚本加载失败，请检查网络或 VITE_AMAP_KEY 配置':
    'AMap could not load. Check your connection and VITE_AMAP_KEY.',
  '缺少 VITE_AMAP_KEY：请在 .env.local 中配置高德地图 Key 后重新加载':
    'Missing VITE_AMAP_KEY. Add an AMap key to .env.local, then reload.',
  站点列表加载失败: 'Could not load the station list',
  '测试枪未连接，设备拒绝启动': 'The connector is not plugged in. Charging cannot start.',
  '测试设备离线，无法读取状态': 'The demo charger is offline. Its status is unavailable.',
  测试枪已被其他会话占用: 'This connector is already in use by another session.',
  '设备尚未确认停止，禁止拔枪；请先请求停止并等待应答':
    'Do not unplug. Request a stop and wait for the charger to confirm.',
  '测试设备拒绝启动，尚未送电，不会开始计费':
    'The demo charger could not start. No power was delivered and no cost was added.',
  '停止应答丢失（模拟）：设备尚未确认停止，请重试，切勿强行拔枪':
    'Demo stop confirmation was lost. Try stopping again and do not force the connector out.',
  '真实地点未接入运营商设备控制，不能由本网页启动充电':
    'This page cannot start a real charger. Only demo stations are supported.',
  所选测试枪不可用: 'The selected demo connector is unavailable.',
  '请选择车辆；不能凭空假定车型和电池容量':
    'Select a vehicle with a known model and battery capacity.',
  '车辆接口与充电枪不匹配，请选择兼容接口':
    'The vehicle and charger connectors do not match. Choose a compatible charger.',
  '请填写车辆可用电池容量（1–200 kWh）': 'Enter the usable battery capacity (1–200 kWh).',
  '请填写车内仪表当前电量（0–99%）；网页无法直接读取车辆电量':
    'Enter your current battery level (0–99%) from the dashboard. This page cannot read it from your vehicle.',
  '目标电量必须大于当前电量且不超过 100%':
    'The target must exceed the current charge and be no more than 100%.',
  充电枪和车辆的功率上限必须明确: 'Set the power limits for both the vehicle and charger.',
  '测试费率未知，不能估算或启动计费': 'The demo rate is unknown. Charging cannot start.',
  '仅支持标注的 1× 或 60× 沙盒时间倍率': 'Choose either real time (1×) or 60× demo speed.',
  请先处理当前测试会话: 'Finish the current demo session first.',
  '请先拔出原测试枪，再更换准备单': 'Unplug the previous connector before changing the setup.',
  未知测试工况: 'Unknown demo condition',
  请先准备一个测试会话: 'Set up a charging session first.',
  当前不能识别充电枪: 'The connector cannot be identified right now.',
  '枪码不匹配，请核对车位旁实际连接的那一把枪；不会自动切换到其他枪':
    'The connector does not match. Check the one at your parking bay; it will not be switched automatically.',
  '必须先连接测试枪，并核对对应枪码': 'Plug in and verify the selected connector first.',
  '连接流程已取消，请重新连接': 'The connection process was cancelled. Please reconnect.',
  '站点已变化，请返回重新生成测试准备单':
    'The station has changed. Go back and set up charging again.',
  '车辆规格、测试枪或费率已变化，请重新准备':
    'Vehicle specs, the connector or the rate have changed. Set up charging again.',
  请先结算上一笔测试订单: 'Complete checkout for your previous session first.',
  '设备尚未就绪：选择站点或勾选接枪不能直接开始充电':
    'The charger is not ready. Complete the connection checks before charging.',
  未收到有效的设备启动确认: 'No valid start confirmation was received.',
  设备未确认停止: 'The charger has not confirmed it has stopped.',
  '尚未确认停止，禁止拔枪': 'Do not unplug until the charger confirms it has stopped.',
  '连接已中断，本次演示已停止，可查看已记录的账单。':
    'The connection was interrupted and the demo stopped. You can view the recorded bill.',
  '设备命令处理中，请等待应答': 'The charger is processing a request. Please wait.',
  '页面曾关闭，演示已暂停。已恢复上次保存的进度，可结束本次演示并查看账单。':
    'The page was closed, so the demo paused. Saved progress has been restored. Finish the session to view your bill.',
  请先结束充电再结算: 'Stop charging before checkout.',
  请先完成拔枪或处理中断的测试会话: 'Unplug or finish the interrupted demo session first.',
  '没有设备已结束并完成拔枪的测试订单，不能从选中站点直接生成支付':
    'No completed, unplugged session is available for checkout. Selecting a station does not create a bill.',
  '测试计量数据无效，不能结算': 'The demo meter data is invalid. Checkout is unavailable.',
  当前没有可结算的充电站点: 'No charging session is available for checkout.',
  优惠券不存在或已使用: 'This coupon is missing or has already been used.',
  优惠券已过期或未满足使用条件: 'This coupon has expired or is not eligible for this order.',
  请选择有效的支付方式: 'Choose a valid payment method.',
  未登记车型: 'Vehicle not recorded',
  '昵称需为 1–24 个字符': 'Your display name must contain 1–24 characters.',
  交易信息无效: 'Invalid transaction details',
  '金额应为 0.01–100000 元，最多两位小数': 'Enter ¥0.01–100,000 with up to 2 decimal places.',
  交易金额方向无效: 'Invalid transaction amount for this transaction type.',
  钱包余额不足: 'Insufficient wallet balance',
  '请选择站点、充电桩和车辆': 'Choose a station, charger and vehicle.',
  '预约时间无效或已开始，请重新选择':
    'This booking time is invalid or has already started. Choose another time.',
  '该时段不可预约，请重新选择': 'This time slot is unavailable. Choose another one.'
}
