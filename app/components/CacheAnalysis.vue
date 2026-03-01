<script setup lang="ts">
import { formatDuration, intervalToDuration } from 'date-fns'
import {
  getFieldTooltip,
  getCacheNameTooltip,
  getForwardReasonTooltip,
  formatTooltip,
} from '~/utils/tooltips'

const props = defineProps<{
  cacheHeaders: Record<string, string>
  enableDiffOnHover: boolean
}>()

const { setHover, clearHover, isKeyHovered, isValueMatching, getDelta } = useDataHover()

const formatSeconds = (seconds: number): string => {
  return `${seconds} s`
}

const formatHumanSeconds = (seconds: number): string => {
  const d = new Date() // arbitrary date
  return formatDuration(
    intervalToDuration({
      start: d,
      end: new Date(d.getTime() + Math.abs(seconds) * 1000),
    }),
  )
}

const formatDate = (date: Date): string =>
  // TODO(serhalp) This results in a hydration mismatch error since the locale is different on the
  // server than in the user's browser... I'm not sure how to solve this, but the impact is pretty minor.
  date.toLocaleString(undefined, {
    timeZoneName: 'short',
  })

const now = ref(Date.now())

const cacheAnalysis = computed(() => getCacheAnalysis(props.cacheHeaders, now.value))

const handleDataKeyHover = (
  dataKey: string,
  rawValue: boolean | number | string | Date | null | undefined,
) => {
  if (props.enableDiffOnHover) {
    setHover(dataKey, rawValue)
  }
}

const handleDataKeyLeave = () => {
  clearHover()
}

let timerId: NodeJS.Timeout | null = null

onMounted(() => {
  timerId = setInterval(() => {
    now.value = Date.now()
  }, 1000)
})

onUnmounted(() => {
  if (timerId) clearInterval(timerId)
})
</script>

