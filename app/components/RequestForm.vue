<script setup lang="ts">
const inputUrl = ref();
const runs = ref([]);

const inspectUrl = async (): void => {
  if (!inputUrl.value.startsWith("http")) {
    inputUrl.value = `https://${inputUrl.value}`;
  }

  try {
    // Destructuring would be confusing, since the response body contains fields named `status` and
    // `headers` (it's a request about a request...)
    const responseBody = await $fetch(
      `/api/inspect-url/${encodeURIComponent(inputUrl.value)}`,
    );

    runs.value.push({
      url: inputUrl.value,
      status: responseBody.status,
      cacheHeaders: getCacheHeaders(responseBody.headers),
      durationInMs: responseBody.durationInMs,
    });
  } catch (err) {
    // TODO(serhalp) Proper error handling. ErrorBoundary?
    console.error("Error fetching URL", err);
    return;
  }
};
</script>

<template>
  <div class="form">
    <label class="url-input">
      <strong>URL:</strong>
      <input v-model.trim="inputUrl" @keyup.enter="inspectUrl()" />
    </label>
    <button @click="inspectUrl()">Inspect</button>
  </div>

  <!-- TODO(serhalp) Move this into another component. Wrong place. -->
  <div class="flex-btwn">
    <div v-for="run in runs">
      <h3>{{ run.url }}</h3>
      <small>HTTP {{ run.status }} ({{ run.durationInMs }} ms)</small>
      <RawCacheHeaders :cacheHeaders="run.cacheHeaders" />
    </div>
  </div>
</template>

<style scoped>
.form {
  display: flex;
  gap: 1em;
  align-content: center;
  align-items: center;
}

label {
  display: flex;
  gap: 1em;
  align-content: center;
  align-items: center;

  >* {
    /* Override default from Netlify Examples style to vertically center easily */
    margin-bottom: 0;
  }
}

.url-input {
  flex: 1;
}
</style>
