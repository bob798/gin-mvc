<script setup>
import { ref, computed, watch, inject, nextTick } from 'vue'
import { useI18n } from '../composables/useI18n'

const { t } = useI18n()

const props = defineProps({ open: Boolean })
const emit = defineEmits(['update:open'])

const cmdActions = inject('cmdActions', computed(() => []))
const query = ref('')
const cursor = ref(0)
const input = ref(null)

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  const list = cmdActions.value || []
  if (!q) return list
  return list.filter(a => a.label.toLowerCase().includes(q))
})

watch(() => props.open, async (v) => {
  if (v) {
    query.value = ''
    cursor.value = 0
    await nextTick()
    input.value?.focus()
  }
})
watch(filtered, () => { cursor.value = 0 })

function close() { emit('update:open', false) }

function run(action) {
  close()
  action?.run?.()
}

function onKey(e) {
  if (e.key === 'Escape') return close()
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    cursor.value = (cursor.value + 1) % Math.max(1, filtered.value.length)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    cursor.value = (cursor.value - 1 + filtered.value.length) % Math.max(1, filtered.value.length)
  } else if (e.key === 'Enter') {
    e.preventDefault()
    const a = filtered.value[cursor.value]
    if (a) run(a)
  }
}
</script>

<template>
  <div v-if="open" class="cmd-mask" @click.self="close">
    <div class="cmd-panel">
      <input
        ref="input"
        v-model="query"
        type="text"
        :placeholder="t('cmdPlaceholder')"
        @keydown="onKey"
      />
      <ul class="cmd-list">
        <li v-for="(a, i) in filtered" :key="a.id"
            :class="['cmd-item', { active: i === cursor }]"
            @mouseenter="cursor = i"
            @click="run(a)">
          {{ a.label }}
        </li>
        <li v-if="!filtered.length" class="cmd-empty">{{ t('cmdNoResult') }}</li>
      </ul>
    </div>
  </div>
</template>
