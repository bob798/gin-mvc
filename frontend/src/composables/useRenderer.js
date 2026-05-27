import { marked } from 'marked'
import DOMPurify from 'dompurify'
import hljs from 'highlight.js'

marked.setOptions({
  breaks: true,
  gfm: true,
  highlight(code, lang) {
    try {
      if (lang && hljs.getLanguage(lang)) {
        return hljs.highlight(code, { language: lang }).value
      }
      return hljs.highlightAuto(code).value
    } catch {
      return code
    }
  }
})

export function renderMarkdown(source) {
  const raw = marked.parse(source || '')
  return DOMPurify.sanitize(raw, { ADD_ATTR: ['target'] })
}

export function detectMode(filename) {
  if (!filename) return null
  const lower = filename.toLowerCase()
  if (lower.endsWith('.html') || lower.endsWith('.htm')) return 'html'
  if (lower.endsWith('.md') || lower.endsWith('.markdown')) return 'md'
  return null
}

export function countStats(text) {
  const t = text || ''
  const chars = t.length
  const lines = t === '' ? 0 : t.split('\n').length
  return { chars, lines }
}
