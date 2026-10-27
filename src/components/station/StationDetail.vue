<template>
  <component
    :is="isInline ? 'div' : PanelShell"
    :class="isInline ? 'flex h-full flex-col' : undefined"
    :title="isInline ? undefined : stationName(station?.stationName) || t('站点详情')"
    @close="$emit('close')"
  >
    <div
      class="glass-effect z-10 flex flex-shrink-0 items-center justify-between border-b border-surface-200/50 p-4 dark:border-surface-700/50"
    >
      <button class="icon-button shrink-0" :aria-label="t('返回')" @click="$emit('close')">
        <i class="fa fa-arrow-left text-surface-600 dark:text-surface-300" aria-hidden="true"></i>
      </button>
      <h2
        class="line-clamp-2 min-w-0 flex-1 px-2 text-sm font-bold leading-5 text-surface-900 dark:text-surface-100 sm:text-base"
        :title="stationName(station?.stationName)"
      >
        {{ stationName(station?.stationName) }}
      </h2>
      <div class="flex shrink-0 space-x-1.5">
        <button
          class="icon-button group relative"
          :aria-label="t(station?.isFavorite ? '取消收藏' : '收藏站点')"
          @click="toggleFavorite"
        >
          <i
            class="fa text-lg transition-all duration-300 group-hover:scale-110"
            :class="
              station?.isFavorite ? 'fa-heart text-danger-500' : 'fa-heart-o text-surface-400'
            "
            aria-hidden="true"
          ></i>
        </button>
        <button class="icon-button group" :aria-label="t('分享站点')" @click="shareStation">
          <i
            class="fa fa-share-alt text-surface-400 transition-all duration-300 group-hover:rotate-12 group-hover:text-primary-500"
            aria-hidden="true"
          ></i>
        </button>
      </div>
    </div>
    <div v-if="station" class="flex-1 overflow-y-auto" :class="size.contentPad">
      <div
        v-if="stationsStore.detailsError"
        class="mb-4 rounded-xl border border-danger-200 bg-danger-50 dark:border-danger-800/60 dark:bg-danger-900/20"
        :class="size.errorPad"
        role="alert"
      >
        <div class="flex items-center gap-3">
          <i class="fa fa-exclamation-triangle text-lg text-danger-500" aria-hidden="true"></i>
          <div class="min-w-0 flex-1">
            <p class="text-sm font-semibold text-surface-800 dark:text-surface-100">
              {{ t(stationsStore.detailsError) }}
            </p>
            <p class="mt-0.5 text-xs text-surface-500 dark:text-surface-400">
              {{ t('请检查网络后重试') }}
            </p>
          </div>
          <button
            class="rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="isRetryingDetails"
            @click="retryDetails"
          >
            {{ t('重试') }}
          </button>
        </div>
      </div>
      <div class="premium-card" :class="[size.cardMb, size.heroPad]">
        <div class="flex items-start" :class="size.heroHead">
          <div
            class="mr-3 flex flex-shrink-0 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-900/30"
            :class="size.heroIcon"
          >
            <i
              class="fa fa-map-marker text-primary-500"
              :class="size.heroGlyph"
              aria-hidden="true"
            ></i>
          </div>
          <div class="min-w-0 flex-1">
            <p
              class="font-medium uppercase tracking-wide text-surface-500 dark:text-surface-400"
              :class="size.heroLabel"
            >
              {{ t('地址信息') }}
            </p>
            <p
              class="leading-relaxed text-surface-800 dark:text-surface-200"
              :class="size.heroTitle"
            >
              {{ stationAddress(station.address) }}
            </p>
          </div>
        </div>
        <div class="grid grid-cols-3" :class="size.tileGrid">
          <div
            class="border border-surface-100 bg-white/80 text-center shadow-soft backdrop-blur-sm dark:border-surface-700/50 dark:bg-surface-800/50"
            :class="[size.tileRadius, size.tilePad]"
          >
            <div
              class="mx-auto flex items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30"
              :class="size.tileIcon"
            >
              <i
                class="fa fa-road text-primary-500"
                :class="size.tileRoadGlyph"
                aria-hidden="true"
              ></i>
            </div>
            <p
              class="station-detail-label font-medium uppercase tracking-wide text-surface-500 dark:text-surface-400"
              :class="size.tileLabel"
            >
              {{ t('距离') }}
            </p>
            <p class="gradient-text font-bold" :class="size.tileValue">
              {{ formatDistance(station.distance, { withUnit: false })
              }}<span
                v-if="Number.isFinite(station.distance)"
                class="ml-0.5 font-normal text-surface-500"
                :class="size.tileUnit"
                >km</span
              >
            </p>
          </div>
          <div
            class="border border-surface-100 bg-white/80 text-center shadow-soft backdrop-blur-sm dark:border-surface-700/50 dark:bg-surface-800/50"
            :class="[size.tileRadius, size.tilePad]"
          >
            <div
              class="mx-auto flex items-center justify-center rounded-full"
              :class="[
                size.tileIcon,
                station.quickAvailableNum > 0
                  ? 'bg-secondary-100 dark:bg-secondary-900/30'
                  : 'bg-danger-100 dark:bg-danger-900/30'
              ]"
            >
              <i
                class="fa fa-bolt"
                :class="[
                  size.tileBoltGlyph,
                  station.quickAvailableNum > 0
                    ? 'text-secondary-600 dark:text-secondary-300'
                    : 'text-danger-600 dark:text-danger-400'
                ]"
                aria-hidden="true"
              ></i>
            </div>
            <p
              class="station-detail-label font-medium uppercase tracking-wide text-surface-500 dark:text-surface-400"
              :class="size.tileLabel"
            >
              {{ t('快充可用') }}
            </p>
            <p
              class="font-bold"
              :class="[
                size.tileValue,
                station.quickAvailableNum > 0
                  ? 'text-secondary-600 dark:text-secondary-300'
                  : 'text-danger-600 dark:text-danger-400'
              ]"
            >
              {{ station.quickAvailableNum
              }}<span class="font-normal text-surface-400" :class="size.tileUnit"
                >/{{ station.quickChargeNum }}</span
              >
            </p>
          </div>
          <div
            class="border border-surface-100 bg-white/80 text-center shadow-soft backdrop-blur-sm dark:border-surface-700/50 dark:bg-surface-800/50"
            :class="[size.tileRadius, size.tilePad]"
          >
            <div
              class="mx-auto flex items-center justify-center rounded-full"
              :class="[
                size.tileIcon,
                station.slowAvailableNum > 0
                  ? 'bg-surface-100 dark:bg-surface-700'
                  : 'bg-danger-100 dark:bg-danger-900/30'
              ]"
            >
              <i
                class="fa fa-plug"
                :class="[
                  size.tileBoltGlyph,
                  station.slowAvailableNum > 0
                    ? 'text-surface-600 dark:text-surface-300'
                    : 'text-danger-500'
                ]"
                aria-hidden="true"
              ></i>
            </div>
            <p
              class="station-detail-label font-medium uppercase tracking-wide text-surface-500 dark:text-surface-400"
              :class="size.tileLabel"
            >
              {{ t('慢充可用') }}
            </p>
            <p
              class="font-bold"
              :class="[
                size.tileValue,
                station.slowAvailableNum > 0
                  ? 'text-surface-700 dark:text-surface-200'
                  : 'text-danger-600 dark:text-danger-400'
              ]"
            >
              {{ station.slowAvailableNum
              }}<span class="font-normal text-surface-400" :class="size.tileUnit"
                >/{{ station.slowChargeNum }}</span
              >
            </p>
          </div>
        </div>
        <div
          class="border border-surface-100 bg-white/80 shadow-soft backdrop-blur-sm dark:border-surface-700/50 dark:bg-surface-800/50"
          :class="[size.tileRadius, size.tilePad]"
        >
          <div class="grid grid-cols-3" :class="size.summaryGrid">
            <div class="text-center">
              <p
                class="station-detail-label font-medium uppercase tracking-wide text-surface-500 dark:text-surface-400"
                :class="size.summaryLabel"
              >
                {{ t('当前电价') }}
              </p>
              <p
                class="font-bold text-primary-600 dark:text-primary-300"
                :class="size.summaryValue"
              >
                {{ formatPrice(station.currentPrice)
                }}<span
                  class="station-rate-unit font-normal text-surface-400"
                  :class="size.summaryUnit"
                  >{{ t('/度') }}</span
                >
              </p>
            </div>
            <div class="border-x border-surface-200 dark:border-surface-700">
              <div class="text-center" :class="size.ratingPad">
                <p
                  class="station-detail-label font-medium uppercase tracking-wide text-surface-500 dark:text-surface-400"
                  :class="size.summaryLabel"
                >
                  {{ t('评分') }}
                </p>
                <div class="flex items-center justify-center" :class="size.summaryRatingGap">
                  <i class="fa fa-star text-warning-400" :class="size.ratingIcon"></i>
                  <p class="font-bold text-warning-600" :class="size.ratingValue">
                    {{ station.stationGradeScore }}
                  </p>
                </div>
              </div>
            </div>
            <div class="text-center">
              <p
                class="station-detail-label font-medium uppercase tracking-wide text-surface-500 dark:text-surface-400"
                :class="size.summaryLabel"
              >
                {{ t('状态') }}
              </p>
              <span
                class="inline-flex items-center rounded-full font-bold"
                :class="[size.statusBadge, stationStatus(station).tone]"
                >{{
                  t(isEnglish && station.openStatus === 0 ? '维护' : stationStatus(station).text)
                }}</span
              >
            </div>
          </div>
        </div>
      </div>
      <div class="animate-in delay-100" :class="[size.cardMb, size.rowsGap]">
        <div
          class="info-row group transition-colors duration-200 hover:bg-surface-100/80 dark:hover:bg-surface-800/80"
        >
          <div
            class="flex items-center justify-center bg-primary-100 transition-transform duration-200 group-hover:scale-105 dark:bg-primary-900/30"
            :class="size.rowIcon"
          >
            <i class="fa fa-clock-o text-primary-500" :class="size.rowGlyph" aria-hidden="true"></i>
          </div>
          <div class="flex-1">
            <p class="mb-0.5 text-surface-500 dark:text-surface-400" :class="size.rowLabel">
              {{ t('营业时间') }}
            </p>
            <p class="font-semibold text-surface-800 dark:text-surface-200" :class="size.rowValue">
              {{ station.openTime }}
            </p>
          </div>
          <span
            v-if="
              station.reservationAvailable &&
              station.openStatus === 1 &&
              (station.quickAvailableNum > 0 || station.slowAvailableNum > 0)
            "
            class="status-badge-warning"
            :class="size.rowBadge"
            >{{ t('支持预约') }}</span
          >
        </div>
        <div
          class="info-row group transition-colors duration-200 hover:bg-surface-100/80 dark:hover:bg-surface-800/80"
        >
          <div
            class="flex items-center justify-center bg-secondary-100 transition-transform duration-200 group-hover:scale-105 dark:bg-secondary-900/30"
            :class="size.rowIcon"
          >
            <i class="fa fa-car text-secondary-500" :class="size.rowGlyph" aria-hidden="true"></i>
          </div>
          <div class="flex-1">
            <p class="mb-0.5 text-surface-500 dark:text-surface-400" :class="size.rowLabel">
              {{ t('停车费用') }}
            </p>
            <p class="font-semibold text-surface-800 dark:text-surface-200" :class="size.rowValue">
              {{ dataText(station.parkFee) }}
            </p>
          </div>
        </div>
        <div
          class="info-row group transition-colors duration-200 hover:bg-surface-100/80 dark:hover:bg-surface-800/80"
        >
          <div
            class="flex items-center justify-center bg-surface-100 transition-transform duration-200 group-hover:scale-105 dark:bg-surface-700"
            :class="size.rowIcon"
          >
            <i
              class="fa fa-phone text-surface-600 dark:text-surface-300"
              :class="size.rowGlyph"
              aria-hidden="true"
            ></i>
          </div>
          <div class="flex-1">
            <p class="mb-0.5 text-surface-500 dark:text-surface-400" :class="size.rowLabel">
              {{ t('联系电话') }}
            </p>
            <p class="font-semibold text-surface-800 dark:text-surface-200" :class="size.rowValue">
              {{ station.stationTel }}
            </p>
          </div>
        </div>
      </div>
      <div
        v-if="station.details && station.details.fastConnectors"
        class="animate-in delay-200"
        :class="size.cardMb"
      >
        <h3 class="section-title" :class="size.sectionTitle">
          <div
            class="flex items-center justify-center rounded-lg bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
            :class="[size.sectionIcon, size.sectionShadow]"
          >
            <i class="fa fa-bolt" :class="size.sectionGlyph" aria-hidden="true"></i>
          </div>
          {{ t('快充桩详情') }}
        </h3>
        <div :class="size.sectionList">
          <div
            v-for="(connector, index) in station.details.fastConnectors"
            :key="connector.id"
            class="premium-card animate-in group cursor-pointer transition-all duration-300 hover:shadow-soft-md"
            :class="size.itemPad"
            :style="{ animationDelay: `${index * 100}ms` }"
          >
            <div class="flex items-center justify-between">
              <div class="flex min-w-0 flex-1 items-center">
                <div
                  class="flex items-center justify-center shadow-inner-soft transition-transform duration-300 group-hover:scale-110"
                  :class="[size.connectorIcon, connectorStatus(connector.status).bgClass]"
                >
                  <i
                    class="fa fa-bolt"
                    :class="[size.connectorGlyph, connectorStatus(connector.status).iconClass]"
                    aria-hidden="true"
                  ></i>
                </div>
                <div class="min-w-0">
                  <h4
                    class="mb-0.5 truncate font-bold text-surface-800 dark:text-surface-200"
                    :class="size.connectorName"
                  >
                    {{ dataText(connector.connectorName) }}
                  </h4>
                  <p class="text-surface-500 dark:text-surface-400" :class="size.connectorMeta">
                    {{ connector.power }}kW · {{ connector.connectorType || 'CCS Combo' }}
                  </p>
                </div>
              </div>
              <span
                class="whitespace-nowrap rounded-full font-bold"
                :class="[size.connectorBadge, connectorStatus(connector.status).badgeClass]"
                >{{ t(connectorStatus(connector.status).text) }}</span
              >
            </div>
          </div>
        </div>
      </div>
      <div
        v-if="
          station.details &&
          station.details.slowConnectors &&
          station.details.slowConnectors.length > 0
        "
        class="animate-in delay-250"
        :class="size.cardMb"
      >
        <h3 class="section-title" :class="size.sectionTitle">
          <div
            class="flex items-center justify-center rounded-lg bg-surface-100 text-surface-600 dark:bg-surface-700 dark:text-surface-200"
            :class="[size.sectionIcon, size.sectionShadow]"
          >
            <i class="fa fa-plug" :class="size.sectionGlyph" aria-hidden="true"></i>
          </div>
          {{ t('慢充桩详情') }}
        </h3>
        <div :class="size.sectionList">
          <div
            v-for="(connector, index) in station.details.slowConnectors"
            :key="connector.id"
            class="premium-card animate-in group cursor-pointer transition-all duration-300 hover:shadow-soft-md"
            :class="size.itemPad"
            :style="{ animationDelay: `${index * 100}ms` }"
          >
            <div class="flex items-center justify-between">
              <div class="flex min-w-0 flex-1 items-center">
                <div
                  class="flex items-center justify-center shadow-inner-soft transition-transform duration-300 group-hover:scale-110"
                  :class="[size.connectorIcon, connectorStatus(connector.status).bgClass]"
                >
                  <i
                    class="fa fa-plug"
                    :class="[size.connectorGlyph, connectorStatus(connector.status).iconClass]"
                    aria-hidden="true"
                  ></i>
                </div>
                <div class="min-w-0">
                  <h4
                    class="mb-0.5 truncate font-bold text-surface-800 dark:text-surface-200"
                    :class="size.connectorName"
                  >
                    {{ dataText(connector.connectorName) }}
                  </h4>
                  <p class="text-surface-500 dark:text-surface-400" :class="size.connectorMeta">
                    {{ connector.power }}kW · {{ connector.connectorType || 'Type 2' }}
                  </p>
                </div>
              </div>
              <span
                class="whitespace-nowrap rounded-full font-bold"
                :class="[size.connectorBadge, connectorStatus(connector.status).badgeClass]"
                >{{ t(connectorStatus(connector.status).text) }}</span
              >
            </div>
          </div>
        </div>
      </div>
      <div
        v-if="station.details && station.details.periodPrices"
        class="animate-in delay-300"
        :class="size.cardMb"
      >
        <h3 class="section-title" :class="size.sectionTitle">
          <div
            class="flex items-center justify-center rounded-lg bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
            :class="[size.sectionIcon, size.sectionShadow]"
          >
            <i class="fa fa-rmb" :class="size.sectionGlyph" aria-hidden="true"></i>
          </div>
          {{ t('分时电价') }}
        </h3>
        <div class="premium-card overflow-hidden">
          <div
            v-for="(period, index) in station.details.periodPrices"
            :key="index"
            class="group flex items-center justify-between border-b border-surface-100 transition-colors duration-200 last:border-0 hover:bg-surface-50 dark:border-surface-700/50 dark:hover:bg-surface-800/50"
            :class="size.periodRow"
          >
            <div class="flex items-center">
              <div
                class="rounded-full transition-transform duration-300 group-hover:scale-125"
                :class="[size.periodDot, periodDotClass(index)]"
              ></div>
              <span
                class="font-medium text-surface-700 dark:text-surface-300"
                :class="size.periodTime"
                >{{ period.startTime }}~{{ period.endTime }}</span
              >
            </div>
            <div class="flex flex-wrap items-center justify-end gap-1.5">
              <span
                class="font-bold text-surface-900 dark:text-surface-100"
                :class="size.periodPrice"
                >¥{{ period.totalFee }}{{ t('/度') }}</span
              >
              <span
                v-if="period.memberPrice"
                class="rounded-full bg-primary-100 font-bold text-primary-600 dark:bg-primary-900/30 dark:text-primary-400"
                :class="size.periodBadge"
                >{{ t('会员¥{price}', { price: period.memberPrice }) }}</span
              >
            </div>
          </div>
        </div>
      </div>
      <div
        v-if="station.details && station.details.reviews && station.details.reviews.length > 0"
        class="animate-in delay-400"
        :class="size.cardMb"
      >
        <h3 class="section-title" :class="size.sectionTitle">
          <div
            class="flex items-center justify-center rounded-lg bg-surface-100 text-surface-600 dark:bg-surface-700 dark:text-surface-200"
            :class="[size.sectionIcon, size.sectionShadow]"
          >
            <i class="fa fa-comments" :class="size.sectionGlyph" aria-hidden="true"></i>
          </div>
          {{ t('用户评价') }}
          <span class="font-normal text-surface-400" :class="size.reviewCount">{{
            t('({count}条)', {
              count: station.details.reviewsCount || station.details.reviews.length
            })
          }}</span>
        </h3>
        <div :class="size.reviewList">
          <div
            v-for="(review, index) in station.details.reviews"
            :key="review.id"
            class="premium-card animate-in transition-all duration-300 hover:shadow-soft-md"
            :class="size.itemPad"
            :style="{ animationDelay: `${index * 150}ms` }"
          >
            <div class="flex items-start justify-between" :class="size.reviewHead">
              <div class="flex items-center">
                <div
                  class="flex items-center justify-center rounded-full bg-surface-100 text-surface-600 dark:bg-surface-700 dark:text-surface-200"
                  :class="size.reviewAvatar"
                >
                  <i class="fa fa-user" :class="size.reviewAvatarGlyph" aria-hidden="true"></i>
                </div>
                <p
                  class="font-bold text-surface-800 dark:text-surface-200"
                  :class="size.reviewName"
                >
                  {{ dataText(review.userName) }}
                </p>
              </div>
              <div class="rating-stars flex" :class="size.reviewStarWrap">
                <span
                  v-for="i in 5"
                  :key="i"
                  class="star"
                  :class="[size.reviewStar, i <= review.rating ? 'active' : '']"
                >
                  <i class="fa fa-star" aria-hidden="true"></i>
                </span>
              </div>
            </div>
            <p
              class="leading-relaxed text-surface-600 dark:text-surface-300"
              :class="size.reviewText"
            >
              {{ dataText(review.content) }}
            </p>
            <p class="text-surface-400" :class="size.reviewDate">{{ review.date }}</p>
          </div>
        </div>
      </div>
      <div v-if="station.details" class="animate-in delay-500" :class="size.guideBottom">
        <h3 class="section-title" :class="size.sectionTitle">
          <div
            class="flex items-center justify-center rounded-lg bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
            :class="[size.sectionIcon, size.sectionShadow]"
          >
            <i class="fa fa-map-marker" :class="size.sectionGlyph" aria-hidden="true"></i>
          </div>
          {{ t('站点指引') }}
        </h3>
        <div class="premium-card" :class="size.guidePad">
          <div class="flex items-start">
            <div
              class="flex flex-shrink-0 items-center justify-center rounded-full bg-info-100 dark:bg-info-900/30"
              :class="size.guideIcon"
            >
              <i
                class="fa fa-info-circle text-info-500"
                :class="size.guideGlyph"
                aria-hidden="true"
              ></i>
            </div>
            <p
              class="leading-relaxed text-surface-600 dark:text-surface-300"
              :class="size.guideText"
            >
              {{ siteGuide(station.details.siteGuide) }}
            </p>
          </div>
        </div>
      </div>
    </div>
    <div
      v-if="station"
      class="glass-effect flex-shrink-0 border-t border-surface-200/50 dark:border-surface-700/50"
      :class="size.footer"
    >
      <div class="grid grid-cols-2" :class="size.footerGrid">
        <button
          class="rounded-xl border border-surface-200 bg-white font-semibold text-surface-700 transition-colors hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-200 dark:hover:bg-surface-800"
          :class="[size.actionPad, size.actionText]"
          :disabled="!canReserve"
          @click="$emit('start-reservation')"
        >
          <span class="relative z-10 flex items-center justify-center" :class="size.actionInner">
            <i class="fa fa-calendar-check-o" :class="size.actionGlyph" aria-hidden="true"></i>
            <span>{{ t(canReserve ? '预约充电' : '暂不可预约') }}</span>
          </span>
        </button>
        <button
          class="rounded-xl border border-primary-200 bg-primary-50 font-semibold text-primary-700 transition-colors hover:bg-primary-100 dark:border-primary-800 dark:bg-primary-900/30 dark:text-primary-300 dark:hover:bg-primary-900/50"
          :class="[size.actionPad, size.actionText]"
          @click="$emit('navigate')"
        >
          <span class="relative z-10 flex items-center justify-center" :class="size.actionInner">
            <i class="fa fa-location-arrow" :class="size.actionGlyph" aria-hidden="true"></i>
            <span>{{ t('导航') }}</span>
          </span>
        </button>
      </div>
      <button
        class="w-full rounded-xl bg-primary-600 font-semibold text-white transition-colors hover:bg-primary-700 active:bg-primary-800"
        :class="size.primaryPad"
        :disabled="!canCharge"
        @click="$emit('start-charging')"
      >
        <span class="relative z-10 flex items-center justify-center" :class="size.primaryInner">
          <i class="fa fa-bolt" :class="size.primaryGlyph" aria-hidden="true"></i>
          <span>{{
            t(
              canCharge ? '选择充电桩' : station.detailsLoaded ? '暂无可用充电桩' : '正在加载充电桩'
            )
          }}</span>
        </span>
      </button>
    </div>
  </component>
