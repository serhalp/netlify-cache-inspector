<script setup lang="ts">
import { formatDuration, intervalToDuration } from 'date-fns'

const props = defineProps<{
  cacheHeaders: Record<string, string>
}>()

const { setHover, clearHover, isKeyHovered, isValueMatching } = useDataHover()

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

// Helper function to handle hover events on data keys
const handleDataKeyHover = (dataKey: string, dataValue: string) => {
  setHover(dataKey, dataValue)
}

const handleDataKeyLeave = () => {
  clearHover()
}

// Helper function to get the display value for comparison
const getDisplayValue = (value: boolean | number | string | Date): string => {
  if (typeof value === 'boolean') {
    return value ? '✅' : '❌'
  }
  if (typeof value === 'number') {
    return formatSeconds(value)
  }
  if (value instanceof Date) {
    return formatDate(value)
  }
  return String(value)
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
      Served by: <strong>{{ cacheAnalysis.servedBy.source }}</strong>
    </div>
    <div>
      CDN node(s): <code>{{ cacheAnalysis.servedBy.cdnNodes }}</code>
    </div>

    <hr />

    <dl>
      <dt class="cache-heading">
        <h4>
          🎬 Request from client
          <br />
          ↓
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
          <h4>
            ↳ <em>{{ cacheName }}</em> cache
          </h4>
        </dt>
        <dd />

        <dt
          class="data-key"
          :class="{ 'key-highlighted': isKeyHovered('Hit') }"
          @mouseenter="handleDataKeyHover('Hit', getDisplayValue(parameters.hit))"
          @mouseleave="handleDataKeyLeave"
        >
          Hit
        </dt>
        <dd
          class="data-value"
          :class="{
            'key-highlighted': isKeyHovered('Hit'),
            'value-matching': isKeyHovered('Hit') && isValueMatching(getDisplayValue(parameters.hit)),
            'value-different': isKeyHovered('Hit') && !isValueMatching(getDisplayValue(parameters.hit)),
          }"
        >
          {{ parameters.hit ? "✅" : "❌" }}
        </dd>

        <template v-if="parameters.fwd">
          <dt
            class="data-key"
            :class="{ 'key-highlighted': isKeyHovered('Forwarded because') }"
            @mouseenter="handleDataKeyHover('Forwarded because', getDisplayValue(parameters.fwd))"
            @mouseleave="handleDataKeyLeave"
          >
            Forwarded because
          </dt>
          <dd
            class="data-value"
            :class="{
              'key-highlighted': isKeyHovered('Forwarded because'),
              'value-matching': isKeyHovered('Forwarded because') && isValueMatching(getDisplayValue(parameters.fwd)),
              'value-different': isKeyHovered('Forwarded because') && !isValueMatching(getDisplayValue(parameters.fwd)),
            }"
          >
            {{ parameters.fwd }}
          </dd>
        </template>

        <template v-if="parameters['fwd-status']">
          <dt
            class="data-key"
            :class="{ 'key-highlighted': isKeyHovered('Forwarded status') }"
            @mouseenter="handleDataKeyHover('Forwarded status', getDisplayValue(parameters['fwd-status']))"
            @mouseleave="handleDataKeyLeave"
          >
            Forwarded status
          </dt>
          <dd
            class="data-value"
            :class="{
              'key-highlighted': isKeyHovered('Forwarded status'),
              'value-matching': isKeyHovered('Forwarded status') && isValueMatching(getDisplayValue(parameters['fwd-status'])),
              'value-different': isKeyHovered('Forwarded status') && !isValueMatching(getDisplayValue(parameters['fwd-status'])),
            }"
          >
            {{ parameters["fwd-status"] }}
          </dd>
        </template>

        <template v-if="parameters.ttl">
          <dt
            class="data-key"
            :class="{ 'key-highlighted': isKeyHovered('TTL') }"
            @mouseenter="handleDataKeyHover('TTL', getDisplayValue(parameters.ttl))"
            @mouseleave="handleDataKeyLeave"
          >
            TTL
          </dt>
          <dd
            class="data-value"
            :class="{
              'key-highlighted': isKeyHovered('TTL'),
              'value-matching': isKeyHovered('TTL') && isValueMatching(getDisplayValue(parameters.ttl)),
              'value-different': isKeyHovered('TTL') && !isValueMatching(getDisplayValue(parameters.ttl)),
            }"
            :title="formatHumanSeconds(parameters.ttl)"
          >
            {{ formatSeconds(parameters.ttl) }}
          </dd>
        </template>

        <template v-if="parameters.stored">
          <dt
            class="data-key"
            :class="{ 'key-highlighted': isKeyHovered('Stored the response') }"
            @mouseenter="handleDataKeyHover('Stored the response', getDisplayValue(parameters.stored))"
            @mouseleave="handleDataKeyLeave"
          >
            Stored the response
          </dt>
          <dd
            class="data-value"
            :class="{
              'key-highlighted': isKeyHovered('Stored the response'),
              'value-matching': isKeyHovered('Stored the response') && isValueMatching(getDisplayValue(parameters.stored)),
              'value-different': isKeyHovered('Stored the response') && !isValueMatching(getDisplayValue(parameters.stored)),
            }"
          >
            {{ parameters.stored ? "✅" : "❌" }}
          </dd>
        </template>

        <template v-if="parameters.collapsed">
          <dt
            class="data-key"
            :class="{ 'key-highlighted': isKeyHovered('Collapsed w/ other reqs') }"
            @mouseenter="handleDataKeyHover('Collapsed w/ other reqs', getDisplayValue(parameters.collapsed))"
            @mouseleave="handleDataKeyLeave"
          >
            Collapsed w/ other reqs
          </dt>
          <dd
            class="data-value"
            :class="{
              'key-highlighted': isKeyHovered('Collapsed w/ other reqs'),
              'value-matching': isKeyHovered('Collapsed w/ other reqs') && isValueMatching(getDisplayValue(parameters.collapsed)),
              'value-different': isKeyHovered('Collapsed w/ other reqs') && !isValueMatching(getDisplayValue(parameters.collapsed)),
            }"
          >
            {{ parameters.collapsed ? "✅" : "❌" }}
          </dd>
        </template>

        <template v-if="parameters.key">
          <dt
            class="data-key"
            :class="{ 'key-highlighted': isKeyHovered('Cache key') }"
            @mouseenter="handleDataKeyHover('Cache key', getDisplayValue(parameters.key))"
            @mouseleave="handleDataKeyLeave"
          >
            Cache key
          </dt>
          <dd
            class="data-value"
            :class="{
              'key-highlighted': isKeyHovered('Cache key'),
              'value-matching': isKeyHovered('Cache key') && isValueMatching(getDisplayValue(parameters.key)),
              'value-different': isKeyHovered('Cache key') && !isValueMatching(getDisplayValue(parameters.key)),
            }"
          >
            {{ parameters.key }}
          </dd>
        </template>

        <template v-if="parameters.detail">
          <dt
            class="data-key"
            :class="{ 'key-highlighted': isKeyHovered('Extra details') }"
            @mouseenter="handleDataKeyHover('Extra details', getDisplayValue(parameters.detail))"
            @mouseleave="handleDataKeyLeave"
          >
            Extra details
          </dt>
          <dd
            class="data-value"
            :class="{
              'key-highlighted': isKeyHovered('Extra details'),
              'value-matching': isKeyHovered('Extra details') && isValueMatching(getDisplayValue(parameters.detail)),
              'value-different': isKeyHovered('Extra details') && !isValueMatching(getDisplayValue(parameters.detail)),
            }"
          >
            {{ parameters.detail }}
          </dd>
        </template>
      </template>

      <dt class="cache-heading">
        <h4>
          ↓
          <br />
          🏁 Response to client
        </h4>
      </dt>
      <dd />

      <dt
        class="data-key"
        :class="{ 'key-highlighted': isKeyHovered('Cacheable') }"
        @mouseenter="handleDataKeyHover('Cacheable', getDisplayValue(cacheAnalysis.cacheControl.isCacheable))"
        @mouseleave="handleDataKeyLeave"
      >
        Cacheable
      </dt>
      <dd
        class="data-value"
        :class="{
          'key-highlighted': isKeyHovered('Cacheable'),
          'value-matching': isKeyHovered('Cacheable') && isValueMatching(getDisplayValue(cacheAnalysis.cacheControl.isCacheable)),
          'value-different': isKeyHovered('Cacheable') && !isValueMatching(getDisplayValue(cacheAnalysis.cacheControl.isCacheable)),
        }"
      >
        {{ cacheAnalysis.cacheControl.isCacheable ? "✅" : "❌" }}
      </dd>

      <template v-if="cacheAnalysis.cacheControl.age">
        <dt
          class="data-key"
          :class="{ 'key-highlighted': isKeyHovered('Age') }"
          @mouseenter="handleDataKeyHover('Age', getDisplayValue(cacheAnalysis.cacheControl.age))"
          @mouseleave="handleDataKeyLeave"
        >
          Age
        </dt>
        <dd
          class="data-value"
          :class="{
            'key-highlighted': isKeyHovered('Age'),
            'value-matching': isKeyHovered('Age') && isValueMatching(getDisplayValue(cacheAnalysis.cacheControl.age)),
            'value-different': isKeyHovered('Age') && !isValueMatching(getDisplayValue(cacheAnalysis.cacheControl.age)),
          }"
          :title="formatHumanSeconds(cacheAnalysis.cacheControl.age)"
        >
          {{ formatSeconds(cacheAnalysis.cacheControl.age) }}
        </dd>
      </template>

      <template v-if="cacheAnalysis.cacheControl.date">
        <dt
          class="data-key"
          :class="{ 'key-highlighted': isKeyHovered('Date') }"
          @mouseenter="handleDataKeyHover('Date', getDisplayValue(cacheAnalysis.cacheControl.date))"
          @mouseleave="handleDataKeyLeave"
        >
          Date
        </dt>
        <dd
          class="data-value"
          :class="{
            'key-highlighted': isKeyHovered('Date'),
            'value-matching': isKeyHovered('Date') && isValueMatching(getDisplayValue(cacheAnalysis.cacheControl.date)),
            'value-different': isKeyHovered('Date') && !isValueMatching(getDisplayValue(cacheAnalysis.cacheControl.date)),
          }"
        >
          {{ formatDate(cacheAnalysis.cacheControl.date) }}
        </dd>
      </template>

      <template v-if="cacheAnalysis.cacheControl.etag">
        <dt
          class="data-key"
          :class="{ 'key-highlighted': isKeyHovered('ETag') }"
          @mouseenter="handleDataKeyHover('ETag', getDisplayValue(cacheAnalysis.cacheControl.etag))"
          @mouseleave="handleDataKeyLeave"
        >
          ETag
        </dt>
        <dd
          class="data-value"
          :class="{
            'key-highlighted': isKeyHovered('ETag'),
            'value-matching': isKeyHovered('ETag') && isValueMatching(getDisplayValue(cacheAnalysis.cacheControl.etag)),
            'value-different': isKeyHovered('ETag') && !isValueMatching(getDisplayValue(cacheAnalysis.cacheControl.etag)),
          }"
        >
          <code>{{ cacheAnalysis.cacheControl.etag }}</code>
        </dd>
      </template>

      <template v-if="cacheAnalysis.cacheControl.expiresAt">
        <dt
          class="data-key"
          :class="{ 'key-highlighted': isKeyHovered('Expires at') }"
          @mouseenter="handleDataKeyHover('Expires at', getDisplayValue(cacheAnalysis.cacheControl.expiresAt))"
          @mouseleave="handleDataKeyLeave"
        >
          Expires at
        </dt>
        <dd
          class="data-value"
          :class="{
            'key-highlighted': isKeyHovered('Expires at'),
            'value-matching': isKeyHovered('Expires at') && isValueMatching(getDisplayValue(cacheAnalysis.cacheControl.expiresAt)),
            'value-different': isKeyHovered('Expires at') && !isValueMatching(getDisplayValue(cacheAnalysis.cacheControl.expiresAt)),
          }"
        >
          {{ formatDate(cacheAnalysis.cacheControl.expiresAt) }}
        </dd>
      </template>

      <template v-if="cacheAnalysis.cacheControl.ttl">
        <dt
          class="data-key"
          :class="{ 'key-highlighted': isKeyHovered('TTL (browser)') }"
          @mouseenter="handleDataKeyHover('TTL (browser)', getDisplayValue(cacheAnalysis.cacheControl.ttl))"
          @mouseleave="handleDataKeyLeave"
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
            'value-matching': isKeyHovered('TTL (browser)') && isValueMatching(getDisplayValue(cacheAnalysis.cacheControl.ttl)),
            'value-different': isKeyHovered('TTL (browser)') && !isValueMatching(getDisplayValue(cacheAnalysis.cacheControl.ttl)),
          }"
          :title="formatHumanSeconds(cacheAnalysis.cacheControl.ttl)"
        >
          {{ formatSeconds(cacheAnalysis.cacheControl.ttl) }}
        </dd>
      </template>

      <template v-if="cacheAnalysis.cacheControl.cdnTtl">
        <dt
          class="data-key"
          :class="{ 'key-highlighted': isKeyHovered('TTL (CDN)') }"
          @mouseenter="handleDataKeyHover('TTL (CDN)', getDisplayValue(cacheAnalysis.cacheControl.cdnTtl))"
          @mouseleave="handleDataKeyLeave"
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
            'value-matching': isKeyHovered('TTL (CDN)') && isValueMatching(getDisplayValue(cacheAnalysis.cacheControl.cdnTtl)),
            'value-different': isKeyHovered('TTL (CDN)') && !isValueMatching(getDisplayValue(cacheAnalysis.cacheControl.cdnTtl)),
          }"
          :title="formatHumanSeconds(cacheAnalysis.cacheControl.cdnTtl)"
        >
          {{ formatSeconds(cacheAnalysis.cacheControl.cdnTtl) }}
        </dd>
      </template>

      <template v-if="cacheAnalysis.cacheControl.netlifyCdnTtl">
        <dt
          class="data-key"
          :class="{ 'key-highlighted': isKeyHovered('TTL (Netlify CDN)') }"
          @mouseenter="handleDataKeyHover('TTL (Netlify CDN)', getDisplayValue(cacheAnalysis.cacheControl.netlifyCdnTtl))"
          @mouseleave="handleDataKeyLeave"
        >
          TTL (Netlify CDN)
        </dt>
        <dd
          class="data-value"
          :class="{
            'key-highlighted': isKeyHovered('TTL (Netlify CDN)'),
            'value-matching': isKeyHovered('TTL (Netlify CDN)') && isValueMatching(getDisplayValue(cacheAnalysis.cacheControl.netlifyCdnTtl)),
            'value-different': isKeyHovered('TTL (Netlify CDN)') && !isValueMatching(getDisplayValue(cacheAnalysis.cacheControl.netlifyCdnTtl)),
          }"
          :title="formatHumanSeconds(cacheAnalysis.cacheControl.netlifyCdnTtl)"
        >
          {{ formatSeconds(cacheAnalysis.cacheControl.netlifyCdnTtl) }}
        </dd>
      </template>

      <template v-if="cacheAnalysis.cacheControl.vary">
        <dt
          class="data-key"
          :class="{ 'key-highlighted': isKeyHovered('Vary') }"
          @mouseenter="handleDataKeyHover('Vary', getDisplayValue(cacheAnalysis.cacheControl.vary))"
          @mouseleave="handleDataKeyLeave"
        >
          Vary
        </dt>
        <dd
          class="data-value"
          :class="{
            'key-highlighted': isKeyHovered('Vary'),
            'value-matching': isKeyHovered('Vary') && isValueMatching(getDisplayValue(cacheAnalysis.cacheControl.vary)),
            'value-different': isKeyHovered('Vary') && !isValueMatching(getDisplayValue(cacheAnalysis.cacheControl.vary)),
          }"
        >
          <code>{{ cacheAnalysis.cacheControl.vary }}</code>
        </dd>
      </template>

      <template v-if="cacheAnalysis.cacheControl.netlifyVary">
        <dt
          class="data-key"
          :class="{ 'key-highlighted': isKeyHovered('Netlify-Vary') }"
          @mouseenter="handleDataKeyHover('Netlify-Vary', getDisplayValue(cacheAnalysis.cacheControl.netlifyVary))"
          @mouseleave="handleDataKeyLeave"
        >
          Netlify-Vary
        </dt>
        <dd
          class="data-value"
          :class="{
            'key-highlighted': isKeyHovered('Netlify-Vary'),
            'value-matching': isKeyHovered('Netlify-Vary') && isValueMatching(getDisplayValue(cacheAnalysis.cacheControl.netlifyVary)),
            'value-different': isKeyHovered('Netlify-Vary') && !isValueMatching(getDisplayValue(cacheAnalysis.cacheControl.netlifyVary)),
          }"
        >
          <code>{{ cacheAnalysis.cacheControl.netlifyVary }}</code>
        </dd>
      </template>

      <template v-if="cacheAnalysis.cacheControl.revalidate">
        <dt
          class="data-key"
          :class="{ 'key-highlighted': isKeyHovered('Revalidation') }"
          @mouseenter="handleDataKeyHover('Revalidation', getDisplayValue(cacheAnalysis.cacheControl.revalidate))"
          @mouseleave="handleDataKeyLeave"
        >
          Revalidation
        </dt>
        <dd
          class="data-value"
          :class="{
            'key-highlighted': isKeyHovered('Revalidation'),
            'value-matching': isKeyHovered('Revalidation') && isValueMatching(getDisplayValue(cacheAnalysis.cacheControl.revalidate)),
            'value-different': isKeyHovered('Revalidation') && !isValueMatching(getDisplayValue(cacheAnalysis.cacheControl.revalidate)),
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
</style>
