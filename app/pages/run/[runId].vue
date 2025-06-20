<script setup lang="ts">
// TODO(serhalp) Extract most of this script into something shared, probably RequestForm
interface Run {
  runId: string
  url: string
  status: number
  cacheHeaders: Record<string, string>
  durationInMs: number
}

const runs = ref<Run[]>([])
const error = ref<string | null>(null)
const loading = ref<boolean>(false)

// TODO(serhalp) Improve types
type ApiRun = Omit<Run, 'cacheHeaders'> & { headers: Record<string, string> }
const getRunFromApiRun = (apiRun: ApiRun): Run => {
  const { headers, ...run } = apiRun
  return { ...run, cacheHeaders: getCacheHeaders(headers) }
}

const route = useRoute()

const { data: initialRuns, pending: _pending, error: preloadedRunsError } = await useAsyncData('preloadedRuns', async (): Promise<Run[]> => {
  const { runId } = route.params
  if (typeof runId === 'string') {
    const responseBody = await $fetch(`/api/runs/${runId}`)
    return [getRunFromApiRun(responseBody)]
  }
  return []
})
if (preloadedRunsError.value) {
  error.value = preloadedRunsError.value.toString()
}
if (initialRuns.value) {
  runs.value = initialRuns.value
}

const handleRequestFormSubmit = async ({
  url,
}: {
  url: string
}): Promise<void> => {
  loading.value = true
  try {
    const responseBody: ApiRun = await $fetch<ApiRun>('/api/inspect-url', {
      method: 'POST',
      body: { url },
    })

    runs.value.push(getRunFromApiRun(responseBody))
    error.value = null
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  catch (err: any) {
    error.value
      = err?.data?.message
        ?? err?.toString?.()
        ?? new Error(`Fetch error: ${err}`)
    return
  }
  finally {
    loading.value = false
  }
}

const handleClickClear = (): void => {
  runs.value = []
}
</script>

<template>
  <main>
    <RequestForm
      :loading="loading"
      @submit="handleRequestFormSubmit"
    />

    <div
      v-if="loading"
      class="loading-indicator"
    >
      ⏳ Inspecting URL...
    </div>

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
        :total-runs="runs.length"
      />
    </div>

    <div class="reset-container">
      <button
        v-if="runs.length > 0"
        @click="handleClickClear()"
      >
        Clear
      </button>
    </div>
  </main>
</template>

<style scoped>
.loading-indicator {
  text-align: center;
  padding: 1em;
  color: var(--blue-600, #2563eb);
  font-weight: 500;
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