</template>

<script setup>
import PanelShell from '../common/PanelShell.vue'
import { computed, inject, ref } from 'vue'
import { isEnglish, t } from '../../i18n'
import { stationName, stationAddress, dataText, siteGuide } from '../../i18n/data'
import { useStationsStore } from '../../store/modules/stations'
import { formatDistance, formatPrice } from '../../utils/format'
import { connectorStatus, periodDotClass, stationStatus } from '../../utils/stationStatus'

const SIZE_CLASSES = {
  sheet: {
    contentPad: 'p-5',
    errorPad: 'p-4',
    cardMb: 'mb-6',
    heroPad: 'p-4 sm:p-5',
    heroHead: 'mb-4',
    heroIcon: 'h-11 w-11',
    heroGlyph: 'text-base',
    heroLabel: 'mb-1 text-xs',
    heroTitle: 'font-semibold',
    tileGrid: 'mb-4 gap-3',
    tileRadius: 'rounded-xl',
    tilePad: 'px-2 py-3 sm:p-4',
    tileIcon: 'mb-2 h-8 w-8',
    tileRoadGlyph: 'text-xs',
    tileBoltGlyph: 'text-sm',
    tileLabel: 'mb-1 text-xs',
    tileValue: 'text-xl',
    tileUnit: 'text-xs',
    summaryGrid: 'gap-4',
    summaryLabel: 'mb-1.5 text-xs',
    summaryValue: 'text-lg',
    summaryUnit: 'text-xs',
    ratingPad: 'px-1 sm:px-4',
    ratingIcon: 'text-sm',
    ratingValue: 'text-lg',
    summaryRatingGap: 'space-x-1',
    statusBadge: 'px-1.5 py-1 text-[11px] sm:px-2.5 sm:text-xs',
    rowsGap: 'space-y-3',
    rowIcon: 'mr-3.5 h-9 w-9 rounded-xl',
    rowGlyph: 'text-sm',
    rowLabel: 'text-xs',
    rowValue: 'text-sm',
    rowBadge: 'text-[10px]',
    sectionTitle: '',
    sectionIcon: 'mr-2.5 h-7 w-7 rounded-lg',
    sectionShadow: '',
    sectionGlyph: 'text-xs',
    sectionList: 'space-y-2.5',
    itemPad: 'p-4',
    connectorIcon: 'mr-3.5 h-12 w-12 rounded-xl',
    connectorGlyph: 'text-lg',
    connectorName: 'text-sm',
    connectorMeta: 'text-xs',
    connectorBadge: 'ml-3 px-3 py-1.5 text-xs',
    periodRow: 'p-4',
    periodDot: 'mr-3 h-2.5 w-2.5',
    periodTime: 'text-sm',
    periodPrice: 'text-base',
    periodBadge: 'px-2 py-1 text-[10px]',
    reviewCount: 'ml-2 text-xs',
    reviewList: 'space-y-3',
    reviewHead: 'mb-3',
    reviewAvatar: 'mr-3 h-10 w-10',
    reviewAvatarGlyph: 'text-xs',
    reviewName: 'text-sm',
    reviewStar: 'text-sm',
    reviewStarWrap: 'items-center',
    reviewText: 'mb-2 text-sm',
    reviewDate: 'text-xs',
    guideBottom: 'pb-4',
    guidePad: 'p-5',
    guideIcon: 'mr-3 mt-0.5 h-6 w-6',
    guideGlyph: 'text-xs',
    guideText: 'text-sm',
    footer: 'space-y-2.5 p-4 lg:space-y-3 lg:p-5',
    footerGrid: 'gap-3',
    actionPad: 'py-3 lg:py-3.5',
    actionText: '',
    actionInner: 'space-x-2',
    actionGlyph: '',
    primaryPad: 'py-3.5 lg:py-4',
    primaryInner: 'space-x-2.5 text-base',
    primaryGlyph: 'text-lg'
  },
  inline: {
    contentPad: 'p-4',
    errorPad: 'p-3',
    cardMb: 'mb-4',
    heroPad: 'p-4',
    heroHead: 'mb-3',
    heroIcon: 'h-10 w-10',
    heroGlyph: 'text-sm',
    heroLabel: 'mb-0.5 text-[10px]',
    heroTitle: 'text-sm font-semibold',
    tileGrid: 'mb-3 gap-2',
    tileRadius: 'rounded-lg',
    tilePad: 'p-3',
    tileIcon: 'mb-1.5 h-7 w-7',
    tileRoadGlyph: 'text-[10px]',
    tileBoltGlyph: 'text-xs',
    tileLabel: 'mb-1 text-xs',
    tileValue: 'text-lg',
    tileUnit: 'text-[10px]',
    summaryGrid: 'gap-3',
    summaryLabel: 'mb-1 text-xs',
    summaryValue: 'text-sm',
    summaryUnit: 'text-[10px]',
    ratingPad: 'px-2',
    ratingIcon: 'text-xs',
    ratingValue: 'text-sm',
    summaryRatingGap: 'space-x-0.5',
    statusBadge: 'px-2 py-0.5 text-[10px]',
    rowsGap: 'space-y-2',
    rowIcon: 'mr-3 h-8 w-8 rounded-lg',
    rowGlyph: 'text-xs',
    rowLabel: 'text-xs',
    rowValue: 'text-xs',
    rowBadge: 'text-[9px]',
    sectionTitle: 'text-sm',
    sectionIcon: 'mr-2 h-6 w-6 rounded-md',
    sectionShadow: '',
    sectionGlyph: 'text-[10px]',
    sectionList: 'space-y-2',
    itemPad: 'p-3',
    connectorIcon: 'mr-3 h-10 w-10 rounded-lg',
    connectorGlyph: 'text-sm',
    connectorName: 'text-xs',
    connectorMeta: 'text-[10px]',
    connectorBadge: 'ml-2 px-2 py-1 text-[10px]',
    periodRow: 'p-3',
    periodDot: 'mr-2 h-2 w-2',
    periodTime: 'text-xs',
    periodPrice: 'text-sm',
    periodBadge: 'px-1.5 py-0.5 text-[9px]',
    reviewCount: 'ml-1 text-[10px]',
    reviewList: 'space-y-2',
    reviewHead: 'mb-2',
    reviewAvatar: 'mr-2 h-8 w-8',
    reviewAvatarGlyph: 'text-[10px]',
    reviewName: 'text-xs',
    reviewStar: 'text-[10px]',
    reviewStarWrap: '',
    reviewText: 'mb-1 text-xs',
    reviewDate: 'text-[10px]',
    guideBottom: 'pb-2',
    guidePad: 'p-4',
    guideIcon: 'mr-2 mt-0.5 h-5 w-5',
    guideGlyph: 'text-[9px]',
    guideText: 'text-xs',
    footer: 'space-y-2 p-3',
    footerGrid: 'gap-2',
    actionPad: 'py-2.5',
    actionText: 'text-sm',
    actionInner: 'space-x-1.5',
    actionGlyph: 'text-xs',
    primaryPad: 'py-3 text-sm',
    primaryInner: 'space-x-2',
    primaryGlyph: ''
  }
}

