<script setup lang="ts">
interface Run {
  runId: string
  url: string
  status: number
  cacheHeaders: Record<string, string>
  durationInMs: number
}

const runs = ref<Run[]>([])
const error = ref<string | null>(null)

// TODO(serhalp) Improve types
type ApiRun = Omit<Run, 'cacheHeaders'> & { headers: Record<string, string> }
const getRunFromApiRun = (apiRun: ApiRun): Run => {
  const { headers, ...run } = apiRun
  return { ...run, cacheHeaders: getCacheHeaders(headers) }
}

const route = useRoute()

const { data: initialRuns, pending: _pending, error: preloadedRunsError } = await useAsyncData('preloadedRuns', async () => {
  if (typeof route.query.runId === 'string') {
    const { runId } = route.query
    const responseBody: ApiRun = await $fetch(`/api/runs/${runId}`)
    return [getRunFromApiRun(responseBody)]
  }
  return []
})
if (preloadedRunsError.value) {
  error.value = preloadedRunsError.value.data?.message ?? preloadedRunsError.value.toString()
}
runs.value = initialRuns.value

const handleRequestFormSubmit = async ({
  url,
}: {
  url: string
}): Promise<void> => {
  try {
    // Destructuring would be confusing, since the response body contains fields named `status` and
    // `headers` (it's a request about a request...)
    const responseBody: ApiRun = await $fetch(
      '/api/inspect-url',
      {
        method: 'POST',
        body: { url },
      },
    )
    runs.value.push(getRunFromApiRun(responseBody))
    error.value = null
  }
  catch (
  // TODO(serhalp) nuxt doesn't appear to re-export the `FetchError` types from ofetch. Look into this.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
    err: any
  ) {
    error.value
      = err?.data?.message
      ?? err?.toString?.()
      ?? new Error(`Fetch error: ${err}`)
    return
  }
}

const handleClickClear = (): void => {
  runs.value = []
}
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

    <div
      v-if="error"
      class="error"
    >
      {{ error }}
    </div>

    <div class="flex-btwn run-panels">
      <RunPanel
        v-for="(run, i) in runs"
        v-bind="run"
        :key="i"
      />
    </div>
  </main>

  <div class="reset-container">
    <button
      v-if="runs.length > 0"
      @click="handleClickClear()"
    >
      Clear
    </button>
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
