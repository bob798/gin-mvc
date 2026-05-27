import { ref } from 'vue'

const LS_KEY = 'previewer.history'
const MAX = 20

function load() {
  try {
    const arr = JSON.parse(localStorage.getItem(LS_KEY) || '[]')
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

export const history = ref(load())

function save() {
  localStorage.setItem(LS_KEY, JSON.stringify(history.value))
}

export function record({ name, mode, content }) {
  if (!content || content.length < 4) return
  const trimmed = content.slice(0, 200_000)
  const entry = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name: name || '',
    mode,
    content: trimmed,
    excerpt: trimmed.slice(0, 80).replace(/\s+/g, ' '),
    updatedAt: Date.now()
  }
  history.value = [entry, ...history.value.filter(h => h.content !== trimmed)].slice(0, MAX)
  save()
}

export function removeHistory(id) {
  history.value = history.value.filter(h => h.id !== id)
  save()
}

export function clearHistory() {
  history.value = []
  save()
}