<template>
  <div class="text-sm">
    <div class="mb-1">
      <span
        class="tooltip-trigger"
        tabindex="0"
        :title="formatTooltip(getFieldTooltip('served-by'))"
        :aria-label="`Served by: ${getFieldTooltip('served-by').text}`"
        >Served by:</span
      >
      <strong class="text-neutral-800 dark:text-neutral-100">{{
        cacheAnalysis.servedBy.source
      }}</strong>
    </div>
    <div class="mb-3">
      <span
        class="tooltip-trigger"
        tabindex="0"
        :title="formatTooltip(getFieldTooltip('cdn-nodes'))"
        :aria-label="`CDN nodes: ${getFieldTooltip('cdn-nodes').text}`"
        >CDN node(s):</span
      >
      <code class="inline-code">{{ cacheAnalysis.servedBy.cdnNodes }}</code>
    </div>

    <hr class="separator" />

    <dl class="space-y-0">
      <div class="lifecycle-step">
        <span class="lifecycle-icon">&#x25B6;</span>
        <span class="mono-label">Request from client</span>
      </div>

      <div class="lifecycle-flow">
        <template
          v-for="({ cacheName, parameters }, cacheIndex) in cacheAnalysis.cacheStatus"
          :key="cacheIndex"
        >
          <h4
            tabindex="0"
            class="cache-heading"
            :title="formatTooltip(getCacheNameTooltip(cacheName))"
          >
            <span class="step-number">{{ cacheIndex + 1 }}</span>
            {{ cacheName }} cache
          </h4>

          <div class="cache-children">
            <div class="data-row" :class="{ 'row-highlighted': isKeyHovered(`Hit-${cacheIndex}`) }">
              <dt
                class="data-key"
                tabindex="0"
                :title="formatTooltip(getFieldTooltip('hit'))"
                @mouseenter="handleDataKeyHover(`Hit-${cacheIndex}`, parameters.hit)"
                @mouseleave="handleDataKeyLeave"
                @focus="handleDataKeyHover(`Hit-${cacheIndex}`, parameters.hit)"
                @blur="handleDataKeyLeave"
              >
                Hit
              </dt>
              <dd
                class="data-value"
                :class="{
                  'value-matching':
                    isKeyHovered(`Hit-${cacheIndex}`) && isValueMatching(parameters.hit),
                  'value-different':
                    isKeyHovered(`Hit-${cacheIndex}`) && !isValueMatching(parameters.hit),
                }"
              >
                <span :class="parameters.hit ? 'text-green-400' : 'text-red-500'">{{
                  parameters.hit ? 'Yes' : 'No'
                }}</span>
              </dd>
            </div>

            <template v-if="parameters.fwd">
              <div
                class="data-row"
                :class="{ 'row-highlighted': isKeyHovered(`Forwarded because-${cacheIndex}`) }"
              >
                <dt
                  class="data-key"
                  tabindex="0"
                  :title="formatTooltip(getFieldTooltip('forwarded-because'))"
                  @mouseenter="
                    handleDataKeyHover(`Forwarded because-${cacheIndex}`, parameters.fwd)
                  "
                  @mouseleave="handleDataKeyLeave"
                  @focus="handleDataKeyHover(`Forwarded because-${cacheIndex}`, parameters.fwd)"
                  @blur="handleDataKeyLeave"
                >
                  <span class="label-full">Forwarded because</span>
                  <span class="label-short">Fwd because</span>
                </dt>
                <dd
                  class="data-value"
                  :class="{
                    'value-matching':
                      isKeyHovered(`Forwarded because-${cacheIndex}`) &&
                      isValueMatching(parameters.fwd),
                    'value-different':
                      isKeyHovered(`Forwarded because-${cacheIndex}`) &&
                      !isValueMatching(parameters.fwd),
                  }"
                  :title="formatTooltip(getForwardReasonTooltip(parameters.fwd))"
                >
                  {{ parameters.fwd }}
                </dd>
              </div>
            </template>

            <template v-if="parameters['fwd-status']">
              <div
                class="data-row"
                :class="{ 'row-highlighted': isKeyHovered(`Forwarded status-${cacheIndex}`) }"
              >
                <dt
                  class="data-key"
                  tabindex="0"
                  :title="formatTooltip(getFieldTooltip('forwarded-status'))"
                  @mouseenter="
                    handleDataKeyHover(`Forwarded status-${cacheIndex}`, parameters['fwd-status'])
                  "
                  @mouseleave="handleDataKeyLeave"
                  @focus="
                    handleDataKeyHover(`Forwarded status-${cacheIndex}`, parameters['fwd-status'])
                  "
                  @blur="handleDataKeyLeave"
                >
                  <span class="label-full">Forwarded status</span>
                  <span class="label-short">Fwd status</span>
                </dt>
                <dd
                  class="data-value"
                  :class="{
                    'value-matching':
                      isKeyHovered(`Forwarded status-${cacheIndex}`) &&
                      isValueMatching(parameters['fwd-status']),
                    'value-different':
                      isKeyHovered(`Forwarded status-${cacheIndex}`) &&
                      !isValueMatching(parameters['fwd-status']),
                  }"
                >
                  {{ parameters['fwd-status'] }}
                </dd>
              </div>
            </template>

            <template v-if="parameters.ttl">
              <div
                class="data-row"
                :class="{ 'row-highlighted': isKeyHovered(`TTL-${cacheIndex}`) }"
              >
                <dt
                  class="data-key"
                  tabindex="0"
                  :title="formatTooltip(getFieldTooltip('ttl'))"
                  @mouseenter="handleDataKeyHover(`TTL-${cacheIndex}`, parameters.ttl)"
                  @mouseleave="handleDataKeyLeave"
                  @focus="handleDataKeyHover(`TTL-${cacheIndex}`, parameters.ttl)"
                  @blur="handleDataKeyLeave"
                >
                  TTL
                </dt>
                <dd
                  class="data-value"
                  :class="{
                    'value-matching':
                      isKeyHovered(`TTL-${cacheIndex}`) && isValueMatching(parameters.ttl),
                    'value-different':
                      isKeyHovered(`TTL-${cacheIndex}`) && !isValueMatching(parameters.ttl),
                  }"
                  :title="formatHumanSeconds(parameters.ttl)"
                >
                  {{ formatSeconds(parameters.ttl) }}
                  <span
                    v-if="
                      isKeyHovered(`TTL-${cacheIndex}`) &&
                      !isValueMatching(parameters.ttl) &&
                      getDelta(parameters.ttl)
                    "
                    class="delta"
                  >
                    ({{ getDelta(parameters.ttl) }})
                  </span>
                </dd>
              </div>
            </template>

            <template v-if="parameters.stored">
              <div
                class="data-row"
                :class="{ 'row-highlighted': isKeyHovered(`Stored the response-${cacheIndex}`) }"
              >
                <dt
                  class="data-key"
                  tabindex="0"
                  :title="formatTooltip(getFieldTooltip('stored-response'))"
                  @mouseenter="
                    handleDataKeyHover(`Stored the response-${cacheIndex}`, parameters.stored)
                  "
                  @mouseleave="handleDataKeyLeave"
                  @focus="
                    handleDataKeyHover(`Stored the response-${cacheIndex}`, parameters.stored)
                  "
                  @blur="handleDataKeyLeave"
                >
                  Stored the response
                </dt>
                <dd
                  class="data-value"
                  :class="{
                    'value-matching':
                      isKeyHovered(`Stored the response-${cacheIndex}`) &&
                      isValueMatching(parameters.stored),
                    'value-different':
                      isKeyHovered(`Stored the response-${cacheIndex}`) &&
                      !isValueMatching(parameters.stored),
                  }"
                >
                  <span :class="parameters.stored ? 'text-green-400' : 'text-red-500'">{{
                    parameters.stored ? 'Yes' : 'No'
                  }}</span>
                </dd>
              </div>
            </template>

            <template v-if="parameters.collapsed">
              <div
                class="data-row"
                :class="{
                  'row-highlighted': isKeyHovered(`Collapsed w/ other reqs-${cacheIndex}`),
                }"
              >
                <dt
                  class="data-key"
                  tabindex="0"
                  :title="formatTooltip(getFieldTooltip('collapsed-requests'))"
                  @mouseenter="
                    handleDataKeyHover(
                      `Collapsed w/ other reqs-${cacheIndex}`,
                      parameters.collapsed,
                    )
                  "
                  @mouseleave="handleDataKeyLeave"
                  @focus="
                    handleDataKeyHover(
                      `Collapsed w/ other reqs-${cacheIndex}`,
                      parameters.collapsed,
                    )
                  "
                  @blur="handleDataKeyLeave"
                >
                  Collapsed w/ other reqs
                </dt>
                <dd
                  class="data-value"
                  :class="{
                    'value-matching':
                      isKeyHovered(`Collapsed w/ other reqs-${cacheIndex}`) &&
                      isValueMatching(parameters.collapsed),
                    'value-different':
                      isKeyHovered(`Collapsed w/ other reqs-${cacheIndex}`) &&
                      !isValueMatching(parameters.collapsed),
                  }"
                >
                  <span :class="parameters.collapsed ? 'text-green-400' : 'text-red-500'">{{
                    parameters.collapsed ? 'Yes' : 'No'
                  }}</span>
                </dd>
              </div>
            </template>

            <template v-if="parameters.key">
              <div
                class="data-row"
                :class="{ 'row-highlighted': isKeyHovered(`Cache key-${cacheIndex}`) }"
              >
                <dt
                  class="data-key"
                  tabindex="0"
                  :title="formatTooltip(getFieldTooltip('cache-key'))"
                  @mouseenter="handleDataKeyHover(`Cache key-${cacheIndex}`, parameters.key)"
                  @mouseleave="handleDataKeyLeave"
                  @focus="handleDataKeyHover(`Cache key-${cacheIndex}`, parameters.key)"
                  @blur="handleDataKeyLeave"
                >
                  Cache key
                </dt>
                <dd
                  class="data-value"
                  :class="{
                    'value-matching':
                      isKeyHovered(`Cache key-${cacheIndex}`) && isValueMatching(parameters.key),
                    'value-different':
                      isKeyHovered(`Cache key-${cacheIndex}`) && !isValueMatching(parameters.key),
                  }"
                >
                  {{ parameters.key }}
                </dd>
              </div>
            </template>

            <template v-if="parameters.detail">
              <div
                class="data-row"
                :class="{ 'row-highlighted': isKeyHovered(`Extra details-${cacheIndex}`) }"
              >
                <dt
                  class="data-key"
                  tabindex="0"
                  :title="formatTooltip(getFieldTooltip('extra-details'))"
                  @mouseenter="handleDataKeyHover(`Extra details-${cacheIndex}`, parameters.detail)"
                  @mouseleave="handleDataKeyLeave"
                  @focus="handleDataKeyHover(`Extra details-${cacheIndex}`, parameters.detail)"
                  @blur="handleDataKeyLeave"
                >
                  Extra details
                </dt>
                <dd
                  class="data-value"
                  :class="{
                    'value-matching':
                      isKeyHovered(`Extra details-${cacheIndex}`) &&
                      isValueMatching(parameters.detail),
                    'value-different':
                      isKeyHovered(`Extra details-${cacheIndex}`) &&
                      !isValueMatching(parameters.detail),
                  }"
                >
                  {{ parameters.detail }}
                </dd>
              </div>
            </template>
          </div>
        </template>
      </div>

      <div class="lifecycle-step">
        <span class="lifecycle-icon">&#x2691;</span>
        <span class="mono-label">Response to client</span>
      </div>

      <div class="data-row" :class="{ 'row-highlighted': isKeyHovered('Cacheable') }">
        <dt
          class="data-key"
          tabindex="0"
          :title="formatTooltip(getFieldTooltip('cacheable'))"
          @mouseenter="handleDataKeyHover('Cacheable', cacheAnalysis.cacheControl.isCacheable)"
          @mouseleave="handleDataKeyLeave"
          @focus="handleDataKeyHover('Cacheable', cacheAnalysis.cacheControl.isCacheable)"
          @blur="handleDataKeyLeave"
        >
          Cacheable
        </dt>
        <dd
          class="data-value"
          :class="{
            'value-matching':
              isKeyHovered('Cacheable') && isValueMatching(cacheAnalysis.cacheControl.isCacheable),
            'value-different':
              isKeyHovered('Cacheable') && !isValueMatching(cacheAnalysis.cacheControl.isCacheable),
          }"
        >
          <span
            :class="cacheAnalysis.cacheControl.isCacheable ? 'text-green-400' : 'text-red-500'"
            >{{ cacheAnalysis.cacheControl.isCacheable ? 'Yes' : 'No' }}</span
          >
        </dd>
      </div>

      <template v-if="cacheAnalysis.cacheControl.age">
        <div class="data-row" :class="{ 'row-highlighted': isKeyHovered('Age') }">
          <dt
            class="data-key"
            tabindex="0"
            :title="formatTooltip(getFieldTooltip('age'))"
            @mouseenter="handleDataKeyHover('Age', cacheAnalysis.cacheControl.age)"
            @mouseleave="handleDataKeyLeave"
            @focus="handleDataKeyHover('Age', cacheAnalysis.cacheControl.age)"
            @blur="handleDataKeyLeave"
          >
            Age
          </dt>
          <dd
            class="data-value"
            :class="{
              'value-matching':
                isKeyHovered('Age') && isValueMatching(cacheAnalysis.cacheControl.age),
              'value-different':
                isKeyHovered('Age') && !isValueMatching(cacheAnalysis.cacheControl.age),
            }"
            :title="formatHumanSeconds(cacheAnalysis.cacheControl.age)"
          >
            {{ formatSeconds(cacheAnalysis.cacheControl.age) }}
            <span
              v-if="
                isKeyHovered('Age') &&
                !isValueMatching(cacheAnalysis.cacheControl.age) &&
                getDelta(cacheAnalysis.cacheControl.age)
              "
              class="delta"
            >
              ({{ getDelta(cacheAnalysis.cacheControl.age) }})
            </span>
          </dd>
        </div>
      </template>

      <template v-if="cacheAnalysis.cacheControl.date">
        <div class="data-row" :class="{ 'row-highlighted': isKeyHovered('Date') }">
          <dt
            class="data-key"
            tabindex="0"
            :title="formatTooltip(getFieldTooltip('date'))"
            @mouseenter="handleDataKeyHover('Date', cacheAnalysis.cacheControl.date)"
            @mouseleave="handleDataKeyLeave"
            @focus="handleDataKeyHover('Date', cacheAnalysis.cacheControl.date)"
            @blur="handleDataKeyLeave"
          >
            Date
          </dt>
          <dd
            class="data-value"
            :class="{
              'value-matching':
                isKeyHovered('Date') && isValueMatching(cacheAnalysis.cacheControl.date),
              'value-different':
                isKeyHovered('Date') && !isValueMatching(cacheAnalysis.cacheControl.date),
            }"
          >
            {{ formatDate(cacheAnalysis.cacheControl.date) }}
            <span
              v-if="
                isKeyHovered('Date') &&
                !isValueMatching(cacheAnalysis.cacheControl.date) &&
                getDelta(cacheAnalysis.cacheControl.date)
              "
              class="delta"
            >
              ({{ getDelta(cacheAnalysis.cacheControl.date) }})
            </span>
          </dd>
        </div>
      </template>

      <template v-if="cacheAnalysis.cacheControl.etag">
        <div class="data-row" :class="{ 'row-highlighted': isKeyHovered('ETag') }">
          <dt
            class="data-key"
            tabindex="0"
            :title="formatTooltip(getFieldTooltip('etag'))"
            @mouseenter="handleDataKeyHover('ETag', cacheAnalysis.cacheControl.etag)"
            @mouseleave="handleDataKeyLeave"
            @focus="handleDataKeyHover('ETag', cacheAnalysis.cacheControl.etag)"
            @blur="handleDataKeyLeave"
          >
            ETag
          </dt>
          <dd
            class="data-value"
            :class="{
              'value-matching':
                isKeyHovered('ETag') && isValueMatching(cacheAnalysis.cacheControl.etag),
              'value-different':
                isKeyHovered('ETag') && !isValueMatching(cacheAnalysis.cacheControl.etag),
            }"
          >
            <code class="inline-code">{{ cacheAnalysis.cacheControl.etag }}</code>
          </dd>
        </div>
      </template>

      <template v-if="cacheAnalysis.cacheControl.expiresAt">
        <div class="data-row" :class="{ 'row-highlighted': isKeyHovered('Expires at') }">
          <dt
            class="data-key"
            tabindex="0"
            :title="formatTooltip(getFieldTooltip('expires-at'))"
            @mouseenter="handleDataKeyHover('Expires at', cacheAnalysis.cacheControl.expiresAt)"
            @mouseleave="handleDataKeyLeave"
            @focus="handleDataKeyHover('Expires at', cacheAnalysis.cacheControl.expiresAt)"
            @blur="handleDataKeyLeave"
          >
            Expires at
          </dt>
          <dd
            class="data-value"
            :class="{
              'value-matching':
                isKeyHovered('Expires at') && isValueMatching(cacheAnalysis.cacheControl.expiresAt),
              'value-different':
                isKeyHovered('Expires at') &&
                !isValueMatching(cacheAnalysis.cacheControl.expiresAt),
            }"
          >
            {{ formatDate(cacheAnalysis.cacheControl.expiresAt) }}
            <span
              v-if="
                isKeyHovered('Expires at') &&
                !isValueMatching(cacheAnalysis.cacheControl.expiresAt) &&
                getDelta(cacheAnalysis.cacheControl.expiresAt)
              "
              class="delta"
            >
              ({{ getDelta(cacheAnalysis.cacheControl.expiresAt) }})
            </span>
          </dd>
        </div>
      </template>

      <template v-if="cacheAnalysis.cacheControl.ttl">
        <div class="data-row" :class="{ 'row-highlighted': isKeyHovered('TTL (browser)') }">
          <dt
            class="data-key"
            tabindex="0"
            :title="formatTooltip(getFieldTooltip('ttl-browser'))"
            @mouseenter="handleDataKeyHover('TTL (browser)', cacheAnalysis.cacheControl.ttl)"
            @mouseleave="handleDataKeyLeave"
            @focus="handleDataKeyHover('TTL (browser)', cacheAnalysis.cacheControl.ttl)"
            @blur="handleDataKeyLeave"
          >
            TTL{{
              cacheAnalysis.cacheControl.netlifyCdnTtl || cacheAnalysis.cacheControl.cdnTtl
                ? ' (browser)'
                : ''
            }}
          </dt>
          <dd
            class="data-value"
            :class="{
              'value-matching':
                isKeyHovered('TTL (browser)') && isValueMatching(cacheAnalysis.cacheControl.ttl),
              'value-different':
                isKeyHovered('TTL (browser)') && !isValueMatching(cacheAnalysis.cacheControl.ttl),
            }"
            :title="formatHumanSeconds(cacheAnalysis.cacheControl.ttl)"
          >
            {{ formatSeconds(cacheAnalysis.cacheControl.ttl) }}
            <span
              v-if="
                isKeyHovered('TTL (browser)') &&
                !isValueMatching(cacheAnalysis.cacheControl.ttl) &&
                getDelta(cacheAnalysis.cacheControl.ttl)
              "
              class="delta"
            >
              ({{ getDelta(cacheAnalysis.cacheControl.ttl) }})
            </span>
          </dd>
        </div>
      </template>

      <template v-if="cacheAnalysis.cacheControl.cdnTtl">
        <div class="data-row" :class="{ 'row-highlighted': isKeyHovered('TTL (CDN)') }">
          <dt
            class="data-key"
            tabindex="0"
            :title="formatTooltip(getFieldTooltip('ttl-cdn'))"
            @mouseenter="handleDataKeyHover('TTL (CDN)', cacheAnalysis.cacheControl.cdnTtl)"
            @mouseleave="handleDataKeyLeave"
            @focus="handleDataKeyHover('TTL (CDN)', cacheAnalysis.cacheControl.cdnTtl)"
            @blur="handleDataKeyLeave"
          >
            TTL ({{ cacheAnalysis.cacheControl.netlifyCdnTtl ? 'other CDNs' : 'Netlify CDN' }})
          </dt>
          <dd
            class="data-value"
            :class="{
              'value-matching':
                isKeyHovered('TTL (CDN)') && isValueMatching(cacheAnalysis.cacheControl.cdnTtl),
              'value-different':
                isKeyHovered('TTL (CDN)') && !isValueMatching(cacheAnalysis.cacheControl.cdnTtl),
            }"
            :title="formatHumanSeconds(cacheAnalysis.cacheControl.cdnTtl)"
          >
            {{ formatSeconds(cacheAnalysis.cacheControl.cdnTtl) }}
            <span
              v-if="
                isKeyHovered('TTL (CDN)') &&
                !isValueMatching(cacheAnalysis.cacheControl.cdnTtl) &&
                getDelta(cacheAnalysis.cacheControl.cdnTtl)
              "
              class="delta"
            >
              ({{ getDelta(cacheAnalysis.cacheControl.cdnTtl) }})
            </span>
          </dd>
        </div>
      </template>

      <template v-if="cacheAnalysis.cacheControl.netlifyCdnTtl">
        <div class="data-row" :class="{ 'row-highlighted': isKeyHovered('TTL (Netlify CDN)') }">
          <dt
            class="data-key"
            tabindex="0"
            :title="formatTooltip(getFieldTooltip('ttl-netlify-cdn'))"
            @mouseenter="
              handleDataKeyHover('TTL (Netlify CDN)', cacheAnalysis.cacheControl.netlifyCdnTtl)
            "
            @mouseleave="handleDataKeyLeave"
            @focus="
              handleDataKeyHover('TTL (Netlify CDN)', cacheAnalysis.cacheControl.netlifyCdnTtl)
            "
            @blur="handleDataKeyLeave"
          >
            TTL (Netlify CDN)
          </dt>
          <dd
            class="data-value"
            :class="{
              'value-matching':
                isKeyHovered('TTL (Netlify CDN)') &&
                isValueMatching(cacheAnalysis.cacheControl.netlifyCdnTtl),
              'value-different':
                isKeyHovered('TTL (Netlify CDN)') &&
                !isValueMatching(cacheAnalysis.cacheControl.netlifyCdnTtl),
            }"
            :title="formatHumanSeconds(cacheAnalysis.cacheControl.netlifyCdnTtl)"
          >
            {{ formatSeconds(cacheAnalysis.cacheControl.netlifyCdnTtl) }}
            <span
              v-if="
                isKeyHovered('TTL (Netlify CDN)') &&
                !isValueMatching(cacheAnalysis.cacheControl.netlifyCdnTtl) &&
                getDelta(cacheAnalysis.cacheControl.netlifyCdnTtl)
              "
              class="delta"
            >
              ({{ getDelta(cacheAnalysis.cacheControl.netlifyCdnTtl) }})
            </span>
          </dd>
        </div>
      </template>

      <template v-if="cacheAnalysis.cacheControl.vary">
        <div class="data-row" :class="{ 'row-highlighted': isKeyHovered('Vary') }">
          <dt
            class="data-key"
            tabindex="0"
            :title="formatTooltip(getFieldTooltip('vary'))"
            @mouseenter="handleDataKeyHover('Vary', cacheAnalysis.cacheControl.vary)"
            @mouseleave="handleDataKeyLeave"
            @focus="handleDataKeyHover('Vary', cacheAnalysis.cacheControl.vary)"
            @blur="handleDataKeyLeave"
          >
            Vary
          </dt>
          <dd
            class="data-value"
            :class="{
              'value-matching':
                isKeyHovered('Vary') && isValueMatching(cacheAnalysis.cacheControl.vary),
              'value-different':
                isKeyHovered('Vary') && !isValueMatching(cacheAnalysis.cacheControl.vary),
            }"
          >
            <code class="inline-code">{{ cacheAnalysis.cacheControl.vary }}</code>
          </dd>
        </div>
      </template>

      <template v-if="cacheAnalysis.cacheControl.netlifyVary">
        <div class="data-row" :class="{ 'row-highlighted': isKeyHovered('Netlify-Vary') }">
          <dt
            class="data-key"
            tabindex="0"
            :title="formatTooltip(getFieldTooltip('netlify-vary'))"
            @mouseenter="handleDataKeyHover('Netlify-Vary', cacheAnalysis.cacheControl.netlifyVary)"
            @mouseleave="handleDataKeyLeave"
            @focus="handleDataKeyHover('Netlify-Vary', cacheAnalysis.cacheControl.netlifyVary)"
            @blur="handleDataKeyLeave"
          >
            Netlify-Vary
          </dt>
          <dd
            class="data-value"
            :class="{
              'value-matching':
                isKeyHovered('Netlify-Vary') &&
                isValueMatching(cacheAnalysis.cacheControl.netlifyVary),
              'value-different':
                isKeyHovered('Netlify-Vary') &&
                !isValueMatching(cacheAnalysis.cacheControl.netlifyVary),
            }"
          >
            <code class="inline-code">{{ cacheAnalysis.cacheControl.netlifyVary }}</code>
          </dd>
        </div>
      </template>

      <template v-if="cacheAnalysis.cacheControl.revalidate">
        <div class="data-row" :class="{ 'row-highlighted': isKeyHovered('Revalidation') }">
          <dt
            class="data-key"
            tabindex="0"
            :title="formatTooltip(getFieldTooltip('revalidation'))"
            @mouseenter="handleDataKeyHover('Revalidation', cacheAnalysis.cacheControl.revalidate)"
            @mouseleave="handleDataKeyLeave"
            @focus="handleDataKeyHover('Revalidation', cacheAnalysis.cacheControl.revalidate)"
            @blur="handleDataKeyLeave"
          >
            Revalidation
          </dt>
          <dd
            class="data-value"
            :class="{
              'value-matching':
                isKeyHovered('Revalidation') &&
                isValueMatching(cacheAnalysis.cacheControl.revalidate),
              'value-different':
                isKeyHovered('Revalidation') &&
                !isValueMatching(cacheAnalysis.cacheControl.revalidate),
            }"
          >
            <code class="inline-code">{{ cacheAnalysis.cacheControl.revalidate }}</code>
          </dd>
        </div>
      </template>
    </dl>
  </div>
