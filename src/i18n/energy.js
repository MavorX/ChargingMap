export const energy = {
  '定位后可按距离推荐；暂不估算行车时间。':
    'Enable location for nearest-first ranking. Driving time is not estimated.',
  '地图范围不可用：分析全部筛选结果，不代表附近或剩余续航可达。':
    'No map bounds: all filtered stations are analyzed, not necessarily nearby or within battery range.',
  '综合推荐已提高距离权重，优先考虑就近补能。':
    'Balanced ranking now gives more weight to distance for a closer charging stop.',
  '正在等待设备确认停止；确认完成前请勿拔枪。':
    'Waiting for the charger to confirm it has stopped. Do not unplug yet.',
  '本次候选中距离最近，仍需核对实际行车路线。':
    'Nearest among these candidates. Check the actual driving route before leaving.',
  '同一补能目标下，同时达到候选中的最低预计费用与最短充电时长。':
    'For the same goal, this station has both the lowest estimated cost and shortest charging time among the candidates.',
  '比最快方案少花 {cost}，充电约多用 {minutes} 分钟。':
    'Costs {cost} less than the fastest option, with about {minutes} extra minutes of charging.',
  '比最低费用方案多花 {cost}，充电约少用 {minutes} 分钟。':
    'Costs {cost} more than the cheapest option, saving about {minutes} minutes of charging.',
  '在费用、充电时长与兼容余位之间更均衡；未提供行车和排队预测。':
    'Balances cost, charging time and matching availability. Driving and queuing are not predicted.',
  '费用与预计时长相同，可结合距离和停车规则选择。':
    'Cost and estimated time are equal. Consider distance and parking rules.',
  '{station} 站少花 {cost}，两站预计充电时长相近。':
    'Station {station} costs {cost} less. Charging times are similar.',
  '费用相同，{station} 站充电约快 {minutes} 分钟。':
    'Costs are equal. Station {station} charges about {minutes} min faster.',
  '对比已选站点（{count}/2）': 'Compare selected stations ({count}/2)',
  '已沿用补能目标；推荐估算枪位已标注，请核对现场后亲自选择。':
    'Your charging goal is carried over. The estimated charger is marked; check the bay and select it yourself.',
  推荐估算枪位: 'Estimated charger',
  车辆补能建议: 'Vehicle charging advisor',
  '为这次补能，选对一站': 'The right stop for this charge',
  调整目标: 'Edit goal',
  推荐偏好: 'Recommendation preference',
  综合推荐: 'Best balance',
  更快充好: 'Charge faster',
  更省钱: 'Spend less',
  '按距离推荐需要设备定位，请先定位或选择其他偏好。':
    'Location is needed for nearest-first recommendations. Enable location or choose another preference.',
  '正在核对兼容枪位…': 'Checking compatible chargers…',
  分析适合我的站: 'Find my best charging stop',
  '电量由你填写，不读取车辆；站点与分析均为模拟演示。':
    'Enter your battery level manually. Stations and estimates are simulated; no vehicle data is read.',
  '计划补入 {energy} kWh': 'Plan to add {energy} kWh',
  '已核对 {count} / {total} 个站点': 'Checked {count} / {total} stations',
  '枪位详情暂时无法核对，请重试分析。': 'Charger details could not be verified. Please try again.',
  '地图范围或筛选已变化，请重新分析当前结果。':
    'The map area or filters changed. Analyze the current results again.',
  重新分析: 'Analyze again',
  '已核对 {checked} 个站点，{matched} 个适合本次车辆与目标':
    'Checked {checked} stations; {matched} fit this vehicle and goal',
  '{count} 个站点详情失败，未参与推荐': '{count} stations could not be checked and were excluded',
  '未获得定位：不计距离，不估算行车时间。':
    'No location: distance is not scored and driving time is not estimated.',
  '电量较低，请优先确认站点距离；此分析不保证剩余续航可达。':
    'Battery is low. Check the distance first; this estimate does not guarantee you can reach a station.',
  本次推荐: 'Best fit',
  推荐备选: 'Alternative',
  '对比 A': 'Compare A',
  '对比 B': 'Compare B',
  费用更优: 'Lowest cost',
  补能更快: 'Fastest charge',
  距离更近: 'Nearest',
  预计充电时长: 'Charging time',
  分钟: 'min',
  '{minutes} 分钟': '{minutes} min',
  '约 {minutes} 分钟': 'About {minutes} min',
  '{type} 接口匹配，{count} 把兼容枪可用':
    '{type} compatible · {count} matching chargers available',
  '车辆与枪位共同限功率，最高 {power} kW': 'Vehicle and charger limit: up to {power} kW',
  '直线距离 {distance}，非行车里程': '{distance} straight-line distance, not driving distance',
  查看推荐站: 'View this station',
  '对比站点：{name}': 'Compare station: {name}',
  已选对比: 'Selected',
  加入对比: 'Compare',
  省钱备选: 'Lower-cost alternative',
  快速备选: 'Faster alternative',
  兼容备选: 'Compatible alternative',
  当前没有适合这辆车的可用站点: 'No available stations fit this vehicle',
  '请移动地图或调整筛选；维护、休息、无兼容空闲枪或费率未知的站点不会推荐。':
    'Move the map or adjust filters. Offline, closed, incompatible, full or unknown-rate stations are excluded.',
  '推荐怎么算？': 'How are stations ranked?',
  '综合比较费用、充电时长、直线距离和兼容余位；偏好会改变权重，不代表站点可达性或排队预测。':
    'Balances cost, charging time, straight-line distance and matching availability. Preferences change the ranking, not reachability or queue predictions.',
  '时长采用车辆与枪位较低功率，并模拟 60% 后逐渐降功率；不含行车、排队和接枪时间。':
    'Time uses the lower vehicle/charger power limit and simulated tapering above 60%. Driving, queuing and connection time are excluded.',
  '费用按当前分时电价锁定估算，含 10% 演示服务费，不含停车费和优惠；实际以所选枪位及账单为准。':
    'Cost locks the current time-of-use rate and includes a 10% demo service fee. Parking and discounts are excluded. The chosen charger and final bill take precedence.',
  站点对比: 'Station comparison',
  '这两站，怎么选': 'Compare your charging stops',
  清空对比: 'Clear',
  '再选择一个站点，比较同一补能目标下的费用与时间。':
    'Choose one more station to compare cost and time for the same charging goal.',
  '移除对比：{name}': 'Remove from comparison: {name}',
  有效功率上限: 'Effective power limit',
  兼容空闲枪: 'Matching chargers free',
  直线距离: 'Straight-line distance',
  '停车规则（另计）': 'Parking (separate)',
  查看此站: 'View station',
  '在推荐卡片或列表中点击「加入对比」': 'Select Compare on a recommendation or list card',
  '{cheaper} 站少花 {cost}；{faster} 站充电约快 {minutes} 分钟。':
    'Station {cheaper} costs {cost} less; station {faster} charges about {minutes} min faster.',
  本次补能: 'This charge',
  补能推荐优先: 'Best fit first',
  全部匹配站点: 'All matching stations',
  '按车况，找到适合的站': 'Find a station that fits your car',
  功率随补能进度变化: 'Power over charging time',
  '充电功率曲线，预计总时长 {minutes} 分钟，已充 {elapsed} 分钟':
    'Charging power curve. Estimated total: {minutes} min. Charged: {elapsed} min.',
  目标预测: 'Goal forecast',
  已充过程: 'Delivered progress',
  '60× 演示': '60× demo',
  本次充电流程: 'Charging session steps',
  电量进度: 'Battery progress',
  '起始 {battery}%': 'Start {battery}%',
  '按当前演示速度约 {seconds} 秒': 'About {seconds} seconds at demo speed',
  当前功率: 'Current power',
  功率与充电阶段: 'Power & charging stage',
  '已达到目标电量，输出已自动停止，不再增加费用。':
    'Target reached. Output stopped automatically; no further cost is added.',
  本次补能计划: 'Your charging plan',
  预计目标费用: 'Estimated target cost',
  '本次锁定电价 {price}/kWh，费用含 10% 演示服务费；停车费及优惠另计。':
    'Locked rate: {price}/kWh, plus a 10% demo service fee. Parking and discounts are separate.',
  车辆与枪位参数: 'Vehicle & charger details',
  '车辆上限 {vehicle} kW · 枪位上限 {connector} kW':
    'Vehicle limit: {vehicle} kW · Charger limit: {connector} kW',
  '曲线与计量来自同一模拟模型，不是车辆遥测数据。':
    'Curve and meter use the same simulation, not live vehicle telemetry.',
  已连接: 'Connected',
  停止输出: 'Stop output',
  拔枪归位: 'Unplug',
  等待停止应答: 'Awaiting stop confirmation',
  正在补能: 'Delivering energy',
  '目标已到，等待停止确认': 'Target reached · Awaiting stop',
  稳定补能阶段: 'Steady charging',
  逐步降功率阶段: 'Power tapering',
  '接近目标，温和补能': 'Gentle finish near the target',
  '已记录的电量与费用保持不变；虚线仅为原目标预测。':
    'Recorded energy and cost stay unchanged. The dashed line shows only the original forecast.',
  '已达到所选目标，不再增加电量与费用；仍须等待设备停止后拔枪。':
    'The selected target is reached. No more energy or cost is added. Wait for stop confirmation before unplugging.',
  '此历史会话沿用原有恒功率模型，保持计量一致。':
    'This saved session keeps its original constant-power model for consistent metering.',
  '当前按车辆与枪位中较低的功率上限补能，60% 后将模拟逐渐降功率。':
    'Charging uses the lower vehicle/charger limit. The simulation gradually tapers power above 60%.',
  '模拟电量升高后的降功率过程，剩余时间已按曲线重新计算，不是设备故障。':
    'The simulation reduces power at higher battery levels. Remaining time follows this curve; this is not a charger fault.',
  '这次补能，心中有数': 'Know your charging plan',
  '按模拟降功率曲线估时，不含接枪和排队；费用以结束时的电量结算，不含停车费及优惠。':
    'Time follows the simulated power curve, excluding connection and queuing. Billing uses delivered energy, excluding parking and discounts.'
}
