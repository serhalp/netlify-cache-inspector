<script setup lang="ts">
const isOpen = ref(false)
const buttonEl = ref<HTMLElement | null>(null)
const popoverEl = ref<HTMLElement | null>(null)

const popoverId = 'help-popover'

const toggle = () => {
  isOpen.value = !isOpen.value
}

const close = () => {
  isOpen.value = false
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && isOpen.value) {
    close()
    buttonEl.value?.focus()
  }
}

const handleClickOutside = (e: MouseEvent) => {
  if (!buttonEl.value?.contains(e.target as Node) && !popoverEl.value?.contains(e.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleKeydown)
})
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div class="relative">
    <button
      ref="buttonEl"
      class="help-btn"
      aria-label="Help"
      :aria-expanded="isOpen"
      :aria-controls="popoverId"
      @click="toggle"
    >
      ?
    </button>

    <Transition name="popover">
      <div
        v-if="isOpen"
        :id="popoverId"
        ref="popoverEl"
        role="region"
        aria-label="Help"
        class="help-popover"
      >
        <h3 class="font-heading font-bold text-lg text-neutral-800 dark:text-neutral-50 mb-2">
          How it works
        </h3>
        <ol class="help-steps">
          <li>Paste any URL hosted on <strong>Netlify</strong></li>
          <li>Hit <strong>Inspect</strong> to fetch it with debug headers</li>
          <li>
            See a structured breakdown of cache behavior: which layers hit or missed, TTLs, and more
          </li>
          <li>
            Run it again to <strong>compare</strong> side by side. Hover any field to diff values
            across runs
          </li>
        </ol>
        <p class="text-base text-neutral-600 dark:text-neutral-400 mt-3 mb-0">
          Each run is saved with a permalink you can share.
        </p>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.help-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 9999px;
  border: 1px solid #d1d5da;
  background: #f6f6f7;
  color: #545a61;
  font-family: 'Roboto Mono', monospace;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.33, 1, 0.68, 1);
  flex-shrink: 0;
}

.help-btn:hover {
  border-color: #05bdba;
  color: #014847;
  background: white;
}

:is(.dark) .help-btn {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(208, 255, 254, 0.15);
  color: #9da7b2;
}

:is(.dark) .help-btn:hover {
  border-color: #05bdba;
  color: #32e6e2;
  background: rgba(208, 255, 254, 0.1);
}

.help-popover {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 360px;
  padding: 1.25rem 1.375rem;
  border-radius: 12px;
  background: white;
  border: 1px solid #e9ebed;
  box-shadow:
    0 8px 30px rgba(0, 0, 0, 0.08),
    0 2px 8px rgba(0, 0, 0, 0.04);
  z-index: 100;
}

:is(.dark) .help-popover {
  background: #181a1c;
  border-color: rgba(208, 255, 254, 0.12);
  box-shadow:
    0 8px 30px rgba(0, 0, 0, 0.3),
    0 2px 8px rgba(0, 0, 0, 0.2);
}

.help-steps {
  margin: 0;
  padding-left: 1.25rem;
  font-size: 1rem;
  line-height: 1.6;
  color: #545a61;
}

:is(.dark) .help-steps {
  color: #9da7b2;
}

.help-steps li {
  margin-bottom: 0.25rem;
}

.help-steps li:last-child {
  margin-bottom: 0;
}

.help-steps strong {
  color: #181a1c;
  font-weight: 600;
}

:is(.dark) .help-steps strong {
  color: #e9ebed;
}

.popover-enter-active {
  transition: all 0.15s cubic-bezier(0.33, 1, 0.68, 1);
}

.popover-leave-active {
  transition: all 0.1s ease-in;
}

.popover-enter-from,
.popover-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
