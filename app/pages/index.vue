<script setup lang="ts">
const { runs, error, loading, handleRequestFormSubmit, handleClickClear } = useRunManager()
const inputUrl = ref('https://nextjs-netlify-durable-cache-demo.netlify.app/isr-page')
</script>

<template>
  <div>
    <RequestForm
      v-model:input-url="inputUrl"
      :loading="loading"
      @submit="handleRequestFormSubmit"
    />

    <RunDisplay
      :runs="runs"
      :error="error"
      :loading="loading"
      :input-url="inputUrl"
      :on-clear="handleClickClear"
    />
  </div>
</template>
