<script setup lang="ts">
const runs = ref([]);
const error = ref(null);

const handleRequestFormSubmit = async ({ url }): void => {
  try {
    // Destructuring would be confusing, since the response body contains fields named `status` and
    // `headers` (it's a request about a request...)
    const responseBody = await $fetch(
      `/api/inspect-url/${encodeURIComponent(url)}`,
    );

    runs.value.push({
      url,
      status: responseBody.status,
      cacheHeaders: getCacheHeaders(responseBody.headers),
      durationInMs: responseBody.durationInMs,
    });

    error.value = null;
  } catch (err) {
    error.value =
      err?.data?.message ??
      err?.toString?.() ??
      new Error(`Fetch error: ${err}`);
    return;
  }
};

const handleClickClear = (): void => {
  runs.value = [];
};
</script>

<template>
  <NuxtRouteAnnouncer />

  <header>
    <h1>Netlify Cache Inspector</h1>

    <p class="subheading">
      Inspect and compare cache headers for requests to Netlify sites
    </p>
  </header>

  <main>
    <RequestForm @submit="handleRequestFormSubmit" />

    <div v-if="error" class="error">
      {{ error }}
    </div>

    <div class="flex-btwn run-panels">
      <RunPanel v-for="run in runs" v-bind="run" />
    </div>
  </main>

  <div class="reset-container">
    <button v-if="runs.length > 0" @click="handleClickClear()">Clear</button>
  </div>
</template>

<style>
body {
  /* Override weird default from Netlify Examples style */
  text-align: left;
}
</style>
<style scoped>
header {
  text-align: center;
}

.subheading {
  font-size: 1.5em;
}

main {
  /* Override very airy defaults from Netlify Examples style, not great for a utility app */
  margin-top: 3em;
  padding-bottom: 3em;
}

.error {
  color: var(--red-400);
}

.run-panels {
  flex-wrap: wrap;
  align-items: stretch;
}

.run-panels>* {
  flex: 1 1 20em;
}

.reset-container {
  text-align: center;

  background-color: inherit;
}
</style>
