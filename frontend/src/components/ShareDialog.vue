<script setup>
import { ref, watch } from 'vue'
import { createShare } from '../composables/useShare'
import { useI18n } from '../composables/useI18n'

const { t } = useI18n()

const props = defineProps({
  open: Boolean,
  content: String,
  mode: String,
  name: String
})
const emit = defineEmits(['update:open', 'toast'])

const expiry = ref('7d')
const localName = ref('')
const link = ref('')
const loading = ref(false)
const error = ref('')

const expiries = [
  { value: '5m', label: () => t('expiry5m') },
  { value: '1h', label: () => t('expiry1h') },
  { value: '1d', label: () => t('expiry1d') },
  { value: '7d', label: () => t('expiry7d') },
  { value: '30d', label: () => t('expiry30d') },
  { value: 'never', label: () => t('expiryNever') }
]

watch(() => props.open, (v) => {
  if (v) {
    localName.value = props.name || ''
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
      name: localName.value || null,
      expiry: expiry.value
    })
    link.value = `${location.origin}/s/${data.code}`
    emit('toast', t('shareSuccess'))
  } catch (e) {
    error.value = e.message || t('shareError')
  } finally {
    loading.value = false
  }
}

async function copyLink() {
  try {
    await navigator.clipboard.writeText(link.value)
    emit('toast', t('copied'))
  } catch {
    emit('toast', t('copyFailed'))
  }
}

function close() {
  emit('update:open', false)
}
</script>

<template>
  <div v-if="open" class="modal-mask" @click.self="close">
    <div class="modal">
      <div class="modal-head">
        <span>🔗 {{ t('shareTitle') }}</span>
        <button class="modal-close" @click="close">✕</button>
      </div>
      <div class="modal-body">
        <label class="field">
          <span>{{ t('shareName') }}</span>
          <input v-model="localName" type="text" maxlength="120" />
        </label>
        <label class="field">
          <span>{{ t('shareExpiry') }}</span>
          <select v-model="expiry">
            <option v-for="opt in expiries" :key="opt.value" :value="opt.value">
              {{ opt.label() }}
            </option>
          </select>
        </label>

        <button class="btn primary" :disabled="loading || !content" @click="submit">
          {{ loading ? t('shareLoading') : t('shareCreate') }}
        </button>

        <div v-if="error" class="error">{{ error }}</div>

        <div v-if="link" class="link-box">
          <input :value="link" readonly />
          <button class="btn" @click="copyLink">{{ t('shareCopy') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>
