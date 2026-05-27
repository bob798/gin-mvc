<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import Toolbar from './components/Toolbar.vue'
import Editor from './components/Editor.vue'
import Preview from './components/Preview.vue'
import { renderMarkdown, detectMode } from './composables/useRenderer'

const DEFAULT_MD = `# 欢迎使用 MD / HTML 在线预览

这是一个支持 **Markdown** 与 **HTML** 文件实时预览的工具。

## 特性

- 📂 打开本地文件 / 拖拽到窗口
- 🔀 左右双栏实时渲染
- 🎨 代码高亮 + GitHub 风格样式
- 🛡 HTML 在沙箱 \`iframe\` 中渲染,默认禁用脚本
- ⬇ 导出渲染后的 HTML / 打印为 PDF
- 🌙 暗色 / 亮色主题

## 代码示例

\`\`\`python
def greet(name: str) -> str:
    return f"Hello, {name}!"

print(greet("Vue 3"))
\`\`\`

| 功能 | 状态 |
| --- | --- |
| Markdown 预览 | ✅ |
| HTML 预览 | ✅ |
| 导出 | ✅ |

> 试试拖拽一个 \`.md\` 或 \`.html\` 文件到窗口中。
`

const source = ref(DEFAULT_MD)
const mode = ref('md')
const view = ref('split')
const filename = ref('')
const dark = ref(false)
const splitRatio = ref(0.5)
const workspace = ref(null)

const editorVisible = computed(() => view.value !== 'preview')
const previewVisible = computed(() => view.value !== 'edit')

function setMode(m) {
  mode.value = m
}

function setView(v) {
  view.value = v
}

async function openFile(file) {
  const text = await file.text()
  source.value = text
  filename.value = file.name
  const detected = detectMode(file.name)
  if (detected) mode.value = detected
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

function toggleTheme() {
  dark.value = !dark.value
}

watch(dark, (v) => {
  document.documentElement.classList.toggle('dark', v)
  const link = document.querySelector('link[href*="highlight.js"]')
  if (link) {
    link.href = v
      ? 'https://cdn.jsdelivr.net/npm/highlight.js@11.10.0/styles/github-dark.min.css'
      : 'https://cdn.jsdelivr.net/npm/highlight.js@11.10.0/styles/github.min.css'
  }
})

const toastMsg = ref('')
let toastTimer = null
function toast(msg) {
  toastMsg.value = msg
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toastMsg.value = ''), 1800)
}

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
function endResize() {
  dragging = false
}

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

onMounted(() => {
  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', endResize)
})
onBeforeUnmount(() => {
  window.removeEventListener('mousemove', onMove)
  window.removeEventListener('mouseup', endResize)
})

const layoutStyle = computed(() => {
  if (view.value === 'edit') return { gridTemplateColumns: '1fr 0 0' }
  if (view.value === 'preview') return { gridTemplateColumns: '0 0 1fr' }
  const left = (splitRatio.value * 100).toFixed(2)
  const right = (100 - splitRatio.value * 100).toFixed(2)
  return { gridTemplateColumns: `${left}fr 6px ${right}fr` }
})
</script>

<template>
  <div class="app" @dragover="onDragOver" @dragleave="onDragLeave" @drop="onDrop">
    <Toolbar
      :mode="mode"
      :view="view"
      :filename="filename"
      :dark="dark"
      @open="openFile"
      @mode="setMode"
      @view="setView"
      @copy="copyHtml"
      @download="downloadHtml"
      @print="printPreview"
      @clear="clearAll"
      @toggle-theme="toggleTheme"
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
      <div class="drop-tip">松开鼠标以打开文件</div>
    </div>

    <transition name="fade">
      <div class="toast" v-if="toastMsg">{{ toastMsg }}</div>
    </transition>
  </div>
</template>
