<script setup lang="ts">
const props = defineProps<{
  cacheHeaders: Record<string, string>;
}>();

const id = useId();
const el = useTemplateRef(id);
const highlightJson = () => {
  hljs.highlightElement(el.value);
};
onMounted(highlightJson);
onUpdated(highlightJson);
</script>

<template>
  <pre>
    <code :ref="id" class="hljs language-json">{{ JSON.stringify(props.cacheHeaders, null, 2) }}</code>
  </pre>
</template>

<style scoped>
/* FIXME(serhalp) This is leaky. I'm doing this:
 * https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_box_alignment/Box_alignment_in_flexbox#alignment_and_auto_margins.
 * But this component shouldn't "know" about its parent's layout needs.
 */
pre {
  margin-top: auto;
}

code {
  font-size: 0.7em;

  max-width: 40vw;
  overflow-x: scroll;
}
</style>
