<script setup lang="ts">
const props = defineProps<{
  loading?: boolean
}>()

const inputUrl = defineModel<string>('inputUrl', {
  default: 'https://nextjs-netlify-durable-cache-demo.netlify.app/isr-page',
})

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
  <div class="grid gap-3 w-full sm:grid-cols-[1fr_auto] sm:items-end">
    <label class="block min-w-0">
      <span class="mono-label mb-2 block">Target URL</span>
      <input
        v-model.trim="inputUrl"
        class="url-input block w-full"
        placeholder="https://your-site.netlify.app"
        @keyup.enter="handleSubmit()"
      />
    </label>
    <button
      class="btn-primary whitespace-nowrap self-end"
      :disabled="props.loading"
      @click="handleSubmit()"
    >
      {{ props.loading ? 'Inspecting...' : 'Inspect' }}
    </button>
  </div>
</template>

<style scoped>
.url-input {
  padding: 0.625rem 1rem;
  background: white;
  border: 1px solid #d1d5da;
  border-radius: 9999px;
  font-family: 'Roboto Mono', monospace;
  font-size: 0.875rem;
  color: #181a1c;
  transition: all 0.2s cubic-bezier(0.33, 1, 0.68, 1);
}

.url-input:focus {
  outline: none;
  border-color: #05bdba;
  box-shadow: 0 0 0 3px rgba(5, 189, 186, 0.15);
}

.url-input::placeholder {
  color: #778089;
}

:is(.dark) .url-input {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(208, 255, 254, 0.15);
  color: #e9ebed;
}

:is(.dark) .url-input:focus {
  border-color: #05bdba;
  box-shadow: 0 0 0 3px rgba(5, 189, 186, 0.2);
}

:is(.dark) .url-input::placeholder {
  color: #778089;
}
</style>
