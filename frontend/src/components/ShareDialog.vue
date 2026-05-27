<script setup>
import { ref, watch } from 'vue'
import { createShare } from '../composables/useShare'

const props = defineProps({
  open: Boolean,
  content: String,
  mode: String
})
const emit = defineEmits(['update:open', 'toast'])

const expiry = ref('7d')
const link = ref('')
const loading = ref(false)
const error = ref('')

const expiries = [
  ['5m', '5 分钟'],
  ['1h', '1 小时'],
  ['1d', '1 天'],
  ['7d', '7 天'],
  ['30d', '30 天'],
  ['never', '永久']
]

watch(() => props.open, (v) => {
  if (v) {
    link.value = ''
    error.value = ''
  }
})

async function submit() {
  loading.value = true
  error.value = ''
  try {
    const data = await createShare({
      content: props.content,
      mode: props.mode,
      expiry: expiry.value
    })
    link.value = `${location.origin}/s/${data.code}`
  } catch (e) {
    error.value = e.message || '生成失败'
  } finally {
    loading.value = false
  }
}

async function copyLink() {
  try {
    await navigator.clipboard.writeText(link.value)
    emit('toast', '链接已复制')
  } catch {
    emit('toast', '复制失败')
  }
}

function close() { emit('update:open', false) }
</script>

<template>
  <div v-if="open" class="modal-mask" @click.self="close">
    <div class="modal">
      <div class="modal-head">
        <span>🔗 生成短链分享</span>
        <button class="modal-close" @click="close">✕</button>
      </div>
      <div class="modal-body">
        <label class="field">
          <span>过期时间</span>
          <select v-model="expiry">
            <option v-for="[v, l] in expiries" :key="v" :value="v">{{ l }}</option>
          </select>
        </label>

        <button class="btn primary" :disabled="loading || !content" @click="submit">
          {{ loading ? '生成中...' : '生成链接' }}
        </button>

        <div v-if="error" class="error">{{ error }}</div>

        <div v-if="link" class="link-box">
          <input :value="link" readonly @focus="$event.target.select()" />
          <button class="btn" @click="copyLink">复制</button>
        </div>
      </div>
    </div>
  </div>
</template>
