<script setup>
defineProps({
  mode: String,
  filename: String
})
const emit = defineEmits(['open', 'mode', 'share', 'copy', 'download', 'clear'])

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
      <button class="btn primary" @click="emit('share')">🔗 分享</button>
      <button class="btn" @click="emit('copy')">⧉ 复制 HTML</button>
      <button class="btn" @click="emit('download')">⬇ 导出</button>
      <button class="btn" @click="emit('clear')">✕ 清空</button>
    </div>
  </header>
</template>
