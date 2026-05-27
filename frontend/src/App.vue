<script setup>
import { ref, computed, onMounted } from 'vue'
import Toolbar from './components/Toolbar.vue'
import Editor from './components/Editor.vue'
import Preview from './components/Preview.vue'
import ShareDialog from './components/ShareDialog.vue'
import { renderMarkdown, detectMode } from './composables/useRenderer'
import { fetchShare } from './composables/useShare'

const DEFAULT_MD = `# 欢迎使用 MD / HTML 在线预览

这是一个轻量在线预览工具,支持 **Markdown** 与 **HTML** 文件。

## 功能

- 📂 打开本地文件 / 拖拽文件到窗口
- 🔀 左右双栏实时预览
- 🛡 HTML 在沙箱 iframe 中渲染
- 🔗 一键生成短链分享(可设置过期时间)
- ⬇ 导出为 HTML

\`\`\`js
console.log("Hello, world!")
\`\`\`

> 把一个 \`.md\` 或 \`.html\` 文件拖进来试试。
`

const source = ref(DEFAULT_MD)
const mode = ref('md')
const filename = ref('')
const shareOpen = ref(false)
const toastMsg = ref('')
const dropActive = ref(false)
let toastTimer = null

function toast(msg) {
  toastMsg.value = msg
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toastMsg.value = ''), 1800)
}

async function openFile(file) {
  const text = await file.text()
  source.value = text
  filename.value = file.name
  const detected = detectMode(file.name)
  if (detected) mode.value = detected
}

function setMode(m) { mode.value = m }
function clearAll() { source.value = ''; filename.value = '' }

function getRenderedHtml() {
  if (mode.value === 'md') return renderMarkdown(source.value)
  return source.value || ''
}

async function copyHtml() {
  try {
    await navigator.clipboard.writeText(getRenderedHtml())
    toast('已复制 HTML 到剪贴板')
  } catch {
    toast('复制失败,请检查浏览器权限')
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

function onDrop(e) {
  e.preventDefault()
  dropActive.value = false
  const f = e.dataTransfer?.files?.[0]
  if (f) openFile(f)
}
function onDragOver(e) { e.preventDefault(); dropActive.value = true }
function onDragLeave(e) { if (e.target === e.currentTarget) dropActive.value = false }

async function loadShareFromUrl() {
  const m = location.pathname.match(/^\/s\/([A-Za-z0-9]+)$/)
  if (!m) return
  try {
    const data = await fetchShare(m[1])
    source.value = data.content
    mode.value = data.mode === 'html' ? 'html' : 'md'
    filename.value = data.name || `share-${data.code}`
    toast('已加载分享内容')
  } catch {
    toast('链接无效或已过期')
  }
}

onMounted(loadShareFromUrl)
</script>

<template>
  <div class="app" @dragover="onDragOver" @dragleave="onDragLeave" @drop="onDrop">
    <Toolbar
      :mode="mode"
      :filename="filename"
      @open="openFile"
      @mode="setMode"
      @share="shareOpen = true"
      @copy="copyHtml"
      @download="downloadHtml"
      @clear="clearAll"
    />

    <main class="workspace">
      <Editor v-model="source" :filename="filename" :mode="mode" />
      <Preview :source="source" :mode="mode" />
    </main>

    <div class="drop-mask" v-show="dropActive">
      <div class="drop-tip">松开鼠标以打开文件</div>
    </div>

    <ShareDialog
      v-model:open="shareOpen"
      :content="source"
      :mode="mode"
      @toast="toast"
    />

    <transition name="fade">
      <div class="toast" v-if="toastMsg">{{ toastMsg }}</div>
    </transition>
  </div>
</template>
