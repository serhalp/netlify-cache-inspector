<script setup lang="ts">
// TODO(serhalp) Extract this whole script into something shared, probably RequestForm
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

const handleRequestFormSubmit = async ({
  url,
}: {
  url: string
}): Promise<void> => {
  try {
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  catch (err: any) {
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
