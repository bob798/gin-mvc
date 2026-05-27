<script setup>
import { ref, provide } from 'vue'
import CommandPalette from './components/CommandPalette.vue'

const cmdOpen = ref(false)
provide('cmd', {
  open: () => (cmdOpen.value = true),
  close: () => (cmdOpen.value = false)
})
</script>

<template>
  <router-view />
  <CommandPalette v-model:open="cmdOpen" />
</template>
