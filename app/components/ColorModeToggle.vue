<script setup lang="ts">
const { colorMode, setColorMode } = useColorMode()

const modes = [
  { value: 'light' as const, label: 'Light', icon: 'sun' },
  { value: 'dark' as const, label: 'Dark', icon: 'moon' },
  { value: 'system' as const, label: 'System', icon: 'monitor' },
]
</script>

<template>
  <div class="mode-toggle" role="radiogroup" aria-label="Color mode">
    <button
      v-for="mode in modes"
      :key="mode.value"
      :aria-label="mode.label"
      :aria-checked="colorMode === mode.value"
      role="radio"
      class="mode-btn"
      :class="{ active: colorMode === mode.value }"
      @click="setColorMode(mode.value)"
    >
      <!-- Sun -->
      <svg
        v-if="mode.icon === 'sun'"
        class="w-3.5 h-3.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <circle cx="12" cy="12" r="5" />
        <path
          d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
        />
      </svg>
      <!-- Moon -->
      <svg
        v-if="mode.icon === 'moon'"
        class="w-3.5 h-3.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
      </svg>
      <!-- Monitor -->
      <svg
        v-if="mode.icon === 'monitor'"
        class="w-3.5 h-3.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <path d="M8 21h8M12 17v4" />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.mode-toggle {
  display: inline-flex;
  align-items: center;
  gap: 1px;
  padding: 3px;
  border-radius: 9999px;
  background: #f6f6f7;
  border: 1px solid #e9ebed;
}

:is(.dark) .mode-toggle {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(208, 255, 254, 0.1);
}

.mode-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  border-radius: 9999px;
  border: none;
  background: transparent;
  color: #778089;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.33, 1, 0.68, 1);
}

.mode-btn:hover {
  color: #353a3e;
}

:is(.dark) .mode-btn:hover {
  color: #d1d5da;
}

.mode-btn.active {
  background: white;
  color: #014847;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

:is(.dark) .mode-btn.active {
  background: rgba(208, 255, 254, 0.12);
  color: #32e6e2;
  box-shadow: none;
}
</style>
