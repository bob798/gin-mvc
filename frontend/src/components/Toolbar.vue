<script setup>
defineProps({
  mode: String,
  view: String,
  filename: String,
  dark: Boolean
})
const emit = defineEmits([
  'open', 'mode', 'view', 'copy', 'download', 'print', 'clear', 'toggle-theme'
])

function pickFile(e) {
  const f = e.target.files?.[0]
  if (f) emit('open', f)
  e.target.value = ''
}
</script>

<template>
  <header class="topbar">
    <div class="brand">
      <span class="logo">📄</span>
      <span class="title">MD / HTML 在线预览</span>
    </div>
    <div class="actions">
      <label class="btn">
        📂 打开文件
        <input type="file" accept=".md,.markdown,.html,.htm,.txt" hidden @change="pickFile" />
      </label>

      <div class="seg">
        <button :class="['seg-btn', { active: mode === 'md' }]" @click="emit('mode', 'md')">Markdown</button>
        <button :class="['seg-btn', { active: mode === 'html' }]" @click="emit('mode', 'html')">HTML</button>
      </div>

      <div class="seg">
        <button :class="['seg-btn', { active: view === 'split' }]" @click="emit('view', 'split')">分栏</button>
        <button :class="['seg-btn', { active: view === 'edit' }]" @click="emit('view', 'edit')">编辑</button>
        <button :class="['seg-btn', { active: view === 'preview' }]" @click="emit('view', 'preview')">预览</button>
      </div>

      <button class="btn" @click="emit('copy')" title="复制渲染后的 HTML">⧉ 复制 HTML</button>
      <button class="btn" @click="emit('download')" title="导出为 HTML 文件">⬇ 导出</button>
      <button class="btn" @click="emit('print')" title="打印 / 另存为 PDF">🖨 打印</button>
      <button class="btn" @click="emit('clear')" title="清空">✕ 清空</button>
      <button class="btn icon" @click="emit('toggle-theme')" :title="dark ? '亮色' : '暗色'">
        {{ dark ? '☀' : '🌙' }}
      </button>
    </div>
  </header>
</template>
