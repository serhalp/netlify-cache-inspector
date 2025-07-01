<script setup lang="ts">
const { runs, error, loading, handleRequestFormSubmit, handleClickClear } = useRunManager()
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
    />
  </main>
</template>

<style scoped>
</style>
