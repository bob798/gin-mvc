<script setup>
import { history, removeHistory, clearHistory } from '../composables/useHistory'
import { useI18n } from '../composables/useI18n'

const { t } = useI18n()

defineProps({ open: Boolean })
const emit = defineEmits(['update:open', 'load'])

function close() { emit('update:open', false) }
function pick(item) { emit('load', item) }

function fmt(ts) {
  const d = new Date(ts)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
</script>

<template>
  <div v-if="open" class="modal-mask" @click.self="close">
    <div class="modal wide">
      <div class="modal-head">
        <span>🕘 {{ t('history') }}</span>
        <div>
          <button class="btn" @click="clearHistory" v-if="history.length">{{ t('historyClear') }}</button>
          <button class="modal-close" @click="close">✕</button>
        </div>
      </div>
      <div class="modal-body">
        <div v-if="!history.length" class="empty">{{ t('historyEmpty') }}</div>
        <ul class="hist-list">
          <li v-for="h in history" :key="h.id" @click="pick(h)">
            <div class="hist-title">
              <span class="badge" :class="h.mode">{{ h.mode.toUpperCase() }}</span>
              <span>{{ h.name || t('untitled') }}</span>
              <span class="muted">{{ fmt(h.updatedAt) }}</span>
            </div>
            <div class="hist-excerpt">{{ h.excerpt }}</div>
            <button class="hist-del" @click.stop="removeHistory(h.id)">✕</button>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
