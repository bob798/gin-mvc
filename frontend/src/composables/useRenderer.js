import { marked } from 'marked'
import DOMPurify from 'dompurify'
import hljs from 'highlight.js'
import pako from 'pako'

let mermaidPromise = null
let mermaidSeq = 0

function loadMermaid() {
  if (!mermaidPromise) {
    mermaidPromise = import('mermaid').then((m) => {
      m.default.initialize({
        startOnLoad: false,
        securityLevel: 'strict',
        theme: document.documentElement.classList.contains('dark') ? 'dark' : 'default'
      })
      return m.default
    })
  }
  return mermaidPromise
}

function encodePlantUml(text) {
  const bytes = new TextEncoder().encode(text)
  const compressed = pako.deflate(bytes, { level: 9 })
  let bin = ''
  for (const b of compressed) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

const renderer = new marked.Renderer()
const baseCode = renderer.code.bind(renderer)
renderer.code = function (code, info, escaped) {
  const lang = (info || '').trim().toLowerCase()
  if (lang === 'mermaid') {
    const id = `mmd-${++mermaidSeq}`
    const safe = String(code).replace(/</g, '&lt;')
    return `<div class="diagram mermaid" data-id="${id}">${safe}</div>`
  }
  if (lang === 'plantuml' || lang === 'puml') {
    const encoded = encodePlantUml(code)
    const src = `https://kroki.io/plantuml/svg/${encoded}`
    return `<div class="diagram plantuml"><img loading="lazy" alt="plantuml diagram" src="${src}"></div>`
  }
  return baseCode(code, info, escaped)
}

marked.setOptions({
  breaks: true,
  gfm: true,
  renderer,
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

DOMPurify.addHook('uponSanitizeAttribute', (node, data) => {
  if (data.attrName === 'data-id' && node.classList?.contains('mermaid')) {
    data.forceKeepAttr = true
  }
})

export function renderMarkdown(source) {
  const raw = marked.parse(source || '')
  return DOMPurify.sanitize(raw, {
    ADD_ATTR: ['target', 'data-id'],
    ADD_TAGS: ['svg', 'path', 'g', 'rect', 'circle', 'line', 'text', 'foreignObject']
  })
}

export async function renderMermaidIn(container) {
  if (!container) return
  const nodes = container.querySelectorAll('.diagram.mermaid')
  if (!nodes.length) return
  const mermaid = await loadMermaid()
  for (const el of nodes) {
    const code = el.textContent
    const id = el.dataset.id || `mmd-${++mermaidSeq}`
    try {
      const { svg } = await mermaid.render(id, code)
      el.innerHTML = svg
    } catch (e) {
      el.innerHTML = `<pre class="diagram-error">Mermaid error: ${String(e.message || e).replace(/</g, '&lt;')}</pre>`
    }
  }
}

export function refreshMermaidTheme() {
  mermaidPromise = null
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
  return { chars: t.length, lines: t === '' ? 0 : t.split('\n').length }
}
