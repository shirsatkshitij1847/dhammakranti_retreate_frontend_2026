import { useCallback, useEffect, useRef, useState } from 'react'
import { API_BASE_URL, requestApi } from './retreatApi'
import './BlogPage.css'

const PAGE_SIZE = 10
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

function BlogPage({ account, token, authLoading }) {
  const [blogs, setBlogs] = useState([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [editing, setEditing] = useState(null)
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
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
    setError('')
    setNotice('')
    const file = fileRef.current.files[0]
    if (!title.trim() || !text.trim()) {
      setError('Title and text cannot be blank.')
      return
    }
    if ((!editing && !file) || (file && (!IMAGE_TYPES.includes(file.type) || file.size > 5 * 1024 * 1024))) {
      setError('Select a JPEG, PNG, or WebP image up to 5 MB.')
      return
    }
    const data = new FormData()
    if (!editing || title.trim() !== editing.title) data.append('title', title.trim())
    if (!editing || text.trim() !== editing.text) data.append('text', text.trim())
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
        <p>TRIRATNA AKOLA</p>
        <h1>ब्लॉग · Community stories</h1>
      </header>
      {authLoading ? <p role="status">Checking your account…</p> : canPublish ? (
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
            <label>Text
              <textarea value={text} onChange={(event) => setText(event.target.value)} maxLength={20000} rows={7} required />
            </label>
            <div className="blog-actions">
              <button type="submit">{busy ? 'Saving…' : editing ? 'Save changes' : 'Publish'}</button>
              {editing && <button type="button" onClick={resetForm}>Cancel editing</button>}
            </div>
          </fieldset>
        </form>
      ) : <p>{account ? 'Waiting for admin approval. Only organizers and admins can publish.' : <a href="#organization">Log in to publish as an organizer or admin.</a>}</p>}
      {error && <div className="blog-error" role="alert">{error} <button type="button" disabled={busy || loading} onClick={() => { setLoading(true); loadBlogs() }}>Retry loading posts</button></div>}
      {notice && <p role="status">{notice}</p>}
      {loading ? <p role="status">Loading posts…</p> : (
        <section className="blog-posts" aria-label="Blog posts" aria-busy={busy}>
          {!blogs.length && !error && <p>No posts on this page yet.</p>}
          {blogs.map((blog) => (
            <article className="blog-post" key={blog._id}>
              <h2>{blog.title}</h2>
              <img src={new URL(blog.imageUrl, `${API_BASE_URL}/`).href + `?v=${encodeURIComponent(blog.updatedAt || '')}`} alt={blog.title} loading="lazy" />
              <p className="blog-text">{blog.text}</p>
              {canManage(blog) && <div className="blog-actions">
                <button type="button" disabled={busy} onClick={() => {
                  setEditing(blog)
                  setTitle(blog.title)
                  setText(blog.text)
                  fileRef.current.value = ''
                  formRef.current.scrollIntoView({ block: 'start' })
                }}>Edit</button>
                <button type="button" disabled={busy} onClick={() => deleteBlog(blog)}>Delete</button>
              </div>}
            </article>
          ))}
        </section>
      )}
      <nav className="blog-pagination" aria-label="Blog pagination">
        <button type="button" disabled={page === 1 || loading || busy} onClick={() => { setLoading(true); setPage(page - 1) }}>Previous</button>
        <span>Page {page}</span>
        <button type="button" disabled={blogs.length < PAGE_SIZE || loading || busy} onClick={() => { setLoading(true); setPage(page + 1) }}>Next</button>
      </nav>
    </main>
  )
}

export default BlogPage
