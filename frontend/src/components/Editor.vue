<script setup>
import { useI18n } from '../composables/useI18n'

const { t } = useI18n()

defineProps({
  modelValue: String,
  filename: String,
  mode: String
})
defineEmits(['update:modelValue'])
</script>

<template>
  <section class="pane">
    <div class="pane-head">
      <span class="pane-title">{{ t('source') }}</span>
      <span class="hint">{{ filename || t('untitled') }} · {{ mode === 'md' ? t('modeMd') : t('modeHtml') }}</span>
    </div>
    <textarea
      class="editor"
      spellcheck="false"
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
      :placeholder="mode === 'md' ? t('placeholderMd') : t('placeholderHtml')"
    ></textarea>
  </section>
</template>
