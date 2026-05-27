import { ref, watch } from 'vue'

const LS_KEY = 'previewer.theme'
const HLJS_LIGHT = 'https://cdn.jsdelivr.net/npm/highlight.js@11.10.0/styles/github.min.css'
const HLJS_DARK = 'https://cdn.jsdelivr.net/npm/highlight.js@11.10.0/styles/github-dark.min.css'

export const dark = ref(localStorage.getItem(LS_KEY) === 'dark')

function syncHljs(v) {
  let link = document.getElementById('hljs-theme')
  if (!link) {
    link = document.createElement('link')
    link.rel = 'stylesheet'
    link.id = 'hljs-theme'
    document.head.appendChild(link)
  }
  link.href = v ? HLJS_DARK : HLJS_LIGHT
}

export function applyStoredTheme() {
  document.documentElement.classList.toggle('dark', dark.value)
  syncHljs(dark.value)
}

watch(dark, (v) => {
  document.documentElement.classList.toggle('dark', v)
  syncHljs(v)
  localStorage.setItem(LS_KEY, v ? 'dark' : 'light')
})

export function toggleTheme() {
  dark.value = !dark.value
}
