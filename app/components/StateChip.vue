<script setup lang="ts">
type Tone = 'swr' | 'stale' | 'blocked'

const props = defineProps<{
  label: string
  tone: Tone
  title: string
}>()

// Literal class strings so UnoCSS can see them.
const TONE_CLASS: Record<Tone, string> = {
  swr: 'bg-amber-600/10 text-amber-900 ring-amber-600/40 dark:bg-amber-400/12 dark:text-amber-200 dark:ring-amber-400/30',
  stale:
    'bg-neutral-600/8 text-neutral-600 ring-neutral-600/20 dark:bg-neutral-300/10 dark:text-neutral-300 dark:ring-neutral-300/20',
  blocked:
    'bg-red-500/8 text-red-700 ring-red-500/35 dark:bg-red-500/15 dark:text-red-400 dark:ring-red-400/35',
}
</script>

<template>
  <span
    class="state-chip ml-1.5 inline-flex shrink-0 cursor-help items-center rounded px-1.5 py-0.5 font-mono text-xs leading-none font-500 ring-1 ring-inset"
    :class="TONE_CLASS[props.tone]"
    tabindex="0"
    :title="props.title"
    :aria-label="props.title"
    >{{ props.label }}</span
  >
</template>

<style scoped>
.state-chip:focus-visible {
  outline: 2px solid #05bdba;
  outline-offset: 2px;
}
</style>
