<script setup lang="ts">
import { formatDuration, intervalToDuration } from 'date-fns'
import { getFieldTooltip, getCacheNameTooltip, getForwardReasonTooltip, formatTooltip } from '~/utils/tooltips'

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

const cacheAnalysis = computed(() =>
  getCacheAnalysis(props.cacheHeaders, now.value),
)

const handleDataKeyHover = (dataKey: string, rawValue: boolean | number | string | Date | null | undefined) => {
  if (props.enableDiffOnHover) {
    setHover(dataKey, rawValue)
  }
}

const handleDataKeyLeave = () => {
  clearHover()
}

const handleKeyDown = (event: KeyboardEvent, dataKey: string, rawValue: boolean | number | string | Date | null | undefined) => {
  // Handle Enter and Space keys for keyboard accessibility
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    handleDataKeyHover(dataKey, rawValue)
  }
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
  <div class="container">
    <div>
      <span
        class="tooltip-trigger"
        role="button"
        tabindex="0"
        :title="formatTooltip(getFieldTooltip('served-by'))"
        :aria-label="`Served by: ${getFieldTooltip('served-by').text}`"
        @keydown="(event) => { if (event.key === 'Enter' || event.key === ' ') event.preventDefault(); }"
      >Served by:</span> <strong>{{ cacheAnalysis.servedBy.source }}</strong>
    </div>
    <div>
      <span
        class="tooltip-trigger"
        role="button"
        tabindex="0"
        :title="formatTooltip(getFieldTooltip('cdn-nodes'))"
        :aria-label="`CDN nodes: ${getFieldTooltip('cdn-nodes').text}`"
        @keydown="(event) => { if (event.key === 'Enter' || event.key === ' ') event.preventDefault(); }"
      >CDN node(s):</span> <code>{{ cacheAnalysis.servedBy.cdnNodes }}</code>
    </div>

    <hr />

    <dl>
      <dt class="cache-heading">
        <h4>
          <span aria-hidden="true">🎬</span><span class="sr-only">Start:</span> Request from client
          <br />
          <span aria-hidden="true">↓</span>
        </h4>
      </dt>
      <dd />

      <template
        v-for="(
          { cacheName, parameters }, cacheIndex
        ) in cacheAnalysis.cacheStatus"
        :key="cacheIndex"
      >
        <!-- This is a bit of a hack to use the pretty <dt> styling but with sections. -->
        <!-- I should probably just do something custom instead. -->
        <dt class="cache-heading">
          <h4
            tabindex="0"
            role="button"
            class="cache-name-heading"
            :title="formatTooltip(getCacheNameTooltip(cacheName))"
            :aria-label="`${cacheName} cache: ${getCacheNameTooltip(cacheName).text}`"
            @keydown="(event) => { if (event.key === 'Enter' || event.key === ' ') event.preventDefault(); }"
          >
            ↳ <em>{{ cacheName }}</em> cache
          </h4>
        </dt>
        <dd />

        <dt
          class="data-key"
          role="button"
          tabindex="0"
          :class="{ 'key-highlighted': isKeyHovered(`Hit-${cacheIndex}`) }"
          :title="formatTooltip(getFieldTooltip('hit'))"
          :aria-label="`Hit: ${getFieldTooltip('hit').text}`"
          @mouseenter="handleDataKeyHover(`Hit-${cacheIndex}`, parameters.hit)"
          @mouseleave="handleDataKeyLeave"
          @focus="handleDataKeyHover(`Hit-${cacheIndex}`, parameters.hit)"
          @blur="handleDataKeyLeave"
          @keydown="handleKeyDown($event, `Hit-${cacheIndex}`, parameters.hit)"
        >
          Hit
        </dt>
        <dd
          class="data-value"
          :class="{
            'key-highlighted': isKeyHovered(`Hit-${cacheIndex}`),
            'value-matching': isKeyHovered(`Hit-${cacheIndex}`) && isValueMatching(parameters.hit),
            'value-different': isKeyHovered(`Hit-${cacheIndex}`) && !isValueMatching(parameters.hit),
          }"
        >
          <span aria-hidden="true">{{ parameters.hit ? "✅" : "❌" }}</span>
          <span class="sr-only">{{ parameters.hit ? "Yes" : "No" }}</span>
        </dd>

        <template v-if="parameters.fwd">
          <dt
            class="data-key"
            role="button"
            tabindex="0"
            :class="{ 'key-highlighted': isKeyHovered(`Forwarded because-${cacheIndex}`) }"
            :title="formatTooltip(getFieldTooltip('forwarded-because'))"
            :aria-label="`Forwarded because: ${getFieldTooltip('forwarded-because').text}`"
            @mouseenter="handleDataKeyHover(`Forwarded because-${cacheIndex}`, parameters.fwd)"
            @mouseleave="handleDataKeyLeave"
            @focus="handleDataKeyHover(`Forwarded because-${cacheIndex}`, parameters.fwd)"
            @blur="handleDataKeyLeave"
            @keydown="handleKeyDown($event, `Forwarded because-${cacheIndex}`, parameters.fwd)"
          >
            Forwarded because
          </dt>
          <dd
            class="data-value"
            :class="{
              'key-highlighted': isKeyHovered(`Forwarded because-${cacheIndex}`),
              'value-matching': isKeyHovered(`Forwarded because-${cacheIndex}`) && isValueMatching(parameters.fwd),
              'value-different': isKeyHovered(`Forwarded because-${cacheIndex}`) && !isValueMatching(parameters.fwd),
            }"
            :title="formatTooltip(getForwardReasonTooltip(parameters.fwd))"
          >
            {{ parameters.fwd }}
          </dd>
        </template>

        <template v-if="parameters['fwd-status']">
          <dt
            class="data-key"
            role="button"
            tabindex="0"
            :class="{ 'key-highlighted': isKeyHovered(`Forwarded status-${cacheIndex}`) }"
            :title="formatTooltip(getFieldTooltip('forwarded-status'))"
            :aria-label="`Forwarded status: ${getFieldTooltip('forwarded-status').text}`"
            @mouseenter="handleDataKeyHover(`Forwarded status-${cacheIndex}`, parameters['fwd-status'])"
            @mouseleave="handleDataKeyLeave"
            @focus="handleDataKeyHover(`Forwarded status-${cacheIndex}`, parameters['fwd-status'])"
            @blur="handleDataKeyLeave"
            @keydown="handleKeyDown($event, `Forwarded status-${cacheIndex}`, parameters['fwd-status'])"
          >
            Forwarded status
          </dt>
          <dd
            class="data-value"
            :class="{
              'key-highlighted': isKeyHovered(`Forwarded status-${cacheIndex}`),
              'value-matching': isKeyHovered(`Forwarded status-${cacheIndex}`) && isValueMatching(parameters['fwd-status']),
              'value-different': isKeyHovered(`Forwarded status-${cacheIndex}`) && !isValueMatching(parameters['fwd-status']),
            }"
          >
            {{ parameters["fwd-status"] }}
          </dd>
        </template>

        <template v-if="parameters.ttl">
          <dt
            class="data-key"
            role="button"
            tabindex="0"
            :class="{ 'key-highlighted': isKeyHovered(`TTL-${cacheIndex}`) }"
            :title="formatTooltip(getFieldTooltip('ttl'))"
            :aria-label="`TTL: ${getFieldTooltip('ttl').text}`"
            @mouseenter="handleDataKeyHover(`TTL-${cacheIndex}`, parameters.ttl)"
            @mouseleave="handleDataKeyLeave"
            @focus="handleDataKeyHover(`TTL-${cacheIndex}`, parameters.ttl)"
            @blur="handleDataKeyLeave"
            @keydown="handleKeyDown($event, `TTL-${cacheIndex}`, parameters.ttl)"
          >
            TTL
          </dt>
          <dd
            class="data-value"
            :class="{
              'key-highlighted': isKeyHovered(`TTL-${cacheIndex}`),
              'value-matching': isKeyHovered(`TTL-${cacheIndex}`) && isValueMatching(parameters.ttl),
              'value-different': isKeyHovered(`TTL-${cacheIndex}`) && !isValueMatching(parameters.ttl),
            }"
            :title="formatHumanSeconds(parameters.ttl)"
          >
            {{ formatSeconds(parameters.ttl) }}
            <span
              v-if="isKeyHovered(`TTL-${cacheIndex}`) && !isValueMatching(parameters.ttl) && getDelta(parameters.ttl)"
              class="delta"
            >
              ({{ getDelta(parameters.ttl) }})
            </span>
          </dd>
        </template>

        <template v-if="parameters.stored">
          <dt
            class="data-key"
            role="button"
            tabindex="0"
            :class="{ 'key-highlighted': isKeyHovered(`Stored the response-${cacheIndex}`) }"
            :title="formatTooltip(getFieldTooltip('stored-response'))"
            :aria-label="`Stored the response: ${getFieldTooltip('stored-response').text}`"
            @mouseenter="handleDataKeyHover(`Stored the response-${cacheIndex}`, parameters.stored)"
            @mouseleave="handleDataKeyLeave"
            @focus="handleDataKeyHover(`Stored the response-${cacheIndex}`, parameters.stored)"
            @blur="handleDataKeyLeave"
            @keydown="handleKeyDown($event, `Stored the response-${cacheIndex}`, parameters.stored)"
          >
            Stored the response
          </dt>
          <dd
            class="data-value"
            :class="{
              'key-highlighted': isKeyHovered(`Stored the response-${cacheIndex}`),
              'value-matching': isKeyHovered(`Stored the response-${cacheIndex}`) && isValueMatching(parameters.stored),
              'value-different': isKeyHovered(`Stored the response-${cacheIndex}`) && !isValueMatching(parameters.stored),
            }"
          >
            <span aria-hidden="true">{{ parameters.stored ? "✅" : "❌" }}</span>
            <span class="sr-only">{{ parameters.stored ? "Yes" : "No" }}</span>
          </dd>
        </template>

        <template v-if="parameters.collapsed">
          <dt
            class="data-key"
            role="button"
            tabindex="0"
            :class="{ 'key-highlighted': isKeyHovered(`Collapsed w/ other reqs-${cacheIndex}`) }"
            :title="formatTooltip(getFieldTooltip('collapsed-requests'))"
            :aria-label="`Collapsed with other requests: ${getFieldTooltip('collapsed-requests').text}`"
            @mouseenter="handleDataKeyHover(`Collapsed w/ other reqs-${cacheIndex}`, parameters.collapsed)"
            @mouseleave="handleDataKeyLeave"
            @focus="handleDataKeyHover(`Collapsed w/ other reqs-${cacheIndex}`, parameters.collapsed)"
            @blur="handleDataKeyLeave"
            @keydown="handleKeyDown($event, `Collapsed w/ other reqs-${cacheIndex}`, parameters.collapsed)"
          >
            Collapsed w/ other reqs
          </dt>
          <dd
            class="data-value"
            :class="{
              'key-highlighted': isKeyHovered(`Collapsed w/ other reqs-${cacheIndex}`),
              'value-matching': isKeyHovered(`Collapsed w/ other reqs-${cacheIndex}`) && isValueMatching(parameters.collapsed),
              'value-different': isKeyHovered(`Collapsed w/ other reqs-${cacheIndex}`) && !isValueMatching(parameters.collapsed),
            }"
          >
            <span aria-hidden="true">{{ parameters.collapsed ? "✅" : "❌" }}</span>
            <span class="sr-only">{{ parameters.collapsed ? "Yes" : "No" }}</span>
          </dd>
        </template>

        <template v-if="parameters.key">
          <dt
            class="data-key"
            role="button"
            tabindex="0"
            :class="{ 'key-highlighted': isKeyHovered(`Cache key-${cacheIndex}`) }"
            :title="formatTooltip(getFieldTooltip('cache-key'))"
            :aria-label="`Cache key: ${getFieldTooltip('cache-key').text}`"
            @mouseenter="handleDataKeyHover(`Cache key-${cacheIndex}`, parameters.key)"
            @mouseleave="handleDataKeyLeave"
            @focus="handleDataKeyHover(`Cache key-${cacheIndex}`, parameters.key)"
            @blur="handleDataKeyLeave"
            @keydown="handleKeyDown($event, `Cache key-${cacheIndex}`, parameters.key)"
          >
            Cache key
          </dt>
          <dd
            class="data-value"
            :class="{
              'key-highlighted': isKeyHovered(`Cache key-${cacheIndex}`),
              'value-matching': isKeyHovered(`Cache key-${cacheIndex}`) && isValueMatching(parameters.key),
              'value-different': isKeyHovered(`Cache key-${cacheIndex}`) && !isValueMatching(parameters.key),
            }"
          >
            {{ parameters.key }}
          </dd>
        </template>

        <template v-if="parameters.detail">
          <dt
            class="data-key"
            role="button"
            tabindex="0"
            :class="{ 'key-highlighted': isKeyHovered(`Extra details-${cacheIndex}`) }"
            :title="formatTooltip(getFieldTooltip('extra-details'))"
            :aria-label="`Extra details: ${getFieldTooltip('extra-details').text}`"
            @mouseenter="handleDataKeyHover(`Extra details-${cacheIndex}`, parameters.detail)"
            @mouseleave="handleDataKeyLeave"
            @focus="handleDataKeyHover(`Extra details-${cacheIndex}`, parameters.detail)"
            @blur="handleDataKeyLeave"
            @keydown="handleKeyDown($event, `Extra details-${cacheIndex}`, parameters.detail)"
          >
            Extra details
          </dt>
          <dd
            class="data-value"
            :class="{
              'key-highlighted': isKeyHovered(`Extra details-${cacheIndex}`),
              'value-matching': isKeyHovered(`Extra details-${cacheIndex}`) && isValueMatching(parameters.detail),
              'value-different': isKeyHovered(`Extra details-${cacheIndex}`) && !isValueMatching(parameters.detail),
            }"
          >
            {{ parameters.detail }}
          </dd>
        </template>
      </template>

      <dt class="cache-heading">
        <h4>
          <span aria-hidden="true">↓</span>
          <br />
          <span aria-hidden="true">🏁</span><span class="sr-only">End:</span> Response to client
        </h4>
      </dt>
      <dd />

      <dt
        class="data-key"
        role="button"
        tabindex="0"
        :class="{ 'key-highlighted': isKeyHovered('Cacheable') }"
        :title="formatTooltip(getFieldTooltip('cacheable'))"
        :aria-label="`Cacheable: ${getFieldTooltip('cacheable').text}`"
        @mouseenter="handleDataKeyHover('Cacheable', cacheAnalysis.cacheControl.isCacheable)"
        @mouseleave="handleDataKeyLeave"
        @focus="handleDataKeyHover('Cacheable', cacheAnalysis.cacheControl.isCacheable)"
        @blur="handleDataKeyLeave"
        @keydown="handleKeyDown($event, 'Cacheable', cacheAnalysis.cacheControl.isCacheable)"
      >
        Cacheable
      </dt>
      <dd
        class="data-value"
        :class="{
          'key-highlighted': isKeyHovered('Cacheable'),
          'value-matching': isKeyHovered('Cacheable') && isValueMatching(cacheAnalysis.cacheControl.isCacheable),
          'value-different': isKeyHovered('Cacheable') && !isValueMatching(cacheAnalysis.cacheControl.isCacheable),
        }"
      >
        <span aria-hidden="true">{{ cacheAnalysis.cacheControl.isCacheable ? "✅" : "❌" }}</span>
        <span class="sr-only">{{ cacheAnalysis.cacheControl.isCacheable ? "Yes" : "No" }}</span>
      </dd>

      <template v-if="cacheAnalysis.cacheControl.age">
        <dt
          class="data-key"
          role="button"
          tabindex="0"
          :class="{ 'key-highlighted': isKeyHovered('Age') }"
          :title="formatTooltip(getFieldTooltip('age'))"
          :aria-label="`Age: ${getFieldTooltip('age').text}`"
          @mouseenter="handleDataKeyHover('Age', cacheAnalysis.cacheControl.age)"
          @mouseleave="handleDataKeyLeave"
          @focus="handleDataKeyHover('Age', cacheAnalysis.cacheControl.age)"
          @blur="handleDataKeyLeave"
          @keydown="handleKeyDown($event, 'Age', cacheAnalysis.cacheControl.age)"
        >
          Age
        </dt>
        <dd
          class="data-value"
          :class="{
            'key-highlighted': isKeyHovered('Age'),
            'value-matching': isKeyHovered('Age') && isValueMatching(cacheAnalysis.cacheControl.age),
            'value-different': isKeyHovered('Age') && !isValueMatching(cacheAnalysis.cacheControl.age),
          }"
          :title="formatHumanSeconds(cacheAnalysis.cacheControl.age)"
        >
          {{ formatSeconds(cacheAnalysis.cacheControl.age) }}
          <span
            v-if="isKeyHovered('Age') && !isValueMatching(cacheAnalysis.cacheControl.age) && getDelta(cacheAnalysis.cacheControl.age)"
            class="delta"
          >
            ({{ getDelta(cacheAnalysis.cacheControl.age) }})
          </span>
        </dd>
      </template>

      <template v-if="cacheAnalysis.cacheControl.date">
        <dt
          class="data-key"
          role="button"
          tabindex="0"
          :class="{ 'key-highlighted': isKeyHovered('Date') }"
          :title="formatTooltip(getFieldTooltip('date'))"
          :aria-label="`Date: ${getFieldTooltip('date').text}`"
          @mouseenter="handleDataKeyHover('Date', cacheAnalysis.cacheControl.date)"
          @mouseleave="handleDataKeyLeave"
          @focus="handleDataKeyHover('Date', cacheAnalysis.cacheControl.date)"
          @blur="handleDataKeyLeave"
          @keydown="handleKeyDown($event, 'Date', cacheAnalysis.cacheControl.date)"
        >
          Date
        </dt>
        <dd
          class="data-value"
          :class="{
            'key-highlighted': isKeyHovered('Date'),
            'value-matching': isKeyHovered('Date') && isValueMatching(cacheAnalysis.cacheControl.date),
            'value-different': isKeyHovered('Date') && !isValueMatching(cacheAnalysis.cacheControl.date),
          }"
        >
          {{ formatDate(cacheAnalysis.cacheControl.date) }}
          <span
            v-if="isKeyHovered('Date') && !isValueMatching(cacheAnalysis.cacheControl.date) && getDelta(cacheAnalysis.cacheControl.date)"
            class="delta"
          >
            ({{ getDelta(cacheAnalysis.cacheControl.date) }})
          </span>
        </dd>
      </template>

      <template v-if="cacheAnalysis.cacheControl.etag">
        <dt
          class="data-key"
          role="button"
          tabindex="0"
          :class="{ 'key-highlighted': isKeyHovered('ETag') }"
          :title="formatTooltip(getFieldTooltip('etag'))"
          :aria-label="`ETag: ${getFieldTooltip('etag').text}`"
          @mouseenter="handleDataKeyHover('ETag', cacheAnalysis.cacheControl.etag)"
          @mouseleave="handleDataKeyLeave"
          @focus="handleDataKeyHover('ETag', cacheAnalysis.cacheControl.etag)"
          @blur="handleDataKeyLeave"
          @keydown="handleKeyDown($event, 'ETag', cacheAnalysis.cacheControl.etag)"
        >
          ETag
        </dt>
        <dd
          class="data-value"
          :class="{
            'key-highlighted': isKeyHovered('ETag'),
            'value-matching': isKeyHovered('ETag') && isValueMatching(cacheAnalysis.cacheControl.etag),
            'value-different': isKeyHovered('ETag') && !isValueMatching(cacheAnalysis.cacheControl.etag),
          }"
        >
          <code>{{ cacheAnalysis.cacheControl.etag }}</code>
        </dd>
      </template>

      <template v-if="cacheAnalysis.cacheControl.expiresAt">
        <dt
          class="data-key"
          role="button"
          tabindex="0"
          :class="{ 'key-highlighted': isKeyHovered('Expires at') }"
          :title="formatTooltip(getFieldTooltip('expires-at'))"
          :aria-label="`Expires at: ${getFieldTooltip('expires-at').text}`"
          @mouseenter="handleDataKeyHover('Expires at', cacheAnalysis.cacheControl.expiresAt)"
          @mouseleave="handleDataKeyLeave"
          @focus="handleDataKeyHover('Expires at', cacheAnalysis.cacheControl.expiresAt)"
          @blur="handleDataKeyLeave"
          @keydown="handleKeyDown($event, 'Expires at', cacheAnalysis.cacheControl.expiresAt)"
        >
          Expires at
        </dt>
        <dd
          class="data-value"
          :class="{
            'key-highlighted': isKeyHovered('Expires at'),
            'value-matching': isKeyHovered('Expires at') && isValueMatching(cacheAnalysis.cacheControl.expiresAt),
            'value-different': isKeyHovered('Expires at') && !isValueMatching(cacheAnalysis.cacheControl.expiresAt),
          }"
        >
          {{ formatDate(cacheAnalysis.cacheControl.expiresAt) }}
          <span
            v-if="isKeyHovered('Expires at') && !isValueMatching(cacheAnalysis.cacheControl.expiresAt) && getDelta(cacheAnalysis.cacheControl.expiresAt)"
            class="delta"
          >
            ({{ getDelta(cacheAnalysis.cacheControl.expiresAt) }})
          </span>
        </dd>
      </template>

      <template v-if="cacheAnalysis.cacheControl.ttl">
        <dt
          class="data-key"
          role="button"
          tabindex="0"
          :class="{ 'key-highlighted': isKeyHovered('TTL (browser)') }"
          :title="formatTooltip(getFieldTooltip('ttl-browser'))"
          :aria-label="`TTL (browser): ${getFieldTooltip('ttl-browser').text}`"
          @mouseenter="handleDataKeyHover('TTL (browser)', cacheAnalysis.cacheControl.ttl)"
          @mouseleave="handleDataKeyLeave"
          @focus="handleDataKeyHover('TTL (browser)', cacheAnalysis.cacheControl.ttl)"
          @blur="handleDataKeyLeave"
          @keydown="handleKeyDown($event, 'TTL (browser)', cacheAnalysis.cacheControl.ttl)"
        >
          TTL{{
            cacheAnalysis.cacheControl.netlifyCdnTtl
              || cacheAnalysis.cacheControl.cdnTtl
              ? " (browser)"
              : ""
          }}
        </dt>
        <dd
          class="data-value"
          :class="{
            'key-highlighted': isKeyHovered('TTL (browser)'),
            'value-matching': isKeyHovered('TTL (browser)') && isValueMatching(cacheAnalysis.cacheControl.ttl),
            'value-different': isKeyHovered('TTL (browser)') && !isValueMatching(cacheAnalysis.cacheControl.ttl),
          }"
          :title="formatHumanSeconds(cacheAnalysis.cacheControl.ttl)"
        >
          {{ formatSeconds(cacheAnalysis.cacheControl.ttl) }}
          <span
            v-if="isKeyHovered('TTL (browser)') && !isValueMatching(cacheAnalysis.cacheControl.ttl) && getDelta(cacheAnalysis.cacheControl.ttl)"
            class="delta"
          >
            ({{ getDelta(cacheAnalysis.cacheControl.ttl) }})
          </span>
        </dd>
      </template>

      <template v-if="cacheAnalysis.cacheControl.cdnTtl">
        <dt
          class="data-key"
          role="button"
          tabindex="0"
          :class="{ 'key-highlighted': isKeyHovered('TTL (CDN)') }"
          :title="formatTooltip(getFieldTooltip('ttl-cdn'))"
          :aria-label="`TTL (CDN): ${getFieldTooltip('ttl-cdn').text}`"
          @mouseenter="handleDataKeyHover('TTL (CDN)', cacheAnalysis.cacheControl.cdnTtl)"
          @mouseleave="handleDataKeyLeave"
          @focus="handleDataKeyHover('TTL (CDN)', cacheAnalysis.cacheControl.cdnTtl)"
          @blur="handleDataKeyLeave"
          @keydown="handleKeyDown($event, 'TTL (CDN)', cacheAnalysis.cacheControl.cdnTtl)"
        >
          TTL ({{
            cacheAnalysis.cacheControl.netlifyCdnTtl
              ? "other CDNs"
              : "Netlify CDN"
          }})
        </dt>
        <dd
          class="data-value"
          :class="{
            'key-highlighted': isKeyHovered('TTL (CDN)'),
            'value-matching': isKeyHovered('TTL (CDN)') && isValueMatching(cacheAnalysis.cacheControl.cdnTtl),
            'value-different': isKeyHovered('TTL (CDN)') && !isValueMatching(cacheAnalysis.cacheControl.cdnTtl),
          }"
          :title="formatHumanSeconds(cacheAnalysis.cacheControl.cdnTtl)"
        >
          {{ formatSeconds(cacheAnalysis.cacheControl.cdnTtl) }}
          <span
            v-if="isKeyHovered('TTL (CDN)') && !isValueMatching(cacheAnalysis.cacheControl.cdnTtl) && getDelta(cacheAnalysis.cacheControl.cdnTtl)"
            class="delta"
          >
            ({{ getDelta(cacheAnalysis.cacheControl.cdnTtl) }})
          </span>
        </dd>
      </template>

      <template v-if="cacheAnalysis.cacheControl.netlifyCdnTtl">
        <dt
          class="data-key"
          role="button"
          tabindex="0"
          :class="{ 'key-highlighted': isKeyHovered('TTL (Netlify CDN)') }"
          :title="formatTooltip(getFieldTooltip('ttl-netlify-cdn'))"
          :aria-label="`TTL (Netlify CDN): ${getFieldTooltip('ttl-netlify-cdn').text}`"
          @mouseenter="handleDataKeyHover('TTL (Netlify CDN)', cacheAnalysis.cacheControl.netlifyCdnTtl)"
          @mouseleave="handleDataKeyLeave"
          @focus="handleDataKeyHover('TTL (Netlify CDN)', cacheAnalysis.cacheControl.netlifyCdnTtl)"
          @blur="handleDataKeyLeave"
          @keydown="handleKeyDown($event, 'TTL (Netlify CDN)', cacheAnalysis.cacheControl.netlifyCdnTtl)"
        >
          TTL (Netlify CDN)
        </dt>
        <dd
          class="data-value"
          :class="{
            'key-highlighted': isKeyHovered('TTL (Netlify CDN)'),
            'value-matching': isKeyHovered('TTL (Netlify CDN)') && isValueMatching(cacheAnalysis.cacheControl.netlifyCdnTtl),
            'value-different': isKeyHovered('TTL (Netlify CDN)') && !isValueMatching(cacheAnalysis.cacheControl.netlifyCdnTtl),
          }"
          :title="formatHumanSeconds(cacheAnalysis.cacheControl.netlifyCdnTtl)"
        >
          {{ formatSeconds(cacheAnalysis.cacheControl.netlifyCdnTtl) }}
          <span
            v-if="isKeyHovered('TTL (Netlify CDN)') && !isValueMatching(cacheAnalysis.cacheControl.netlifyCdnTtl) && getDelta(cacheAnalysis.cacheControl.netlifyCdnTtl)"
            class="delta"
          >
            ({{ getDelta(cacheAnalysis.cacheControl.netlifyCdnTtl) }})
          </span>
        </dd>
      </template>

      <template v-if="cacheAnalysis.cacheControl.vary">
        <dt
          class="data-key"
          role="button"
          tabindex="0"
          :class="{ 'key-highlighted': isKeyHovered('Vary') }"
          :title="formatTooltip(getFieldTooltip('vary'))"
          :aria-label="`Vary: ${getFieldTooltip('vary').text}`"
          @mouseenter="handleDataKeyHover('Vary', cacheAnalysis.cacheControl.vary)"
          @mouseleave="handleDataKeyLeave"
          @focus="handleDataKeyHover('Vary', cacheAnalysis.cacheControl.vary)"
          @blur="handleDataKeyLeave"
          @keydown="handleKeyDown($event, 'Vary', cacheAnalysis.cacheControl.vary)"
        >
          Vary
        </dt>
        <dd
          class="data-value"
          :class="{
            'key-highlighted': isKeyHovered('Vary'),
            'value-matching': isKeyHovered('Vary') && isValueMatching(cacheAnalysis.cacheControl.vary),
            'value-different': isKeyHovered('Vary') && !isValueMatching(cacheAnalysis.cacheControl.vary),
          }"
        >
          <code>{{ cacheAnalysis.cacheControl.vary }}</code>
        </dd>
      </template>

      <template v-if="cacheAnalysis.cacheControl.netlifyVary">
        <dt
          class="data-key"
          role="button"
          tabindex="0"
          :class="{ 'key-highlighted': isKeyHovered('Netlify-Vary') }"
          :title="formatTooltip(getFieldTooltip('netlify-vary'))"
          :aria-label="`Netlify-Vary: ${getFieldTooltip('netlify-vary').text}`"
          @mouseenter="handleDataKeyHover('Netlify-Vary', cacheAnalysis.cacheControl.netlifyVary)"
          @mouseleave="handleDataKeyLeave"
          @focus="handleDataKeyHover('Netlify-Vary', cacheAnalysis.cacheControl.netlifyVary)"
          @blur="handleDataKeyLeave"
          @keydown="handleKeyDown($event, 'Netlify-Vary', cacheAnalysis.cacheControl.netlifyVary)"
        >
          Netlify-Vary
        </dt>
        <dd
          class="data-value"
          :class="{
            'key-highlighted': isKeyHovered('Netlify-Vary'),
            'value-matching': isKeyHovered('Netlify-Vary') && isValueMatching(cacheAnalysis.cacheControl.netlifyVary),
            'value-different': isKeyHovered('Netlify-Vary') && !isValueMatching(cacheAnalysis.cacheControl.netlifyVary),
          }"
        >
          <code>{{ cacheAnalysis.cacheControl.netlifyVary }}</code>
        </dd>
      </template>

      <template v-if="cacheAnalysis.cacheControl.revalidate">
        <dt
          class="data-key"
          role="button"
          tabindex="0"
          :class="{ 'key-highlighted': isKeyHovered('Revalidation') }"
          :title="formatTooltip(getFieldTooltip('revalidation'))"
          :aria-label="`Revalidation: ${getFieldTooltip('revalidation').text}`"
          @mouseenter="handleDataKeyHover('Revalidation', cacheAnalysis.cacheControl.revalidate)"
          @mouseleave="handleDataKeyLeave"
          @focus="handleDataKeyHover('Revalidation', cacheAnalysis.cacheControl.revalidate)"
          @blur="handleDataKeyLeave"
          @keydown="handleKeyDown($event, 'Revalidation', cacheAnalysis.cacheControl.revalidate)"
        >
          Revalidation
        </dt>
        <dd
          class="data-value"
          :class="{
            'key-highlighted': isKeyHovered('Revalidation'),
            'value-matching': isKeyHovered('Revalidation') && isValueMatching(cacheAnalysis.cacheControl.revalidate),
            'value-different': isKeyHovered('Revalidation') && !isValueMatching(cacheAnalysis.cacheControl.revalidate),
          }"
        >
          <code>{{ cacheAnalysis.cacheControl.revalidate }}</code>
        </dd>
      </template>
    </dl>
  </div>
