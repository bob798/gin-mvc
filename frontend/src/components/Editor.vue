<script setup>
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
      <span class="pane-title">源代码</span>
      <span class="hint">{{ filename || '未命名' }} · {{ mode === 'md' ? 'Markdown' : 'HTML' }}</span>
    </div>
    <textarea
      class="editor"
      spellcheck="false"
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
      :placeholder="`粘贴 / 编辑 ${mode === 'md' ? 'Markdown' : 'HTML'},或把文件拖到窗口中...`"
    ></textarea>
  </section>
</template>
