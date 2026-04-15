import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    userInfo: {
      name: '电动汽车用户',
      level: '白银会员',
      points: 128,
      balance: 56.80
    },
    vehicles: [
      {
        id: '1',
        model: 'ID.UNYX 08',
        brand: 'Volkswagen',
        connectorType: 'CCS Combo',
        maxPower: 250
      },
      {
        id: '2',
        model: 'ID.3',
        brand: 'Volkswagen',
        connectorType: 'GB/T',
        maxPower: 120
      }
    ],
    chargingHistory: [
      {
        id: 'ch1',
        stationName: '城东快速充电站',
        stationAddress: '城东新区科技路88号',
        date: '2025-04-12 14:30',
        duration: '45分钟',
        energy: '32.5 kWh',
        cost: 48.75,
        vehicleModel: 'Model 3',
        status: 'completed'
      },
      {
        id: 'ch2',
        stationName: '中心商业区充电站',
        stationAddress: '中心大道168号B2停车场',
        date: '2025-04-10 09:15',
        duration: '1小时20分钟',
        energy: '45.0 kWh',
        cost: 58.50,
        vehicleModel: '汉EV',
        status: 'completed'
      },
      {
        id: 'ch3',
        stationName: '西湖景区超充站',
        stationAddress: '西湖区龙井路56号',
        date: '2025-04-08 16:45',
        duration: '30分钟',
        energy: '55.0 kWh',
        cost: 71.50,
        vehicleModel: 'Model 3',
        status: 'completed'
      },
      {
        id: 'ch4',
        stationName: '城南综合充电站',
        stationAddress: '城南开发区创新路22号',
        date: '2025-04-05 11:00',
        duration: '55分钟',
        energy: '38.2 kWh',
        cost: 49.66,
        vehicleModel: '汉EV',
        status: 'completed'
      },
      {
        id: 'ch5',
        stationName: '高铁站快充中心',
        stationAddress: '高铁站东广场地下停车场',
        date: '2025-04-02 08:20',
        duration: '35分钟',
        energy: '42.0 kWh',
        cost: 52.50,
        vehicleModel: 'Model 3',
        status: 'refunded'
      }
    ],
    coupons: [
      {
        id: 'cp1',
        title: '满50减5元',
        description: '充电消费满50元立减5元',
        type: 'discount',
        value: 5,
        minSpend: 50,
        expiryDate: '2025-12-30',
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
        expiryDate: '2025-06-30',
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
        expiryDate: '2025-05-15',
        used: false
      }
    ],
    walletTransactions: [
      {
        id: 'wt1',
        type: 'recharge',
        amount: 100.00,
        description: '钱包充值',
        date: '2025-04-12 14:00',
        balance: 156.80
      },
      {
        id: 'wt2',
        type: 'payment',
        amount: -48.75,
        description: '城东快速充电站充电',
        date: '2025-04-12 15:15',
        balance: 108.05
      },
      {
        id: 'wt3',
        type: 'recharge',
        amount: 50.00,
        description: '钱包充值',
        date: '2025-04-10 08:50',
        balance: 156.80
      },
      {
        id: 'wt4',
        type: 'payment',
        amount: -58.50,
        description: '中心商业区充电站充电',
        date: '2025-04-10 10:35',
        balance: 106.80
      },
      {
        id: 'wt5',
        type: 'refund',
        amount: 52.50,
        description: '高铁站快充中心退款',
        date: '2025-04-03 09:00',
        balance: 165.30
      },
      {
        id: 'wt6',
        type: 'payment',
        amount: -71.50,
        description: '西湖景区超充站充电',
        date: '2025-04-08 17:15',
        balance: 112.80
      }
    ],
    settings: {
      notificationEnabled: true,
      chargingReminder: true,
      promotionNotification: false,
      autoPay: true,
      language: 'zh-CN'
    },
    notifications: [
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
        content: '您预约的"城东充电站"充电服务将在30分钟后开始，请做好准备。',
        time: '1周前',
        read: true
      }
    ],
    isDarkMode: false
  }),
  
  actions: {
    toggleTheme() {
      this.isDarkMode = !this.isDarkMode
      // 保存主题设置到本地存储
      localStorage.setItem('isDarkMode', this.isDarkMode)
      // 应用主题类到文档根元素
      if (this.isDarkMode) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    },
    
    loadTheme() {
      const savedTheme = localStorage.getItem('isDarkMode')
      if (savedTheme !== null) {
        this.isDarkMode = savedTheme === 'true'
        if (this.isDarkMode) {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      }
    },
    
    addVehicle(vehicle) {
      this.vehicles.push({
        id: Date.now().toString(),
        ...vehicle
      })
    },
    
    removeVehicle(vehicleId) {
      this.vehicles = this.vehicles.filter(v => v.id !== vehicleId)
    },
    
    updateVehicle(vehicleId, updates) {
      const vehicle = this.vehicles.find(v => v.id === vehicleId)
      if (vehicle) {
        Object.assign(vehicle, updates)
      }
    },
    
    addNotification(notification) {
      this.notifications.unshift({
        id: Date.now().toString(),
        ...notification,
        read: false
      })
    },
    
    markNotificationAsRead(notificationId) {
      const notification = this.notifications.find(n => n.id === notificationId)
      if (notification) {
        notification.read = true
      }
    },
    
    markAllNotificationsAsRead() {
      this.notifications.forEach(notification => {
        notification.read = true
      })
    },

    useCoupon(couponId) {
      const coupon = this.coupons.find(c => c.id === couponId)
      if (coupon) {
        coupon.used = true
      }
    },

    addWalletTransaction(transaction, updateBalance = true) {
      this.walletTransactions.unshift({
        id: Date.now().toString(),
        ...transaction,
        date: new Date().toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(/\//g, '-')
      })
      if (updateBalance && ['recharge', 'payment', 'refund'].includes(transaction.type)) {
        this.userInfo.balance += transaction.amount
      }
    },

    updateSettings(updates) {
      Object.assign(this.settings, updates)
    },

    addChargingHistory(record) {
      this.chargingHistory.unshift({
        id: Date.now().toString(),
        ...record,
        status: 'completed'
      })
    }
  },
  
  getters: {
    unreadNotificationsCount: (state) => {
      return state.notifications.filter(n => !n.read).length
    }
  }
})