</template>

<style scoped>
.container {
  font-size: 0.9em;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

hr {
  margin-top: 0.5em;
}

dt {
  margin-left: 1em;
}

dt.cache-heading {
  margin-left: 1em;
}

dt.cache-heading h4 {
  padding: 0;
  /* I'm sorry */
  margin-left: -0.5em;

  font-size: 1.1em;
}

dt.cache-heading h4.cache-name-heading {
  cursor: help;
  display: inline-block;
}

dt.cache-heading h4.cache-name-heading:focus {
  outline: 2px solid rgb(59, 130, 246);
  outline-offset: 2px;
  border-radius: 4px;
  background-color: rgba(59, 130, 246, 0.1);
}

/* Default Netlify Examples styles add ": " */
.cache-heading::after {
  content: none;
}

dd code {
  font-size: 0.8em;
  overflow-wrap: anywhere;
}

/* Hover highlighting styles */
.data-key {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.data-key:hover {
  background-color: rgba(59, 130, 246, 0.1);
}

.data-key:focus {
  outline: 2px solid rgb(59, 130, 246);
  outline-offset: 2px;
  background-color: rgba(59, 130, 246, 0.15);
}

.data-key.key-highlighted {
  background-color: rgba(59, 130, 246, 0.2);
  font-weight: 600;
}

.data-value.key-highlighted {
  transition: background-color 0.2s ease;
}

.data-value.value-matching {
  background-color: rgba(34, 197, 94, 0.2);
  border-left: 3px solid rgb(34, 197, 94);
  padding-left: 0.5em;
}

.data-value.value-different {
  background-color: rgba(239, 68, 68, 0.1);
  border-left: 3px solid rgb(239, 68, 68);
  padding-left: 0.5em;
}

/* Delta display styles */
.delta {
  font-size: 0.8em;
  font-weight: 500;
  color: rgb(107, 114, 128);
  margin-left: 0.25em;
}

/* Tooltip trigger accessibility styles */
.tooltip-trigger {
  cursor: help;
  text-decoration: underline;
  text-decoration-style: dotted;
  text-decoration-color: rgba(107, 114, 128, 0.5);
  text-underline-offset: 2px;
}

.tooltip-trigger:focus {
  outline: 2px solid rgb(59, 130, 246);
  outline-offset: 2px;
  border-radius: 2px;
  background-color: rgba(59, 130, 246, 0.1);
}

.tooltip-trigger:hover {
  text-decoration-color: rgba(107, 114, 128, 0.8);
}
</style>
