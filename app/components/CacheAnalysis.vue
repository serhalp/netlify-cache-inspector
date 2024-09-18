<script setup lang="ts">
const props = defineProps<{
  cacheHeaders: Record<string, string>;
}>();

const { servedBy, cacheStatus } = getCacheAnalysis(props.cacheHeaders);
</script>

<template>
  <div>
    <dl>
      <dt>Served by</dt>
      <dd>{{ servedBy }}</dd>
    </dl>

    <hr />

    <dl>
      <template v-for="{ cacheName, parameters } in cacheStatus">
        <!-- This is a bit of a hack to use the pretty <dt> styling but with sections. -->
        <!-- I should probably just do something custom instead. -->
        <dt class="cache-heading">
          <h4>{{ cacheName }}</h4>
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
          <dd>{{ parameters.ttl }}</dd>
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
    </dl>
  </div>
</template>

<style scoped>
.cache-heading h4 {
  padding: 0;
  /* I'm sorry */
  margin-left: -0.5em;

  font-size: 1.1em;
}

/* Default Netlify Examples styles add ": " */
.cache-heading::after {
  content: none;
}
</style>
