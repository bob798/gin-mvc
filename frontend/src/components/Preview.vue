<script setup>
import { computed, ref, watch, nextTick, onMounted } from 'vue'
import { renderMarkdown, renderMermaidIn, countStats } from '../composables/useRenderer'
import { useI18n } from '../composables/useI18n'

const { t } = useI18n()

const props = defineProps({
  source: String,
  mode: String
})

const stats = computed(() => countStats(props.source))
const mdHtml = computed(() => (props.mode === 'md' ? renderMarkdown(props.source) : ''))
const mdRoot = ref(null)

const htmlSrcdoc = computed(() => {
  if (props.mode !== 'html') return ''
  const base = '<base target="_blank">'
  const style = '<style>body{font-family:-apple-system,Segoe UI,Roboto,sans-serif;padding:24px;color:#24292f;}</style>'
  return `<!doctype html><html><head><meta charset="utf-8">${base}${style}</head><body>${props.source || ''}</body></html>`
})

async function renderDiagrams() {
  if (props.mode !== 'md') return
  await nextTick()
  await renderMermaidIn(mdRoot.value)
}

watch(mdHtml, renderDiagrams)
onMounted(renderDiagrams)
</script>

<template>
  <section class="pane">
    <div class="pane-head">
      <span class="pane-title">{{ t('preview') }}</span>
      <span class="hint">{{ t('charsLines', { c: stats.chars, l: stats.lines }) }}</span>
    </div>
    <div v-if="mode === 'md'" ref="mdRoot" class="markdown-body preview" v-html="mdHtml"></div>
    <iframe
      v-else
      class="preview html-frame"
      sandbox="allow-popups allow-popups-to-escape-sandbox"
      :srcdoc="htmlSrcdoc"
    ></iframe>
  </section>
</template>
