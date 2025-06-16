'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Highlight from '@tiptap/extension-highlight'
import TextAlign from '@tiptap/extension-text-align'
import Link from '@tiptap/extension-link'
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Unlink
} from 'lucide-react'

const MenuBar = ({ editor }) => {
  if (!editor) {
    return null
  }

  const addLink = () => {
    const url = window.prompt('Enter the URL')
    if (url) {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }

  return (
    <div className="flex flex-wrap gap-1 p-2 border-b border-gray-200 bg-gray-50 rounded-t-lg">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={`p-2 rounded hover:bg-gray-200 ${
          editor.isActive('bold') ? 'bg-primary-100 text-primary-600' : 'text-gray-600'
        }`}
      >
        <Bold className="w-4 h-4" />
      </button>
      
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={`p-2 rounded hover:bg-gray-200 ${
          editor.isActive('italic') ? 'bg-primary-100 text-primary-600' : 'text-gray-600'
        }`}
      >
        <Italic className="w-4 h-4" />
      </button>
      
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editor.can().chain().focus().toggleStrike().run()}
        className={`p-2 rounded hover:bg-gray-200 ${
          editor.isActive('strike') ? 'bg-primary-100 text-primary-600' : 'text-gray-600'
        }`}
      >
        <Strikethrough className="w-4 h-4" />
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1 self-center" />

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-2 rounded hover:bg-gray-200 ${
          editor.isActive('bulletList') ? 'bg-primary-100 text-primary-600' : 'text-gray-600'
        }`}
      >
        <List className="w-4 h-4" />
      </button>
      
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-2 rounded hover:bg-gray-200 ${
          editor.isActive('orderedList') ? 'bg-primary-100 text-primary-600' : 'text-gray-600'
        }`}
      >
        <ListOrdered className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`p-2 rounded hover:bg-gray-200 ${
          editor.isActive('blockquote') ? 'bg-primary-100 text-primary-600' : 'text-gray-600'
        }`}
      >
        <Quote className="w-4 h-4" />
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1 self-center" />

      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        className={`p-2 rounded hover:bg-gray-200 ${
          editor.isActive({ textAlign: 'left' }) ? 'bg-primary-100 text-primary-600' : 'text-gray-600'
        }`}
      >
        <AlignLeft className="w-4 h-4" />
      </button>
      
      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        className={`p-2 rounded hover:bg-gray-200 ${
          editor.isActive({ textAlign: 'center' }) ? 'bg-primary-100 text-primary-600' : 'text-gray-600'
        }`}
      >
        <AlignCenter className="w-4 h-4" />
      </button>
      
      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        className={`p-2 rounded hover:bg-gray-200 ${
          editor.isActive({ textAlign: 'right' }) ? 'bg-primary-100 text-primary-600' : 'text-gray-600'
        }`}
      >
        <AlignRight className="w-4 h-4" />
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1 self-center" />

      <button
        type="button"
        onClick={addLink}
        className={`p-2 rounded hover:bg-gray-200 ${
          editor.isActive('link') ? 'bg-primary-100 text-primary-600' : 'text-gray-600'
        }`}
      >
        <LinkIcon className="w-4 h-4" />
      </button>
      
      <button
        type="button"
        onClick={() => editor.chain().focus().unsetLink().run()}
        disabled={!editor.isActive('link')}
        className="p-2 rounded hover:bg-gray-200 text-gray-600 disabled:opacity-50"
      >
        <Unlink className="w-4 h-4" />
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1 self-center" />

      <button
        type="button"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().chain().focus().undo().run()}
        className="p-2 rounded hover:bg-gray-200 text-gray-600 disabled:opacity-50"
      >
        <Undo className="w-4 h-4" />
      </button>
      
      <button
        type="button"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().chain().focus().redo().run()}
        className="p-2 rounded hover:bg-gray-200 text-gray-600 disabled:opacity-50"
      >
        <Redo className="w-4 h-4" />
      </button>
    </div>
  )
}

export default function RichTextEditor({ 
  value, 
  onChange, 
  placeholder = "Start typing...",
  minHeight = "200px",
  className = ""
}) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Highlight,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Link.configure({
        openOnClick: false,
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: `prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none p-4`,
        style: `min-height: ${minHeight}`,
      },
    },
  })

  return (
    <div className={`border border-gray-300 rounded-lg overflow-hidden ${className}`}>
      <MenuBar editor={editor} />
      <EditorContent 
        editor={editor} 
        className="min-h-[200px] max-h-[500px] overflow-y-auto"
        placeholder={placeholder}
      />
    </div>
  )
}