</template>

<style scoped>
.separator {
  border: none;
  height: 1px;
  background: #e9ebed;
  margin: 0.75rem 0;
}

:is(.dark) .separator {
  background: rgba(208, 255, 254, 0.08);
}

.lifecycle-step {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.5rem;
  margin-bottom: 0.25rem;
}

.lifecycle-icon {
  color: #05bdba;
  font-size: 0.7rem;
}

.cache-heading {
  font-family: 'Pacaembu', 'Poppins', sans-serif;
  font-weight: 700;
  font-size: 0.875rem;
  color: #016968;
  cursor: help;
  margin: 0.75rem 0 0;
  padding: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  position: relative;
}

:is(.dark) .cache-heading {
  color: #14d8d4;
}

.cache-heading:focus-visible {
  outline: 2px solid #05bdba;
  outline-offset: 2px;
  border-radius: 0.25rem;
}

.step-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 50%;
  background: #05bdba;
  color: white;
  font-family: 'Roboto Mono', monospace;
  font-size: 0.65rem;
  font-weight: 700;
  flex-shrink: 0;
  margin-left: -1.625rem;
}

:is(.dark) .step-number {
  background: #14d8d4;
  color: #0d1818;
}

.cache-children {
  margin-top: 0.125rem;
}

.lifecycle-flow {
  border-left: 2px dashed #d1d5da;
  margin-left: 0.45rem;
  padding-left: 1rem;
  padding-top: 0.25rem;
  padding-bottom: 0.25rem;
}

