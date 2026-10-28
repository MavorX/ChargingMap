import { test, expect } from '@playwright/test'

const errors = new WeakMap()
test.beforeEach(async ({ page }) => {
  errors.set(page, [])
  page.on('pageerror', (error) => errors.get(page).push(error.message))
  // These repeatable flows deliberately test the documented SDK-unavailable
  // fallback. Real AMap rendering/network checks are a separate live audit.
  await page.route('https://webapi.amap.com/**', (route) => route.abort())
})
test.afterEach(async ({ page }) => {
  expect(errors.get(page)).toEqual([])
})

const boot = async (page) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: '地图加载失败', exact: true })).toBeVisible()
}
const selectStation = async (page) => {
  await page.locator('.station-search input:visible').first().fill('人民广场')
  if (page.viewportSize().width < 1024) await page.locator('#toggle-list').click()
  await page.locator('.station-card:visible').filter({ hasText: '人民广场' }).first().click()
  await expect(page.getByRole('button', { name: '选择充电桩', exact: true })).toBeEnabled()
}
const openAccount = async (page) => {
  await page.getByRole('button', { name: '个人中心', exact: true }).click()
  await expect(page.getByRole('heading', { name: '我的账户', exact: true })).toBeVisible()
}
const ledger = (page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem('chargingSandboxLedger')))
const closeToast = async (page) => {
  const button = page.getByRole('button', { name: '关闭提示', exact: true })
  if (await button.isVisible()) await button.click()
}
const assertLayout = async (page) => {
  const overflow = await page.evaluate(() => {
    const visible = (element) => {
      const rect = element.getBoundingClientRect()
      return rect.width > 0 && rect.height > 0 && !element.closest('[inert]')
    }
    return {
      page: document.documentElement.scrollWidth > window.innerWidth,
      controls: [
        ...document.querySelectorAll(
          'header, header button, .panel-content, .dialog-content, .filter-chip, .station-card'
        )
      ]
        .filter(visible)
        .filter(
          (element) =>
            element.scrollWidth > element.clientWidth + 1 &&
            window.getComputedStyle(element).overflowX !== 'auto'
        )
        .map((element) => element.className)
    }
  })
  expect(overflow).toEqual({ page: false, controls: [] })
}

test('shared search, reset, paging and the left-side return path', async ({ page }) => {
  await boot(page)
  await expect(page.locator('aside .station-card')).toHaveCount(20)
  await page.getByRole('button', { name: /加载更多/ }).click()
  await expect(page.locator('aside .station-card')).toHaveCount(40)
  const search = page.locator('aside input[type=search]')
  await search.fill('no-matching-station-123')
  await expect(page.getByRole('heading', { name: '这里还没有匹配的充电站' })).toBeVisible()
  await page.getByRole('button', { name: '重置筛选条件', exact: true }).click()
  await expect(search).toHaveValue('')
  await page.getByRole('button', { name: '快充可用', exact: true }).click()
  await page.getByRole('button', { name: '收起站点列表', exact: true }).click()
  const expand = page.getByRole('button', { name: '展开站点列表', exact: true })
  expect((await expand.boundingBox()).x).toBeLessThan(100)
  await expand.click()
  await expect(page.getByRole('button', { name: '快充可用', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true'
  )
  await assertLayout(page)
})

test('charging requires a selected gun, connection, stop and unplug before one payment/review', async ({
  page
}) => {
  await boot(page)
  await selectStation(page)
  await page.getByRole('button', { name: '选择充电桩', exact: true }).click()
  const next = page.getByRole('button', { name: '下一步 · 连接充电枪', exact: true })
  await expect(next).toBeDisabled()
  await page.getByRole('button', { name: /超充2/ }).click()
  await next.click()
  await expect(page.getByRole('heading', { name: '请插好充电枪', exact: true })).toBeVisible()
  await page.getByRole('button', { name: '暂未插好，返回', exact: true }).click()
  await expect(page.getByRole('button', { name: '结束充电', exact: true })).toHaveCount(0)
  await next.click()
  await page.getByRole('button', { name: '已插好，开始检测', exact: true }).click()
  await expect(page.getByRole('heading', { name: '充电中', exact: true })).toBeVisible()
  await closeToast(page)
  await page.getByRole('button', { name: '返回地图', exact: true }).click()
  await page.getByRole('button', { name: '正在充电 · 查看进度', exact: true }).click()
  await page.getByRole('button', { name: '结束充电', exact: true }).click()
  await expect(page.getByRole('heading', { name: '结束本次充电？', exact: true })).toBeVisible()
  await page.getByRole('button', { name: '确认结束', exact: true }).click()
  await expect(page.getByRole('button', { name: '已拔枪，查看账单', exact: true })).toBeVisible()
  await page.getByRole('button', { name: '已拔枪，查看账单', exact: true }).click()
  await expect(page.getByRole('heading', { name: '确认支付', exact: true })).toBeVisible()
  await page.getByRole('button', { name: /^确认支付 ¥/ }).click()
  await expect(page.getByRole('heading', { name: '支付成功', exact: true })).toBeVisible()
  expect((await ledger(page)).history).toHaveLength(1)
  expect((await ledger(page)).transactions).toHaveLength(1)
  expect((await ledger(page)).balance).toBe(0)
  await page.getByRole('button', { name: '评价本次充电', exact: true }).click()
  await page.getByRole('radio', { name: '4 星', exact: true }).click()
  await page.locator('#review-content').fill('完整演示流程与状态提示清晰。')
  await page.getByRole('button', { name: '提交评价 · 获得 5 积分', exact: true }).click()
  await expect(page.locator('.panel-content')).toHaveCount(0)
  expect((await ledger(page)).points).toBe(5)
  await page.reload()
  await expect(page.getByRole('heading', { name: '地图加载失败', exact: true })).toBeVisible()
  expect((await ledger(page)).history).toHaveLength(1)
  expect((await ledger(page)).points).toBe(5)
})

test('reservation rejects incompatible vehicles and accepts a compatible selection', async ({
  page
}) => {
  await boot(page)
  await selectStation(page)
  await page.getByRole('button', { name: '预约充电', exact: true }).click()
  await page.getByRole('button', { name: /ID\.UNYX 08/ }).click()
  await page.getByRole('button', { name: /明天/ }).click()
  await page.getByRole('button', { name: /08:00-10:00/ }).click()
  await expect(page.getByRole('button', { name: '确认预约', exact: true })).toBeDisabled()
  await expect(
    page.getByText('车辆接口与充电枪不匹配，请选择兼容接口', { exact: true })
  ).toBeVisible()
  await page.getByRole('button', { name: /ID\.3/ }).click()
  await page.getByRole('button', { name: '确认预约', exact: true }).click()
  await expect(page.getByText('预约成功（演示），请按预约时间到站', { exact: true })).toBeVisible()
})

test('wallet validation, vehicle draft protection and local preferences survive reload', async ({
  page
}) => {
  await boot(page)
  await openAccount(page)
  await page.getByRole('button', { name: /钱包余额/ }).click()
  await page.getByRole('button', { name: '充值', exact: true }).click()
  await page.locator('#wallet-recharge').fill('0')
  await expect(page.getByRole('button', { name: '确认充值', exact: true })).toBeDisabled()
  await page.getByRole('button', { name: '¥50', exact: true }).click()
  await page.getByRole('button', { name: '确认充值', exact: true }).click()
  expect((await ledger(page)).balance).toBe(50)
  await page.getByRole('button', { name: '提现', exact: true }).click()
  await page.locator('#wallet-withdraw').fill('60')
  await expect(page.getByRole('button', { name: '确认提现', exact: true })).toBeDisabled()
  await page.locator('#wallet-withdraw').fill('10')
  await page.getByRole('button', { name: '确认提现', exact: true }).click()
  expect((await ledger(page)).balance).toBe(40)
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: /我的车辆/ }).click()
  await page.getByRole('button', { name: '添加车辆', exact: true }).click()
  await page.locator('#vehicle-brand').fill('测试品牌')
  await page.getByRole('button', { name: '取消', exact: true }).click()
  await expect(page.getByRole('heading', { name: '放弃未保存的修改？', exact: true })).toBeVisible()
  await page.getByRole('button', { name: '放弃修改', exact: true }).click()
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: '设置与个人资料', exact: true }).click()
  await page.getByRole('button', { name: '编辑昵称', exact: true }).click()
  await page.locator('#account-name').fill('Charging Demo')
  await page.getByRole('button', { name: '保存', exact: true }).click()
  await page.reload()
  await expect(page.getByRole('heading', { name: '地图加载失败', exact: true })).toBeVisible()
  await openAccount(page)
  await expect(page.getByRole('heading', { name: 'Charging Demo', exact: true })).toBeVisible()
  expect((await ledger(page)).balance).toBe(40)
})

