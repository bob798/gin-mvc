<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, inject, provide } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Toolbar from '../components/Toolbar.vue'
import Editor from '../components/Editor.vue'
import Preview from '../components/Preview.vue'
import ShareDialog from '../components/ShareDialog.vue'
import HistoryPanel from '../components/HistoryPanel.vue'
import { renderMarkdown, detectMode } from '../composables/useRenderer'
import { useI18n } from '../composables/useI18n'
import { record as recordHistory } from '../composables/useHistory'
import { fetchShare } from '../composables/useShare'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const cmd = inject('cmd')

const DEFAULT_MD = `# 欢迎使用 MD / HTML 在线预览

支持 **Markdown** 与 **HTML** 文件实时预览,以及 Mermaid / PlantUML 图渲染。

## Mermaid 示例

\`\`\`mermaid
flowchart LR
  A[用户] --> B(打开 / 拖拽文件)
  B --> C{文件类型}
  C -->|.md| D[Markdown 渲染]
  C -->|.html| E[Sandbox iframe]
  D --> F[导出 / 分享 / 打印]
  E --> F
\`\`\`

## PlantUML 示例

\`\`\`plantuml
@startuml
actor User
participant Frontend
participant Backend
database SQLite

User -> Frontend: 点击分享
Frontend -> Backend: POST /api/share
Backend -> SQLite: INSERT shares
Backend --> Frontend: { code }
Frontend --> User: 复制短链
@enduml
\`\`\`

## 代码高亮

\`\`\`python
def greet(name: str) -> str:
    return f"Hello, {name}!"
\`\`\`

> 试试 \`Ctrl/Cmd + K\` 打开命令面板,或拖一个 \`.md\` / \`.html\` 文件到窗口。
`

const source = ref(DEFAULT_MD)
const mode = ref('md')
const view = ref('split')
const filename = ref('')
const splitRatio = ref(0.5)
const workspace = ref(null)
const shareOpen = ref(false)
const historyOpen = ref(false)
const loading = ref(false)

const editorVisible = computed(() => view.value !== 'preview')
const previewVisible = computed(() => view.value !== 'edit')

function setMode(m) { mode.value = m }
function setView(v) { view.value = v }

async function openFile(file) {
  const text = await file.text()
  source.value = text
  filename.value = file.name
  const detected = detectMode(file.name)
  if (detected) mode.value = detected
  recordHistory({ name: file.name, mode: mode.value, content: text })
}

function clearAll() {
  source.value = ''
  filename.value = ''
}

function getRenderedHtml() {
  if (mode.value === 'md') return renderMarkdown(source.value)
  return source.value || ''
}

async function copyHtml() {
  try {
    await navigator.clipboard.writeText(getRenderedHtml())
    toast(t('copied'))
  } catch {
    toast(t('copyFailed'))
  }
}

function downloadHtml() {
  const body = getRenderedHtml()
  const name = (filename.value || 'preview').replace(/\.(md|markdown|html?|txt)$/i, '')
  const full = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<title>${name}</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/github-markdown-css@5.6.1/github-markdown.min.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/highlight.js@11.10.0/styles/github.min.css">
<style>body{box-sizing:border-box;max-width:980px;margin:0 auto;padding:32px;}</style>
</head>
<body class="markdown-body">
${body}
</body>
</html>`
  const blob = new Blob([full], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${name}.html`
  a.click()
  URL.revokeObjectURL(url)
}

function printPreview() {
  const win = window.open('', '_blank')
  if (!win) return
  win.document.write(`<!doctype html><html><head><meta charset="utf-8">
    <title>${filename.value || 'preview'}</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/github-markdown-css@5.6.1/github-markdown.min.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/highlight.js@11.10.0/styles/github.min.css">
    <style>body{box-sizing:border-box;max-width:980px;margin:0 auto;padding:32px;}</style>
    </head><body class="markdown-body">${getRenderedHtml()}</body></html>`)
  win.document.close()
  win.onload = () => win.print()
}

function openShare() { shareOpen.value = true }
function openHistory() { historyOpen.value = true }
function openCmd() { cmd?.open?.() }

function loadHistoryItem(item) {
  source.value = item.content
  mode.value = item.mode
  filename.value = item.name || ''
  historyOpen.value = false
}

const toastMsg = ref('')
let toastTimer = null
function toast(msg) {
  toastMsg.value = msg
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toastMsg.value = ''), 1800)
}

defineExpose({ toast })

