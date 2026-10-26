// A virtual device, deliberately NOT an operator / OCPP client. None of these
// commands can energize hardware. Real control requires an authenticated server.
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export const createSandboxCharger = ({ connector, scenario = 'normal' }) => {
  let connected = false
  let charging = false
  let fault = scenario
  const assertReady = () => {
    if (!connected) throw new Error('测试枪未连接，设备拒绝启动')
    if (fault === 'offline') throw new Error('测试设备离线，无法读取状态')
    if (fault === 'occupied') throw new Error('测试枪已被其他会话占用')
  }
  return {
    connect() {
      connected = true
      return { connected: true }
    },
    disconnect() {
      if (charging) throw new Error('设备尚未确认停止，禁止拔枪；请先请求停止并等待应答')
      connected = false
      return { connected: false }
    },
    async inspect() {
      await delay(900)
      assertReady()
      return { connected, online: true, occupied: false, connectorId: connector.id }
    },
    async start() {
      await delay(700)
      assertReady()
      if (fault === 'start_failure') throw new Error('测试设备拒绝启动，尚未送电，不会开始计费')
      charging = true
      return { charging: true, acknowledgedAt: Date.now() }
    },
    async stop() {
      await delay(500)
      if (fault === 'stop_failure')
        throw new Error('停止应答丢失（模拟）：设备尚未确认停止，请重试，切勿强行拔枪')
      charging = false
      return { charging: false, acknowledgedAt: Date.now() }
    },
    loseConnection() {
      charging = false
      connected = false
      return { charging: false, connected: false }
    },
    setScenario(value) {
      fault = value
    }
  }
}
