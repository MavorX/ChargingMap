import { test, expect } from '@playwright/test'

const errors = new WeakMap()
test.beforeEach(async ({ page }) => {
  errors.set(page, [])
  page.on('pageerror', (error) => errors.get(page).push(error.message))
  // Exercise the documented SDK-unavailable fallback; real map rendering is
  // reviewed separately rather than impersonated by these repeatable flows.
  await page.route('https://webapi.amap.com/**', (route) => route.abort())
})
test.afterEach(async ({ page }) => expect(errors.get(page)).toEqual([]))
const boot = async (page) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: '地图加载失败', exact: true })).toBeVisible()
}
const assertLayout = async (page) => {
  const layout = await page.evaluate(() => {
    const visible = (node) => {
      const rect = node.getBoundingClientRect()
      return rect.width > 0 && rect.height > 0 && !node.closest('[inert]')
    }
    return {
      page: document.documentElement.scrollWidth > innerWidth,
      controls: [
        ...document.querySelectorAll(
          'header, header button, .panel-content, .dialog-content, .filter-chip, .station-card, .charging-advisor, .recommendation-feature, [data-testid=station-comparison], .charging-workspace .account-card'
        )
      ]
        .filter(visible)
        .filter(
          (node) =>
            node.scrollWidth > node.clientWidth + 1 && getComputedStyle(node).overflowX !== 'auto'
        )
        .map((node) => node.className)
    }
  })
  expect(layout).toEqual({ page: false, controls: [] })
}
const closeToast = async (page) => {
  // Auto-dismiss may remove a toast between a visibility check and a click,
  // especially after advancing the virtual clock. Cleanup tolerates absence.
  await page
    .getByRole('button', { name: '关闭提示', exact: true })
    .evaluateAll((buttons) => buttons.forEach((button) => button.click()))
}

test('vehicle-aware analysis, two-station comparison and the shared charging plan', async ({
  page
}) => {
  await page.clock.install({ time: new Date('2026-10-28T12:00:00') })
  await boot(page)
  for (let round = 0; round < 2; round++) {
    await page.getByRole('button', { name: '收起站点列表', exact: true }).click()
    await page.getByRole('button', { name: '展开站点列表', exact: true }).click()
    expect(
      await page
        .locator('#station-explorer')
        .evaluate((element) => element.getBoundingClientRect().width)
    ).toBe(400)
    await assertLayout(page)
  }
  await page.locator('aside .station-search input').fill('上海')
  const advisor = page.locator('aside').getByTestId('charging-advisor')
  await advisor.locator('select').selectOption('2')
  await advisor.getByTestId('advisor-initial').fill('25')
  await advisor.getByTestId('advisor-target').fill('90')
  await advisor.getByRole('button', { name: '更省钱', exact: true }).click()
  await advisor.getByTestId('analyze-stations').click()
  const best = advisor.getByTestId('recommended-station')
  await expect(best).toBeVisible()
  await expect(best).toContainText('GB/T 接口匹配')
  await expect(advisor).toContainText('未获得定位：不计距离')
  const comparisons = advisor.getByRole('button', { name: /^对比站点：/ })
  await comparisons.nth(0).click()
  await comparisons.nth(1).click()
  await page.getByRole('button', { name: '对比已选站点（2/2）', exact: true }).click()
  await expect(advisor.getByTestId('station-comparison')).toBeVisible()
  await assertLayout(page)
  await best.getByRole('button', { name: '查看推荐站', exact: true }).click()
  await page.getByRole('button', { name: '选择充电桩', exact: true }).click()
  await expect(page.locator('#charging-vehicle')).toHaveValue('2')
  await expect(page.locator('#initial-soc')).toHaveValue('25')
  await expect(page.locator('#target-soc')).toHaveValue('90')
  const next = page.getByRole('button', { name: '下一步 · 连接充电枪', exact: true })
  await expect(next).toBeDisabled()
  await page.locator('[data-suggested=true]').click()
  await expect(page.getByTestId('charging-curve')).toBeVisible()
  await page.locator('#demo-speed').selectOption('1')
  await next.click()
  await page.getByRole('button', { name: '已插好，开始检测', exact: true }).click()
  await expect(page.getByRole('heading', { name: '充电中', exact: true })).toBeVisible()
  await page.clock.fastForward(60000)
  await expect
    .poll(async () =>
      Number(
        await page.getByRole('progressbar', { name: '当前电量' }).getAttribute('aria-valuenow')
      )
    )
    .toBeGreaterThan(25)
  await expect(page.getByTestId('charging-curve')).toContainText('已充过程')
  await assertLayout(page)
  await page.setViewportSize({ width: 320, height: 568 })
  await assertLayout(page)
  await page.setViewportSize({ width: 1440, height: 1000 })
  await closeToast(page)
  await page.getByRole('button', { name: '结束充电', exact: true }).click()
  await page.getByRole('button', { name: '确认结束', exact: true }).click()
  await expect(page.getByRole('button', { name: '已拔枪，查看账单', exact: true })).toBeVisible()
  await expect(
    page.getByText('已记录的电量与费用保持不变；虚线仅为原目标预测。', { exact: true })
  ).toBeVisible()
})

test('small-screen advisor validates SOC, recovers failed analysis and switches language', async ({
  page
}) => {
  await page.setViewportSize({ width: 320, height: 568 })
  await page.clock.install({ time: new Date('2026-10-28T12:00:00') })
  let fail = true
  await page.route('**/data/details/sh-part-01.json', (route) =>
    fail ? route.fulfill({ status: 503, body: 'unavailable' }) : route.continue()
  )
  await boot(page)
  await page.locator('.station-search input:visible').fill('人民广场')
  await page.getByRole('button', { name: '按车况，找到适合的站', exact: true }).click()
  const advisor = page.locator('#stations-list').getByTestId('charging-advisor')
  await advisor.locator('select').selectOption('2')
  await advisor.getByTestId('advisor-target').fill('10')
  await expect(advisor.getByTestId('analyze-stations')).toBeDisabled()
  await advisor.getByTestId('advisor-target').fill('80')
  await advisor.getByTestId('analyze-stations').click()
  await expect(
    advisor.getByText('枪位详情暂时无法核对，请重试分析。', { exact: true })
  ).toBeVisible()
  fail = false
  await advisor.getByRole('button', { name: '重新分析', exact: true }).click()
  await expect(advisor.getByTestId('recommended-station')).toBeVisible()
  await assertLayout(page)
  await page.keyboard.press('Escape')
  await page.locator('.language-switch').click()
  await page.locator('#toggle-list').click()
  await expect(advisor.getByTestId('recommended-station')).toContainText('Best fit')
  await expect(advisor).not.toContainText(/\p{Script=Han}/u)
  await assertLayout(page)
  await advisor
    .getByTestId('recommended-station')
    .getByRole('button', { name: 'View this station', exact: true })
    .click()
  await page.getByRole('button', { name: 'Choose a charger', exact: true }).click()
  await page.locator('[data-suggested=true]').click()
  await assertLayout(page)
  await page.getByRole('button', { name: 'Next · Plug in', exact: true }).click()
  await page.getByRole('button', { name: 'Plugged in · Check connection', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Charging', exact: true })).toBeVisible()
  await assertLayout(page)
})