:is(.dark) .lifecycle-flow {
  border-color: rgba(208, 255, 254, 0.15);
}

.inline-code {
  font-family: 'Roboto Mono', monospace;
  font-size: 0.75rem;
  background-color: #f6f6f7;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  overflow-wrap: anywhere;
}

:is(.dark) .inline-code {
  background-color: rgba(255, 255, 255, 0.08);
}

.data-row {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  transition: background-color 0.15s ease;
}

.data-key {
  color: #545a61;
  font-weight: 500;
  min-width: 7rem;
  cursor: pointer;
  white-space: nowrap;
}

.cache-children .data-key {
  min-width: 10rem;
}

.label-short {
  display: none;
}

@container (max-width: 400px) {
  .label-full {
    display: none;
  }
  .label-short {
    display: inline;
  }
}

:is(.dark) .data-key {
  color: #d1d5da;
}

.data-key:focus-visible {
  outline: 2px solid #05bdba;
  outline-offset: 2px;
  border-radius: 0.25rem;
}

.data-value {
  color: #181a1c;
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  transition: all 0.15s ease;
  overflow-wrap: anywhere;
}

:is(.dark) .data-value {
  color: #e9ebed;
}

.row-highlighted {
  background-color: rgba(5, 189, 186, 0.06);
}

