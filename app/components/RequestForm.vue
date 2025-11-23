<script setup lang="ts">
const props = defineProps<{
  loading?: boolean
  initialUrl?: string
}>()

const inputUrl = ref(
  props.initialUrl ?? 'https://nextjs-netlify-durable-cache-demo.netlify.app/isr-page',
)

const emit = defineEmits(['submit'])

const handleSubmit = () => {
  if (props.loading) return

  if (!inputUrl.value.startsWith('http')) {
    inputUrl.value = `https://${inputUrl.value}`
  }

  emit('submit', { url: inputUrl.value })
}
</script>

<template>
  <div class="form">
    <label
      for="url-input"
      class="url-input"
    >
      <strong>URL:</strong>
      <input
        id="url-input"
        v-model.trim="inputUrl"
        type="url"
        @keyup.enter="handleSubmit()"
      />
    </label>
    <button
      :disabled="props.loading"
      @click="handleSubmit()"
    >
      {{ props.loading ? 'Inspecting...' : 'Inspect' }}
    </button>
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
