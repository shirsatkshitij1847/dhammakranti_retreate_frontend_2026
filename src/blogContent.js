import DOMPurify from 'dompurify'

export function getBlogTextFormat(blog) {
  if (blog.textFormat) return blog.textFormat
  return /^\s*<(?:p|h2|h3|ul|ol|blockquote)(?:\s[^>]*)?>[\s\S]*<\/(?:p|h2|h3|ul|ol|blockquote)>\s*$/i.test(blog.text)
    ? 'html'
    : 'plain'
}

export function sanitizeBlogHtml(html) {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'b', 'em', 'i', 'h2', 'h3', 'ul', 'ol', 'li', 'blockquote'],
    ALLOWED_ATTR: ['data-spacing'],
    ALLOW_DATA_ATTR: false,
    ALLOW_ARIA_ATTR: false,
  })
}

export function plainTextToHtml(text) {
  const escaped = text.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character])
  return escaped.split(/\n{2,}/).map((paragraph) => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`).join('')
}

export function blogPlainText(blog) {
  if (getBlogTextFormat(blog) !== 'html') return blog.text
  const element = document.createElement('div')
  element.innerHTML = sanitizeBlogHtml(blog.text).replace(/<\/(p|h2|h3|li|blockquote)>|<br\s*\/?>/gi, '$& ')
  return element.textContent.trim()
}