test('account lazy panels reopen after three full reloads of the built app', async ({ page }) => {
  await boot(page)
  await expect(page.locator('script[type="module"][src]')).toHaveAttribute(
    'src',
    /^\/assets\/.+\.js$/
  )
  for (let reload = 0; reload < 3; reload++) {
    await openAccount(page)
    await page.getByRole('button', { name: '设置与个人资料', exact: true }).click()
    await expect(page.getByRole('heading', { name: '设置', exact: true })).toBeVisible()
    await page.reload()
    await expect(page.getByRole('heading', { name: '地图加载失败', exact: true })).toBeVisible()
  }
  await openAccount(page)
})

test('a failed detail request offers a usable retry', async ({ page }) => {
  let failed = false
  await page.route('**/data/details/sh-part-01.json', (route) => {
    if (!failed) {
      failed = true
      return route.fulfill({ status: 503, contentType: 'text/plain', body: 'temporary failure' })
    }
    return route.continue()
  })
  await boot(page)
  await page.locator('aside input[type=search]').fill('人民广场')
  await page.locator('aside .station-card').click()
  await expect(page.getByText('站点详情加载失败', { exact: true }).first()).toBeVisible()
  await page.locator('aside').getByRole('button', { name: '重试', exact: true }).click()
  await expect(page.getByRole('button', { name: '选择充电桩', exact: true })).toBeEnabled()
})

for (const [width, height] of [
  [320, 568],
  [390, 844],
  [1024, 768]
]) {
  test(`English, dark mode, filters and panels fit ${width}×${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height })
    await boot(page)
    await page.locator('.language-switch').click()
    await expect(page.locator('html')).toHaveAttribute('lang', 'en-US')
    await assertLayout(page)
    if (width < 1024) {
      await page.locator('#toggle-list').click()
      await expect(page.locator('#stations-list .station-card')).toHaveCount(20)
      await assertLayout(page)
      await page.keyboard.press('Escape')
    }
    await page
      .getByRole('button', { name: 'Filters', exact: true })
      .filter({ visible: true })
      .first()
      .click()
    await expect(page.getByRole('heading', { name: 'Filter stations', exact: true })).toBeVisible()
    await assertLayout(page)
    await page.getByRole('button', { name: 'Apply filters', exact: true }).click()
    await page.getByRole('button', { name: 'Switch theme', exact: true }).click()
    await expect(page.locator('html')).toHaveClass(/dark/)
    await page.reload()
    await expect(page.locator('html')).toHaveAttribute('lang', 'en-US')
    await expect(page.locator('html')).toHaveClass(/dark/)
    await assertLayout(page)
  })
}
