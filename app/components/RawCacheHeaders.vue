<script setup lang="ts">
const props = defineProps<{
  cacheHeaders: Record<string, string>
}>()

const { setHover, clearHover, isKeyHovered, isValueMatching } = useDataHover()

const el = useTemplateRef('code-block')
const highlightJson = () => {
  if (el.value != null) {
    hljs.highlightElement(el.value)
  }
}
onMounted(highlightJson)
onUpdated(highlightJson)

// Split JSON into lines for hover comparison
const jsonLines = computed(() => {
  return JSON.stringify(props.cacheHeaders, null, 2).split('\n')
})

const handleLineHover = (lineContent: string, lineIndex: number) => {
  // Use line index + content as key to ensure uniqueness across different panels
  const lineKey = `json-line-${lineIndex}`
  setHover(lineKey, lineContent.trim())
}

const handleLineLeave = () => {
  clearHover()
}

const getLineHoverClasses = (lineContent: string, lineIndex: number) => {
  const lineKey = `json-line-${lineIndex}`
  const trimmedContent = lineContent.trim()

  return {
    'line-highlighted': isKeyHovered(lineKey),
    'line-matching': isKeyHovered(lineKey) && isValueMatching(trimmedContent),
    'line-different': isKeyHovered(lineKey) && !isValueMatching(trimmedContent),
  }
}
</script>

<template>
  <pre>
    <code
      ref="code-block"
      class="hljs language-json"
    >
      <div
        v-for="(line, index) in jsonLines"
        :key="index"
        class="json-line"
        :class="getLineHoverClasses(line, index)"
        @mouseenter="handleLineHover(line, index)"
        @mouseleave="handleLineLeave"
      >{{ line }}</div>
    </code>
  </pre>
</template>

<style scoped>
pre {
  /* The default is too airy */
  padding-bottom: 0;
  margin-bottom: 0;
  /* FIXME(serhalp) This is leaky. I'm doing this:
   * https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_box_alignment/Box_alignment_in_flexbox#alignment_and_auto_margins.
   * But this component shouldn't "know" about its parent's layout needs.
   */
  margin-top: auto;
  margin-right: auto;
}

code {
  font-size: 0.6em;

  max-width: 30vw;
  overflow-x: scroll;
}

/* JSON line hover styles */
.json-line {
  cursor: pointer;
  transition: background-color 0.2s ease;
  display: block;
  margin: 0;
  padding: 0 0.25em;
}

.json-line:hover {
  background-color: rgba(59, 130, 246, 0.1);
}

.json-line.line-highlighted {
  background-color: rgba(59, 130, 246, 0.2);
  font-weight: 600;
}

.json-line.line-matching {
  background-color: rgba(34, 197, 94, 0.2);
  border-left: 3px solid rgb(34, 197, 94);
  padding-left: 0.5em;
}

.json-line.line-different {
  background-color: rgba(239, 68, 68, 0.1);
  border-left: 3px solid rgb(239, 68, 68);
  padding-left: 0.5em;
}
</style>