let dragging = false
function startResize(e) {
  dragging = true
  e.preventDefault()
}
function onMove(e) {
  if (!dragging || !workspace.value) return
  const rect = workspace.value.getBoundingClientRect()
  const ratio = (e.clientX - rect.left) / rect.width
  splitRatio.value = Math.max(0.15, Math.min(0.85, ratio))
}
function endResize() { dragging = false }

const dropActive = ref(false)
function onDrop(e) {
  e.preventDefault()
  dropActive.value = false
  const f = e.dataTransfer?.files?.[0]
  if (f) openFile(f)
}
function onDragOver(e) {
  e.preventDefault()
  dropActive.value = true
}
function onDragLeave(e) {
  if (e.target === e.currentTarget) dropActive.value = false
}

function onKeydown(e) {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    openCmd()
  }
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
    e.preventDefault()
    downloadHtml()
  }
}

async function loadFromRoute() {
  const code = route.params.code
  if (!code) return
  loading.value = true
  try {
    const data = await fetchShare(code)
    source.value = data.content
    mode.value = data.mode === 'html' ? 'html' : 'md'
    filename.value = data.name || `share-${data.code}`
    toast(t('shareLoaded'))
  } catch {
    toast(t('shareNotFound'))
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', endResize)
  window.addEventListener('keydown', onKeydown)
  loadFromRoute()
})
onBeforeUnmount(() => {
  window.removeEventListener('mousemove', onMove)
  window.removeEventListener('mouseup', endResize)
  window.removeEventListener('keydown', onKeydown)
})

watch(() => route.params.code, loadFromRoute)

const layoutStyle = computed(() => {
  if (view.value === 'edit') return { gridTemplateColumns: '1fr 0 0' }
  if (view.value === 'preview') return { gridTemplateColumns: '0 0 1fr' }
  const left = (splitRatio.value * 100).toFixed(2)
  const right = (100 - splitRatio.value * 100).toFixed(2)
  return { gridTemplateColumns: `${left}fr 6px ${right}fr` }
})

const cmdActions = computed(() => [
  { id: 'open', label: t('open'), run: () => document.getElementById('global-file-input')?.click() },
  { id: 'share', label: t('share'), run: openShare },
  { id: 'history', label: t('history'), run: openHistory },
  { id: 'copy', label: t('copyHtml'), run: copyHtml },
  { id: 'download', label: t('download'), run: downloadHtml },
  { id: 'print', label: t('print'), run: printPreview },
  { id: 'mode-md', label: `→ ${t('modeMd')}`, run: () => setMode('md') },
  { id: 'mode-html', label: `→ ${t('modeHtml')}`, run: () => setMode('html') },
  { id: 'view-split', label: `→ ${t('viewSplit')}`, run: () => setView('split') },
  { id: 'view-edit', label: `→ ${t('viewEdit')}`, run: () => setView('edit') },
  { id: 'view-preview', label: `→ ${t('viewPreview')}`, run: () => setView('preview') },
  { id: 'clear', label: t('clear'), run: clearAll }
])

provide('cmdActions', cmdActions)
</script>

<template>
  <div class="app" @dragover="onDragOver" @dragleave="onDragLeave" @drop="onDrop">
    <input id="global-file-input" type="file" accept=".md,.markdown,.html,.htm,.txt" hidden
      @change="(e) => { const f = e.target.files?.[0]; if (f) openFile(f); e.target.value = '' }" />

    <Toolbar
      :mode="mode"
      :view="view"
      :filename="filename"
      @open="openFile"
      @mode="setMode"
      @view="setView"
      @copy="copyHtml"
      @download="downloadHtml"
      @print="printPreview"
      @share="openShare"
      @history="openHistory"
      @cmd="openCmd"
      @clear="clearAll"
    />

    <main class="workspace" ref="workspace" :style="layoutStyle">
      <div class="slot" v-show="editorVisible">
        <Editor v-model="source" :filename="filename" :mode="mode" />
      </div>
      <div class="resizer" v-show="view === 'split'" @mousedown="startResize"></div>
      <div class="slot" v-show="previewVisible">
        <Preview :source="source" :mode="mode" />
      </div>
    </main>

    <div class="drop-mask" v-show="dropActive">
      <div class="drop-tip">{{ t('dragHint') }}</div>
    </div>

    <ShareDialog
      v-model:open="shareOpen"
      :content="source"
      :mode="mode"
      :name="filename"
      @toast="toast"
    />

    <HistoryPanel
      v-model:open="historyOpen"
      @load="loadHistoryItem"
    />

    <div v-if="loading" class="loading">Loading...</div>

    <transition name="fade">
      <div class="toast" v-if="toastMsg">{{ toastMsg }}</div>
    </transition>
  </div>
</template>
