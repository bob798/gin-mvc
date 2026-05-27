<script setup>
import { computed } from 'vue'
import { renderMarkdown, countStats } from '../composables/useRenderer'

const props = defineProps({
  source: String,
  mode: String
})

const stats = computed(() => countStats(props.source))

const mdHtml = computed(() =>
  props.mode === 'md' ? renderMarkdown(props.source) : ''
)

const htmlSrcdoc = computed(() => {
  if (props.mode !== 'html') return ''
  const base = '<base target="_blank">'
  const style = '<style>body{font-family:-apple-system,Segoe UI,Roboto,sans-serif;padding:24px;color:#24292f;}</style>'
  return `<!doctype html><html><head><meta charset="utf-8">${base}${style}</head><body>${props.source || ''}</body></html>`
})
</script>

<template>
  <section class="pane">
    <div class="pane-head">
      <span class="pane-title">预览</span>
      <span class="hint">{{ stats.chars }} 字 / {{ stats.lines }} 行</span>
    </div>
    <div v-if="mode === 'md'" class="markdown-body preview" v-html="mdHtml"></div>
    <iframe
      v-else
      class="preview html-frame"
      sandbox="allow-popups allow-popups-to-escape-sandbox"
      :srcdoc="htmlSrcdoc"
    ></iframe>
  </section>
</template>
