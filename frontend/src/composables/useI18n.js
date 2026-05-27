import { reactive, computed } from 'vue'
import zh from '../locales/zh.js'
import en from '../locales/en.js'

const LS_KEY = 'previewer.lang'
const dicts = { zh, en }

const state = reactive({
  lang: localStorage.getItem(LS_KEY) || (navigator.language?.startsWith('zh') ? 'zh' : 'en')
})

function t(key, params) {
  const dict = dicts[state.lang] || zh
  let s = dict[key] ?? key
  if (params) {
    for (const k in params) s = s.replace(`{${k}}`, params[k])
  }
  return s
}

function setLang(l) {
  if (!dicts[l]) return
  state.lang = l
  localStorage.setItem(LS_KEY, l)
}

function toggleLang() {
  setLang(state.lang === 'zh' ? 'en' : 'zh')
}

export const i18n = {
  state,
  t,
  setLang,
  toggleLang,
  lang: computed(() => state.lang)
}

export function useI18n() {
  return i18n
}
