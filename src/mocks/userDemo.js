// 演示用户数据：仅在 VITE_DEMO === 'true' 时由 user / reservation store 采用。
// 所有站点引用统一指向数据集首站 HF000001（generate_stations.js 默认 500 站必然包含），
// 避免旧 id '1' 在详情分片推导下请求 404。
export const DEMO_STATION_ID = 'HF000001'

const DEMO_STATION_NAME = '城东充电站'
const DEMO_STATION_ADDRESS = '合肥市瑶海区长江东路123号'

export const demoUserInfo = {
  name: '电动汽车用户',
  level: '白银会员',
  points: 128,
  balance: 56.8
}

export const demoChargingHistory = [
  {
    id: 'ch1',
    stationId: DEMO_STATION_ID,
    stationName: DEMO_STATION_NAME,
    stationAddress: DEMO_STATION_ADDRESS,
    date: '2025-04-12 14:30',
    duration: '45分钟',
    energy: '32.5 kWh',
    cost: 48.75,
    vehicleModel: 'Model 3',
    status: 'completed'
  },
  {
    id: 'ch2',
    stationId: DEMO_STATION_ID,
    stationName: DEMO_STATION_NAME,
    stationAddress: DEMO_STATION_ADDRESS,
    date: '2025-04-10 09:15',
    duration: '1小时20分钟',
    energy: '45.0 kWh',
    cost: 58.5,
    vehicleModel: '汉EV',
    status: 'completed'
  },
  {
    id: 'ch3',
    stationId: DEMO_STATION_ID,
    stationName: DEMO_STATION_NAME,
    stationAddress: DEMO_STATION_ADDRESS,
    date: '2025-04-08 16:45',
    duration: '30分钟',
    energy: '55.0 kWh',
    cost: 71.5,
    vehicleModel: 'Model 3',
    status: 'completed'
  },
  {
    id: 'ch4',
    stationId: DEMO_STATION_ID,
    stationName: DEMO_STATION_NAME,
    stationAddress: DEMO_STATION_ADDRESS,
    date: '2025-04-05 11:00',
    duration: '55分钟',
    energy: '38.2 kWh',
    cost: 49.66,
    vehicleModel: '汉EV',
    status: 'completed'
  },
  {
    id: 'ch5',
    stationId: DEMO_STATION_ID,
    stationName: DEMO_STATION_NAME,
    stationAddress: DEMO_STATION_ADDRESS,
    date: '2025-04-02 08:20',
    duration: '35分钟',
    energy: '42.0 kWh',
    cost: 52.5,
    vehicleModel: 'Model 3',
    status: 'refunded'
  }
]

export const demoCoupons = [
  {
    id: 'cp1',
    title: '满50减5元',
    description: '充电消费满50元立减5元',
    type: 'discount',
    value: 5,
    minSpend: 50,
    expiryDate: '2027-12-31',
    used: false
  },
  {
    id: 'cp2',
    title: '新人8折券',
    description: '充电费用享8折优惠，最高减免20元',
    type: 'percent',
    value: 20,
    percent: 80,
    minSpend: 0,
    expiryDate: '2027-12-31',
    used: false
  },
  {
    id: 'cp3',
    title: '免费充电券',
    description: '可免费充电30分钟，限快充桩使用',
    type: 'free',
    value: 15,
    freeMinutes: 30,
    minSpend: 0,
    expiryDate: '2027-12-31',
    used: false
  }
]

export const demoWalletTransactions = [
  {
    id: 'wt1',
    type: 'recharge',
    amount: 100.0,
    description: '钱包充值',
    date: '2025-04-12 14:00',
    balance: 156.8
  },
  {
    id: 'wt2',
    type: 'payment',
    amount: -48.75,
    description: `${DEMO_STATION_NAME}充电`,
    date: '2025-04-12 15:15',
    balance: 108.05
  },
  {
    id: 'wt3',
    type: 'recharge',
    amount: 50.0,
    description: '钱包充值',
    date: '2025-04-10 08:50',
    balance: 156.8
  },
  {
    id: 'wt4',
    type: 'payment',
    amount: -58.5,
    description: `${DEMO_STATION_NAME}充电`,
    date: '2025-04-10 10:35',
    balance: 106.8
  },
  {
    id: 'wt5',
    type: 'refund',
    amount: 52.5,
    description: `${DEMO_STATION_NAME}退款`,
    date: '2025-04-03 09:00',
    balance: 165.3
  },
  {
    id: 'wt6',
    type: 'payment',
    amount: -71.5,
    description: `${DEMO_STATION_NAME}充电`,
    date: '2025-04-08 17:15',
    balance: 112.8
  }
]

export const demoNotifications = [
  {
    id: '1',
    title: '充电完成通知',
    content: '您的车辆已完成充电，电量已达到80%，请及时前往拔枪。',
    time: '10分钟前',
    read: false
  },
  {
    id: '2',
    title: '新优惠券到账',
    content: '您已获得一张"满50减5元"的充电优惠券，有效期至2025-12-30。',
    time: '昨天',
    read: false
  },
  {
    id: '3',
    title: '会员等级提升',
    content: '恭喜您！您的会员等级已从"青铜会员"提升至"白银会员"，将享受更多优惠。',
    time: '3天前',
    read: true
  },
  {
    id: '4',
    title: '预约即将开始',
    content: `您预约的"${DEMO_STATION_NAME}"充电服务将在30分钟后开始，请做好准备。`,
    time: '1周前',
    read: true
  }
]

// 预约日期取「明天」，避免演示数据出现过期未开始的预约。
const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
const pad = (value) => String(value).padStart(2, '0')
const demoReservationDate = `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(
  tomorrow.getDate()
)}`

export const demoReservations = [
  {
    id: '1',
    stationId: DEMO_STATION_ID,
    stationName: DEMO_STATION_NAME,
    stationAddress: DEMO_STATION_ADDRESS,
    date: demoReservationDate,
    timeSlot: '10:00-12:00',
    connectorId: `${DEMO_STATION_ID}-FC-1`,
    connectorName: '快充1',
    vehicleModel: '特斯拉 Model 3',
    chargeAmount: 50,
    status: 'upcoming'
  }
]
