<script setup lang="ts">
import hljs from 'highlight.js/lib/core'
import json from 'highlight.js/lib/languages/json'
import 'highlight.js/styles/github.css'

hljs.registerLanguage('json', json)

const props = defineProps<{
  cacheHeaders: Record<string, string>
}>()

const el = useTemplateRef('code-block')
const highlightJson = () => {
  if (el.value != null) {
    hljs.highlightElement(el.value)
  }
}
onMounted(highlightJson)
onUpdated(highlightJson)
</script>

<template>
  <pre class="raw-pre">
    <code
      ref="code-block"
      class="hljs language-json font-mono text-xs max-w-[30vw] overflow-x-auto block p-3"
    >{{ JSON.stringify(props.cacheHeaders, null, 2) }}</code>
  </pre>
</template>

<style scoped>
.raw-pre {
  margin-top: auto;
  margin-right: auto;
  margin-bottom: 0;
  padding-bottom: 0;
  border-radius: 0.5rem;
  overflow: hidden;
  background: #f6f6f7;
  border: 1px solid #e9ebed;
}

:is(.dark) .raw-pre {
  background: rgba(255, 255, 255, 0.03);
  border-color: rgba(208, 255, 254, 0.08);
}

:is(.dark) .raw-pre :deep(.hljs) {
  background: transparent;
  color: #d1d5da;
}

:is(.dark) .raw-pre :deep(.hljs-attr) {
  color: #32e6e2;
}

:is(.dark) .raw-pre :deep(.hljs-string) {
  color: #80abfa;
}

:is(.dark) .raw-pre :deep(.hljs-number) {
  color: #fbb13d;
}
</style>
