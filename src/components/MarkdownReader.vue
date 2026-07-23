<script setup lang="ts">
import { computed } from 'vue'
import { marked } from 'marked'

const props = defineProps<{
  source: string // raw markdown text
}>()

// Configure marked (basic, safe settings)
marked.setOptions({
  breaks: true,
  gfm: true
})

const html = computed(() => {
  if (!props.source) return ''
  return marked.parse(props.source || '', { async: false }) as string
})
</script>

<template>
  <div class="markdown-reader">
    <!-- eslint-disable-next-line vue/no-v-html -->
    <div v-html="html" class="md-content"></div>
  </div>
</template>

<style scoped>
.markdown-reader {
  padding: 10px 4px 24px;
  font-size: 0.95rem;
  line-height: 1.6;
  color: var(--text, #111827);
}

.md-content :deep(h1),
.md-content :deep(h2),
.md-content :deep(h3) {
  margin-top: 18px;
  margin-bottom: 8px;
  font-weight: 600;
  color: var(--accent, #4f46e5);
}

.md-content :deep(p) {
  margin-bottom: 8px;
}

.md-content :deep(ul),
.md-content :deep(ol) {
  padding-left: 20px;
  margin-bottom: 8px;
}

.md-content :deep(li) {
  margin-bottom: 4px;
}

.md-content :deep(blockquote) {
  border-left: 3px solid var(--accent, #4f46e5);
  padding-left: 10px;
  color: var(--muted, #6b7280);
  margin: 8px 0;
}

.md-content :deep(hr) {
  border: none;
  border-top: 1px solid var(--line, #e5e7eb);
  margin: 14px 0;
}

.md-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 10px;
  font-size: 0.9rem;
}

.md-content :deep(th),
.md-content :deep(td) {
  border: 1px solid var(--line, #e5e7eb);
  padding: 6px 8px;
  text-align: left;
}

.md-content :deep(thead th) {
  background: rgba(148, 163, 253, 0.08);
  font-weight: 600;
}

.md-content :deep(a) {
  color: var(--accent, #4f46e5);
  text-decoration: underline;
}
</style>