const props = defineProps({ variant: { type: String, default: 'sheet' } })

const _emit = defineEmits(['close', 'start-reservation', 'start-charging', 'navigate'])
const stationsStore = useStationsStore()
const showToast = inject('showToast')
const station = computed(() => stationsStore.currentStation)
const canCharge = computed(
  () =>
    station.value?.openStatus === 1 &&
    station.value.detailsLoaded &&
    Number.isFinite(station.value.currentPrice) &&
    [
      ...(station.value.details?.fastConnectors || []),
      ...(station.value.details?.slowConnectors || [])
    ].some((connector) => connector.status === 1)
)
const canReserve = computed(() => canCharge.value && station.value.reservationAvailable)
const isRetryingDetails = ref(false)
const isInline = computed(() => {
  if (import.meta.env.DEV && props.variant !== 'sheet' && props.variant !== 'inline') {
    console.warn(`[StationDetail] Unknown variant "${props.variant}", falling back to "sheet"`)
  }
  return props.variant === 'inline'
})
const size = computed(() => (isInline.value ? SIZE_CLASSES.inline : SIZE_CLASSES.sheet))

const retryDetails = async () => {
  if (!station.value || isRetryingDetails.value) return
  isRetryingDetails.value = true
  try {
    await stationsStore.loadStationDetails(station.value.stationId)
  } finally {
    isRetryingDetails.value = false
  }
}

const toggleFavorite = () => {
  if (station.value) {
    const wasFavorite = station.value.isFavorite
    stationsStore.toggleFavorite(station.value.stationId)
    showToast(wasFavorite ? '已取消收藏' : '已添加收藏', 'success')
  }
}

const shareStation = async () => {
  if (!station.value) return

  const url = window.location.href
  const shareData = {
    title: stationName(station.value.stationName),
    text: t('推荐充电站: {name} - {address}', {
      name: stationName(station.value.stationName),
      address: stationAddress(station.value.address)
    }),
    url
  }

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share(shareData)
    } catch (error) {
      if (error?.name !== 'AbortError') {
        showToast('分享失败，请手动复制地址栏链接', 'warning')
      }
    }
    return
  }

  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(url)
      showToast('分享链接已复制到剪贴板', 'success')
    } catch {
      showToast('复制失败，请手动复制地址栏链接', 'warning')
    }
    return
  }

  showToast('请手动复制地址栏链接', 'warning')
}
</script>
