<script setup lang="ts">
import { formatDuration, intervalToDuration } from "date-fns";

const props = defineProps<{
  cacheHeaders: Record<string, string>;
}>();

const formatSeconds = (seconds: number): string => {
  return `${seconds} s`;
};

const formatHumanSeconds = (seconds: number): string => {
  const d = new Date(); // arbitrary date
  return formatDuration(
    intervalToDuration({
      start: d,
      end: new Date(d.getTime() + Math.abs(seconds) * 1000),
    }),
  );
};

const formatDate = (date: Date): string =>
  date.toLocaleString(undefined, {
    timeZoneName: "short",
  });

let now = ref(Date.now());

const cacheAnalysis = computed(() =>
  getCacheAnalysis(props.cacheHeaders, now.value),
);

let timerId;

onMounted(() => {
  timerId = setInterval(() => {
    now.value = Date.now();
  }, 1000);
});

onUnmounted(() => {
  if (timerId) clearInterval(timerId);
});
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
      <dd></dd>

      <template v-for="(
          { cacheName, parameters }, cacheIndex
        ) in cacheAnalysis.cacheStatus">
        <!-- This is a bit of a hack to use the pretty <dt> styling but with sections. -->
        <!-- I should probably just do something custom instead. -->
        <dt class="cache-heading">
          <h4>
            ↳ <em>{{ cacheName }}</em> cache
          </h4>
        </dt>
        <dd></dd>

        <dt>Hit</dt>
        <dd>{{ parameters.hit ? "✅" : "❌" }}</dd>

        <template v-if="parameters.fwd">
          <dt>Forwarded because</dt>
          <dd>{{ parameters.fwd }}</dd>
        </template>

        <template v-if="parameters['fwd-status']">
          <dt>Forwarded status</dt>
          <dd>{{ parameters["fwd-status"] }}</dd>
        </template>

        <template v-if="parameters.ttl">
          <dt>TTL</dt>
          <dd :title="formatHumanSeconds(parameters.ttl)">
            {{ formatSeconds(parameters.ttl) }}
          </dd>
        </template>

        <template v-if="parameters.stored">
          <dt>Stored the response</dt>
          <dd>{{ parameters.stored ? "✅" : "❌" }}</dd>
        </template>

        <template v-if="parameters.collapsed">
          <dt>Collapsed w/ other reqs</dt>
          <dd>{{ parameters.collapsed ? "✅" : "❌" }}</dd>
        </template>

        <template v-if="parameters.key">
          <dt>Cache key</dt>
          <dd>{{ parameters.key }}</dd>
        </template>

        <template v-if="parameters.detail">
          <dt>Extra details</dt>
          <dd>{{ parameters.detail }}</dd>
        </template>
      </template>

      <dt class="cache-heading">
        <h4>
          ↓
          <br />
          🏁 Response to client
        </h4>
      </dt>
      <dd></dd>

      <dt>Cacheable</dt>
      <dd>{{ cacheAnalysis.cacheControl.isCacheable ? "✅" : "❌" }}</dd>

      <template v-if="cacheAnalysis.cacheControl.age">
        <dt>Age</dt>
        <dd :title="formatHumanSeconds(cacheAnalysis.cacheControl.age)">
          {{ formatSeconds(cacheAnalysis.cacheControl.age) }}
        </dd>
      </template>

      <template v-if="cacheAnalysis.cacheControl.date">
        <dt>Date</dt>
        <dd>
          {{ formatDate(cacheAnalysis.cacheControl.date) }}
        </dd>
      </template>

      <template v-if="cacheAnalysis.cacheControl.etag">
        <dt>ETag</dt>
        <dd>
          <code>{{ cacheAnalysis.cacheControl.etag }}</code>
        </dd>
      </template>

      <template v-if="cacheAnalysis.cacheControl.expiresAt">
        <dt>Expires at</dt>
        <dd>{{ formatDate(cacheAnalysis.cacheControl.expiresAt) }}</dd>
      </template>

      <template v-if="cacheAnalysis.cacheControl.ttl">
        <dt>
          TTL{{
            cacheAnalysis.cacheControl.netlifyCdnTtl ||
              cacheAnalysis.cacheControl.cdnTtl
              ? " (browser)"
              : ""
          }}
        </dt>
        <dd :title="formatHumanSeconds(cacheAnalysis.cacheControl.ttl)">
          {{ formatSeconds(cacheAnalysis.cacheControl.ttl) }}
        </dd>
      </template>

      <template v-if="cacheAnalysis.cacheControl.cdnTtl">
        <dt>
          TTL ({{
            cacheAnalysis.cacheControl.netlifyCdnTtl
              ? "other CDNs"
              : "Netlify CDN"
          }})
        </dt>
        <dd :title="formatHumanSeconds(cacheAnalysis.cacheControl.cdnTtl)">
          {{ formatSeconds(cacheAnalysis.cacheControl.cdnTtl) }}
        </dd>
      </template>

      <template v-if="cacheAnalysis.cacheControl.netlifyCdnTtl">
        <dt>TTL (Netlify CDN)</dt>
        <dd :title="formatHumanSeconds(cacheAnalysis.cacheControl.netlifyCdnTtl)">
          {{ formatSeconds(cacheAnalysis.cacheControl.netlifyCdnTtl) }}
        </dd>
      </template>

      <template v-if="cacheAnalysis.cacheControl.vary">
        <dt>Vary</dt>
        <dd>
          <code>{{ cacheAnalysis.cacheControl.vary }}</code>
        </dd>
      </template>

      <template v-if="cacheAnalysis.cacheControl.netlifyVary">
        <dt>Netlify-Vary</dt>
        <dd>
          <code>{{ cacheAnalysis.cacheControl.netlifyVary }}</code>
        </dd>
      </template>

      <template v-if="cacheAnalysis.cacheControl.revalidate">
        <dt>Revalidation</dt>
        <dd>
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
</style>
