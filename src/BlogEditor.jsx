import { useEffect } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Paragraph from '@tiptap/extension-paragraph'
import { plainTextToHtml, sanitizeBlogHtml } from './blogContent'

const SpacedParagraph = Paragraph.extend({
    addAttributes() {
      return {
        spacing: {
          default: 'normal',
          parseHTML: (element) => element.getAttribute('data-spacing') || 'normal',
          renderHTML: (attributes) => ({ 'data-spacing': attributes.spacing }),
        },
      }
    },
  })

export default function BlogEditor({ value, textFormat, onChange, disabled }) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        paragraph: false,
        heading: { levels: [2, 3] },
        link: false,
        underline: false,
        code: false,
        codeBlock: false,
        horizontalRule: false,
        strike: false,
      }),
      SpacedParagraph,
    ],
    content: textFormat === 'html' ? sanitizeBlogHtml(value) : plainTextToHtml(value),
    shouldRerenderOnTransaction: true,
    editorProps: {
      attributes: { role: 'textbox', 'aria-label': 'Story text', 'aria-multiline': 'true' },
    },
    onUpdate: ({ editor: current }) => onChange(current.getHTML()),
  })

  useEffect(() => {
    if (!editor || editor.isDestroyed) return
    const html = textFormat === 'html' ? sanitizeBlogHtml(value) : plainTextToHtml(value)
    if (editor.getHTML() !== html && !(editor.isEmpty && !value)) {
      editor.commands.setContent(html, { emitUpdate: false })
    }
  }, [editor, value, textFormat])

  useEffect(() => {
    if (editor && !editor.isDestroyed) editor.setEditable(!disabled)
  }, [editor, disabled])

  if (!editor) return <p role="status">Loading editor…</p>

  const commands = [
    ['Bold', 'B', editor.isActive('bold'), () => editor.chain().focus().toggleBold().run()],
    ['Italic', 'I', editor.isActive('italic'), () => editor.chain().focus().toggleItalic().run()],
    ['Heading', 'H2', editor.isActive('heading', { level: 2 }), () => editor.chain().focus().toggleHeading({ level: 2 }).run()],
    ['Subheading', 'H3', editor.isActive('heading', { level: 3 }), () => editor.chain().focus().toggleHeading({ level: 3 }).run()],
    ['Bullet list', '• List', editor.isActive('bulletList'), () => editor.chain().focus().toggleBulletList().run()],
    ['Numbered list', '1. List', editor.isActive('orderedList'), () => editor.chain().focus().toggleOrderedList().run()],
    ['Quote', 'Quote', editor.isActive('blockquote'), () => editor.chain().focus().toggleBlockquote().run()],
  ]

  return (
    <div className="blog-rich-editor">
      <div className="blog-format-toolbar" role="group" aria-label="Story formatting">
        {commands.map(([label, caption, active, command]) => (
          <button key={label} type="button" aria-label={label} aria-pressed={active}
            disabled={disabled} onMouseDown={(event) => event.preventDefault()} onClick={command}>{caption}</button>
        ))}
        <label>Paragraph spacing
          <select aria-label="Paragraph spacing" disabled={disabled}
            value={editor.getAttributes('paragraph').spacing || 'normal'}
            onChange={(event) => editor.chain().focus().updateAttributes('paragraph', { spacing: event.target.value }).run()}>
            <option value="compact">Compact</option>
            <option value="normal">Normal</option>
            <option value="wide">Wide</option>
          </select>
        </label>
        <button type="button" disabled={disabled || !editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}>Undo</button>
        <button type="button" disabled={disabled || !editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}>Redo</button>
      </div>
      <EditorContent editor={editor} className="blog-formatted-content" />
      <small>Style your story above. Maximum 20,000 characters including formatting.</small>
    </div>
  )
}
