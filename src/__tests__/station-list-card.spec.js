// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'
import StationListCard from '../components/station/StationListCard.vue'
import { useStationList } from '../composables/useStationList'
import { useStationsStore } from '../store/modules/stations'

const station = {
  stationId: 'HF000001',
  stationName: '测试充电站',
  address: '合肥市蜀山区',
  quickAvailableNum: 2,
  quickChargeNum: 4,
  slowAvailableNum: 1,
  slowChargeNum: 3,
  currentPrice: 1.2,
  distance: 1234,
  stationGradeScore: 4.3,
  openStatus: 1,
  reservationAvailable: true,
  connectorTypes: ['CCS Combo', 'GB/T']
}

describe('StationListCard', () => {
  it('renders the comfortable density with metric labels and the entry animation', () => {
    const wrapper = mount(StationListCard, { props: { station } })

    expect(wrapper.classes()).toContain('animate-in')
    expect(wrapper.classes()).toContain('p-5')
    expect(wrapper.text()).toContain('快充')
    expect(wrapper.text()).toContain('慢充')
    expect(wrapper.text()).toContain('电价')
    expect(wrapper.text()).toContain('2/4')
    expect(wrapper.text()).toContain('¥1.20')
    expect(wrapper.text()).toContain('可预约')
    expect(wrapper.text()).toContain('1.2 km')
  })

  it('renders the compact density without metric labels', () => {
    const wrapper = mount(StationListCard, { props: { station, density: 'compact' } })

    expect(wrapper.classes()).toContain('p-3.5')
    expect(wrapper.classes()).not.toContain('animate-in')
    expect(wrapper.text()).not.toContain('快充')
    expect(wrapper.text()).not.toContain('电价')
    expect(wrapper.text()).toContain('2/4')
    expect(wrapper.text()).toContain('¥1.20')
  })

  it('falls back to comfortable and warns when the density is unknown', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const wrapper = mount(StationListCard, { props: { station, density: 'enormous' } })

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('未知 density'))
    expect(wrapper.classes()).toContain('p-5')
    expect(wrapper.text()).toContain('快充')

    warn.mockRestore()
  })

  it('emits select with the station when clicked', async () => {
    const wrapper = mount(StationListCard, { props: { station } })

    await wrapper.trigger('click')

    expect(wrapper.emitted('select')).toEqual([[station]])
  })
})

describe('useStationList', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('exposes the single-source filter chip definition', () => {
    const { filterButtons } = useStationList()

    expect(Object.keys(filterButtons)).toEqual([
      'quickAvailable',
      'slowAvailable',
      'open24h',
      'reservable'
    ])
    expect(filterButtons.quickAvailable.icon).toBe('fa fa-bolt')
  })

  it('keeps the pagination math identical to the old shells', () => {
    const store = useStationsStore()
    store.stations = Array.from({ length: 25 }, (_, index) => ({
      ...station,
      stationId: `id-${index}`
    }))
    store.listPage = 1
    store.listPageSize = 20

    const { displayedStations, hasMore, remainingCount, loadMore } = useStationList()

    expect(displayedStations.value).toHaveLength(20)
    expect(hasMore.value).toBe(true)
    expect(remainingCount.value).toBe(5)

    loadMore()

    expect(displayedStations.value).toHaveLength(25)
    expect(hasMore.value).toBe(false)
    expect(remainingCount.value).toBe(0)
  })

  it('routes search edits through the store and resets paging', () => {
    const store = useStationsStore()
    store.stations = [{ ...station }]
    store.listPage = 3

    const { searchQuery } = useStationList()
    searchQuery.value = '测试'

    expect(store.searchQuery).toBe('测试')
    expect(store.listPage).toBe(1)
  })

  it('resets filters through the store', () => {
    const store = useStationsStore()
    store.setSearchQuery('测试')
    store.filters.quickAvailable = true

    const { resetFilters } = useStationList()
    resetFilters()

    expect(store.searchQuery).toBe('')
    expect(store.filters.quickAvailable).toBe(false)
    expect(store.listPage).toBe(1)
  })
})
