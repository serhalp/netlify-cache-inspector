<script setup lang="ts">
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
  <pre>
    <code
ref="code-block"
class="hljs language-json"
>{{ JSON.stringify(props.cacheHeaders, null, 2) }}</code>
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
</style>
