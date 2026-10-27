import { marked } from 'marked'
import DOMPurify from 'dompurify'

// Configure marked options
marked.setOptions({
  gfm: true,
  breaks: true,
})

export function renderMarkdownToHtml(markdown: string): string {
  if (!markdown) return ''
  try {
    var rawHtml = marked.parse(markdown) as string
    var cleanHtml = DOMPurify.sanitize(rawHtml, {
      ALLOWED_TAGS: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'p', 'br', 'hr',
        'strong', 'b', 'em', 'i', 'u', 's', 'del',
        'ul', 'ol', 'li',
        'blockquote', 'code', 'pre',
        'a', 'img',
        'table', 'thead', 'tbody', 'tr', 'th', 'td',
        'span', 'div',
      ],
      ALLOWED_ATTR: ['href', 'title', 'alt', 'src', 'class', 'target', 'rel'],
    })
    return cleanHtml
  } catch (err) {
    console.error('Error parsing markdown:', err)
    return DOMPurify.sanitize(markdown)
  }
}