:is(.dark) .row-highlighted {
  background-color: rgba(5, 189, 186, 0.1);
}

.row-highlighted .data-key {
  font-weight: 700;
  color: #05bdba;
}

.value-matching {
  background-color: rgba(58, 195, 100, 0.12);
  border-left: 3px solid #3ac364;
  padding-left: 0.5rem;
}

.value-different {
  background-color: rgba(254, 78, 92, 0.08);
  border-left: 3px solid #fe4e5c;
  padding-left: 0.5rem;
}

.delta {
  font-size: 0.8em;
  font-weight: 500;
  color: #545a61;
  margin-left: 0.25em;
}

:is(.dark) .delta {
  color: #9da7b2;
}

.tooltip-trigger {
  cursor: help;
  text-decoration: underline;
  text-decoration-style: dotted;
  text-decoration-color: rgba(84, 90, 97, 0.6);
  text-underline-offset: 2px;
}

.tooltip-trigger:focus-visible {
  outline: 2px solid #05bdba;
  outline-offset: 2px;
  border-radius: 2px;
}

.tooltip-trigger:hover {
  text-decoration-color: rgba(84, 90, 97, 0.9);
}

:is(.dark) .tooltip-trigger {
  text-decoration-color: rgba(157, 167, 178, 0.5);
}

:is(.dark) .tooltip-trigger:hover {
  text-decoration-color: rgba(157, 167, 178, 0.8);
}
</style>
