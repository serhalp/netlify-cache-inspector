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
