<script setup lang="ts">
const { runs, error, loading, handleRequestFormSubmit, handleClickClear, currentReportId } = useRunManager()
</script>

<template>
  <main>
    <RequestForm
      :loading="loading"
      @submit="handleRequestFormSubmit"
    />

    <RunDisplay
      :runs="runs"
      :error="error"
      :loading="loading"
      :on-clear="handleClickClear"
      :current-report-id="currentReportId"
    />
  </main>
</template>

<style scoped>
</style>
