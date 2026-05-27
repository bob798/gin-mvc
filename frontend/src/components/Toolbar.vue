<script setup>
import { useI18n } from '../composables/useI18n'
import { dark, toggleTheme } from '../composables/useTheme'

const { t, state, toggleLang } = useI18n()

defineProps({
  mode: String,
  view: String,
  filename: String
})
const emit = defineEmits([
  'open', 'mode', 'view', 'copy', 'download', 'print', 'share', 'history', 'cmd', 'clear'
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
      <span class="title">{{ t('brand') }}</span>
    </div>
    <div class="actions">
      <label class="btn">
        📂 {{ t('open') }}
        <input type="file" accept=".md,.markdown,.html,.htm,.txt" hidden @change="pickFile" />
      </label>

      <div class="seg">
        <button :class="['seg-btn', { active: mode === 'md' }]" @click="emit('mode', 'md')">{{ t('modeMd') }}</button>
        <button :class="['seg-btn', { active: mode === 'html' }]" @click="emit('mode', 'html')">{{ t('modeHtml') }}</button>
      </div>

      <div class="seg">
        <button :class="['seg-btn', { active: view === 'split' }]" @click="emit('view', 'split')">{{ t('viewSplit') }}</button>
        <button :class="['seg-btn', { active: view === 'edit' }]" @click="emit('view', 'edit')">{{ t('viewEdit') }}</button>
        <button :class="['seg-btn', { active: view === 'preview' }]" @click="emit('view', 'preview')">{{ t('viewPreview') }}</button>
      </div>

      <button class="btn" @click="emit('share')">🔗 {{ t('share') }}</button>
      <button class="btn" @click="emit('copy')">⧉ {{ t('copyHtml') }}</button>
      <button class="btn" @click="emit('download')">⬇ {{ t('download') }}</button>
      <button class="btn" @click="emit('print')">🖨 {{ t('print') }}</button>
      <button class="btn" @click="emit('history')">🕘 {{ t('history') }}</button>
      <button class="btn" @click="emit('cmd')" title="Ctrl/Cmd + K">⌘K</button>
      <button class="btn" @click="emit('clear')">✕ {{ t('clear') }}</button>
      <button class="btn icon" @click="toggleLang" :title="t('language')">
        {{ state.lang === 'zh' ? '中' : 'EN' }}
      </button>
      <button class="btn icon" @click="toggleTheme" :title="dark ? t('themeLight') : t('themeDark')">
        {{ dark ? '☀' : '🌙' }}
      </button>
    </div>
  </header>
</template>
