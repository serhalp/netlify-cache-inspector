<script setup lang="ts">
const inputUrl = ref(
  'https://nextjs-netlify-durable-cache-demo.netlify.app/isr-page',
)

const props = defineProps<{
  loading?: boolean
}>()

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
    <label class="url-input">
      <strong>URL:</strong>
      <input
        v-model.trim="inputUrl"
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
