import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { API_BASE_URL, requestApi } from './retreatApi'
import { blogPlainText, getBlogTextFormat, sanitizeBlogHtml } from './blogContent'
import './BlogPage.css'

const PAGE_SIZE = 10
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const BlogEditor = lazy(() => import('./BlogEditor'))

function BlogPage({ account, token, authLoading }) {
  const [blogs, setBlogs] = useState([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [editing, setEditing] = useState(null)
  const [detailId, setDetailId] = useState(null)
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [textFormat, setTextFormat] = useState('html')
  const fileRef = useRef(null)
  const formRef = useRef(null)
  const canPublish = ['organizer', 'admin'].includes(account?.role)
  const canManage = (blog) => canPublish && (
    account.role === 'admin' || blog.authorId === account._id
  )

  const loadBlogs = useCallback(async (signal) => {
    try {
      const posts = await requestApi(`/api/blogs?page=${page}&limit=${PAGE_SIZE}`, { signal })
      if (!Array.isArray(posts)) throw new Error('Invalid blog list returned by the API.')
      setError('')
      setBlogs(posts)
    } catch (failure) {
      if (failure.name !== 'AbortError') setError(failure.message)
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [page])

  const resetForm = () => {
    setEditing(null)
    setTitle('')
    setText('')
    setTextFormat('html')
    if (fileRef.current) fileRef.current.value = ''
  }

  useEffect(() => {
    const controller = new AbortController()
    requestApi(`/api/blogs?page=${page}&limit=${PAGE_SIZE}`, { signal: controller.signal })
      .then((posts) => {
        if (!Array.isArray(posts)) throw new Error('Invalid blog list returned by the API.')
        setBlogs(posts)
        setError('')
      })
      .catch((failure) => {
        if (failure.name !== 'AbortError') setError(failure.message)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [page])

  const publish = async (event) => {
    event.preventDefault()
    if (busy) return
    setError('')
    setNotice('')
    const file = fileRef.current.files[0]
    if (!title.trim() || !blogPlainText({ text, textFormat }).trim() || text.trim().length > 20000) {
      setError('Title and story cannot be blank. Story must be at most 20,000 characters including formatting.')
      return
    }
    if ((!editing && !file) || (file && (!IMAGE_TYPES.includes(file.type) || file.size > 5 * 1024 * 1024))) {
      setError('Select a JPEG, PNG, or WebP image up to 5 MB.')
      return
    }
    const data = new FormData()
    if (!editing || title.trim() !== editing.title) data.append('title', title.trim())
    if (!editing || text.trim() !== editing.text || textFormat !== (editing.textFormat || 'plain')) {
      data.append('text', text.trim())
      data.append('textFormat', textFormat)
    }
    if (file) data.append('image', file)
    if ([...data.keys()].length === 0) {
      setError('Change the title, text, or image before saving.')
      return
    }
    setBusy(true)
    try {
      await requestApi(editing ? `/api/blogs/${encodeURIComponent(editing._id)}` : '/api/blogs', {
        method: editing ? 'PATCH' : 'POST',
        body: data,
      }, token)
      setNotice(editing ? 'Post updated.' : 'Post published and publicly visible.')
      setDetailId(null)
      resetForm()
      setLoading(true)
      if (page !== 1) setPage(1)
      else await loadBlogs()
    } catch (failure) {
      setError(failure.message)
    } finally {
      setBusy(false)
    }
  }

  const deleteBlog = async (blog) => {
    if (!window.confirm(`Permanently delete "${blog.title}"? This cannot be undone.`)) return
    setBusy(true)
    setError('')
    setNotice('')
    try {
      await requestApi(`/api/blogs/${encodeURIComponent(blog._id)}`, { method: 'DELETE' }, token)
      if (detailId === blog._id) setDetailId(null)
      setLoading(true)
      if (blogs.length === 1 && page > 1) setPage(page - 1)
      else await loadBlogs()
      if (editing?._id === blog._id) resetForm()
      setNotice('Post deleted.')
    } catch (failure) {
      setError(failure.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="blog-page">
      <header className="blog-heading">
        <p className="story-kicker">THE COMMUNITY JOURNAL</p>
        <h1>News &amp; Stories</h1>
        <p className="blog-heading-copy">Moments of friendship. Stories of transformation. A little inspiration for your journey.</p>
      </header>
      {!authLoading && canPublish && (
        <form className="blog-editor" ref={formRef} onSubmit={publish}>
          <h2>{editing ? 'Edit post' : 'Create a post'}</h2>
          <p>Published posts are visible to everyone.</p>
          <fieldset disabled={busy}>
            <label>Title
              <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={200} required />
            </label>
            <label>Image · JPEG, PNG, WebP · maximum 5 MB
              <input type="file" ref={fileRef} accept="image/jpeg,image/png,image/webp" required={!editing} />
            </label>
            {editing && <p>Leave the image field empty to keep the current image.</p>}
            <Suspense fallback={<p role="status">Loading editor…</p>}>
              <BlogEditor key={editing?._id || 'new'} value={text} textFormat={textFormat}
                disabled={busy} onChange={(html) => { setText(html); setTextFormat('html') }} />
            </Suspense>
            <div className="blog-actions">
              <button type="submit">{busy ? 'Saving…' : editing ? 'Save changes' : 'Publish'}</button>
              {editing && <button type="button" onClick={resetForm}>Cancel editing</button>}
            </div>
          </fieldset>
        </form>
      )}
      {error && <div className="blog-error" role="alert">{error} <button type="button" disabled={busy || loading} onClick={() => { setLoading(true); loadBlogs() }}>Retry loading posts</button></div>}
      {notice && <p role="status">{notice}</p>}
      {loading ? <p role="status">Loading posts…</p> : (
        <section className={`blog-posts ${detailId ? 'blog-reading-view' : 'blog-story-grid'}`} aria-label="News and stories" aria-busy={busy}>
          {detailId && <button type="button" onClick={() => setDetailId(null)}>Back to all stories</button>}
          {!blogs.length && !error && <p>No posts on this page yet.</p>}
          {blogs.filter((blog) => !detailId || blog._id === detailId).map((blog) => (
            <article className={`blog-post${detailId ? ' blog-post-expanded' : ''}`} key={`${blog._id}-${Boolean(detailId)}`}>
              <p className="story-kicker">{detailId ? 'TRIRATNA AKOLA · COMMUNITY JOURNAL' : 'FROM OUR COMMUNITY'}</p>
              <h2 tabIndex={-1} ref={(heading) => {
                if (heading && detailId) heading.focus({ preventScroll: true })
              }}>{blog.title}</h2>
              <div className="story-meta">
                <span>News &amp; Stories</span>
                <span>{Math.max(1, Math.ceil(blogPlainText(blog).trim().split(/\s+/).length / 200))} min read</span>
                {blog.createdAt && <time dateTime={blog.createdAt}>{new Date(blog.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' })}</time>}
              </div>
              <img src={new URL(blog.imageUrl, `${API_BASE_URL}/`).href + `?v=${encodeURIComponent(blog.updatedAt || '')}`} alt={blog.title} loading="lazy" />
              {detailId && getBlogTextFormat(blog) === 'html'
                ? <div className="blog-text blog-formatted-content" dangerouslySetInnerHTML={{ __html: sanitizeBlogHtml(blog.text) }} />
                : <p className="blog-text">{detailId ? blog.text : `${blogPlainText(blog).slice(0, 240)}${blogPlainText(blog).length > 240 ? '…' : ''}`}</p>}
              {!detailId && <button
                type="button"
                aria-label={`View more: ${blog.title}`}
                onClick={(event) => {
                  setDetailId(blog._id)
                  event.currentTarget.closest('section').scrollIntoView({ block: 'start' })
                }}
              >View more <span aria-hidden="true">→</span></button>}
              {canManage(blog) && <div className="blog-actions">
                <button type="button" disabled={busy} onClick={() => {
                  setEditing(blog)
                  setTitle(blog.title)
                  setText(blog.text)
                  setTextFormat(getBlogTextFormat(blog))
                  fileRef.current.value = ''
                  formRef.current.scrollIntoView({ block: 'start' })
                }}>Edit</button>
                <button type="button" disabled={busy} onClick={() => deleteBlog(blog)}>Delete</button>
              </div>}
            </article>
          ))}
        </section>
      )}
      {!detailId && <nav className="blog-pagination" aria-label="News and stories pagination">
        <button type="button" disabled={page === 1 || loading || busy} onClick={() => { setLoading(true); setPage(page - 1) }}>Previous</button>
        <span>Page {page}</span>
        <button type="button" disabled={blogs.length < PAGE_SIZE || loading || busy} onClick={() => { setLoading(true); setPage(page + 1) }}>Next</button>
      </nav>}
    </main>
  )
}

export default BlogPage
