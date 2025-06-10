// components/RichTextEditor.js - TIPTAP VERSION (Replace your existing file)
'use client'

import React from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Highlight from '@tiptap/extension-highlight'
import TextAlign from '@tiptap/extension-text-align'
import Link from '@tiptap/extension-link'
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered,
  Heading1,
  Heading2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Quote,
  Highlighter,
  Undo,
  Redo,
  Type
} from 'lucide-react'

export default function RichTextEditor({ 
  value = '', 
  onChange, 
  placeholder = 'Start typing...',
  className = '',
  minHeight = '200px'
}) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Highlight.configure({
        multicolor: true,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Link.configure({
        openOnClick: false,
      }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      onChange?.(html)
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none p-4',
        style: `min-height: ${minHeight}; direction: ltr; text-align: left;`,
        dir: 'ltr',
      },
    },
  })

  React.useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '')
    }
  }, [value, editor])

  if (!editor) {
    return <div className="animate-pulse bg-gray-200 h-64 rounded-lg"></div>
  }

  const addLink = () => {
    const url = window.prompt('Enter URL:')
    if (url) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    }
  }

  const ToolbarButton = ({ onClick, isActive, disabled, children, title }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      className={`p-2 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
        isActive 
          ? 'bg-blue-100 text-blue-700 border border-blue-300' 
          : 'hover:bg-gray-100 text-gray-600'
      }`}
    >
      {children}
    </button>
  )

  return (
    <div className={`border border-gray-300 rounded-lg overflow-hidden bg-white ${className}`} dir="ltr">
      {/* Toolbar */}
      <div className="border-b border-gray-200 p-2 bg-gray-50">
        <div className="flex flex-wrap items-center gap-1" dir="ltr">
          {/* Text Style */}
          <ToolbarButton
            onClick={() => editor.chain().focus().setParagraph().run()}
            isActive={editor.isActive('paragraph')}
            title="Normal Text"
          >
            <Type className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            isActive={editor.isActive('heading', { level: 1 })}
            title="Heading 1"
          >
            <Heading1 className="w-4 h-4" />
          </ToolbarButton>
          
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive('heading', { level: 2 })}
            title="Heading 2"
          >
            <Heading2 className="w-4 h-4" />
          </ToolbarButton>

          <div className="w-px h-6 bg-gray-300 mx-1" />

          {/* Text Formatting */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            title="Bold (Ctrl+B)"
          >
            <Bold className="w-4 h-4" />
          </ToolbarButton>
          
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            title="Italic (Ctrl+I)"
          >
            <Italic className="w-4 h-4" />
          </ToolbarButton>
          
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive('strike')}
            title="Strikethrough"
          >
            <Underline className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            isActive={editor.isActive('highlight')}
            title="Highlight"
          >
            <Highlighter className="w-4 h-4" />
          </ToolbarButton>

          <div className="w-px h-6 bg-gray-300 mx-1" />

          {/* Lists & Quote */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            title="Bullet List"
          >
            <List className="w-4 h-4" />
          </ToolbarButton>
          
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            title="Numbered List"
          >
            <ListOrdered className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive('blockquote')}
            title="Blockquote"
          >
            <Quote className="w-4 h-4" />
          </ToolbarButton>

          <div className="w-px h-6 bg-gray-300 mx-1" />

          {/* Alignment */}
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            isActive={editor.isActive({ textAlign: 'left' })}
            title="Align Left"
          >
            <AlignLeft className="w-4 h-4" />
          </ToolbarButton>
          
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            isActive={editor.isActive({ textAlign: 'center' })}
            title="Align Center"
          >
            <AlignCenter className="w-4 h-4" />
          </ToolbarButton>
          
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            isActive={editor.isActive({ textAlign: 'right' })}
            title="Align Right"
          >
            <AlignRight className="w-4 h-4" />
          </ToolbarButton>

          <div className="w-px h-6 bg-gray-300 mx-1" />

          {/* Link */}
          <ToolbarButton
            onClick={addLink}
            isActive={editor.isActive('link')}
            title="Add Link"
          >
            <LinkIcon className="w-4 h-4" />
          </ToolbarButton>

          <div className="w-px h-6 bg-gray-300 mx-1" />

          {/* Undo/Redo */}
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().chain().focus().undo().run()}
            title="Undo (Ctrl+Z)"
          >
            <Undo className="w-4 h-4" />
          </ToolbarButton>
          
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().chain().focus().redo().run()}
            title="Redo (Ctrl+Shift+Z)"
          >
            <Redo className="w-4 h-4" />
          </ToolbarButton>
        </div>
      </div>

      {/* Editor Content */}
      <div className="relative" dir="ltr">
        <EditorContent 
          editor={editor} 
          className="tiptap-editor"
          style={{ minHeight }}
        />
        
        {/* Placeholder */}
        {(!value || value.trim() === '' || editor.isEmpty) && (
          <div 
            className="absolute top-4 left-4 text-gray-400 pointer-events-none select-none"
            style={{ 
              zIndex: 1,
              direction: 'ltr',
              textAlign: 'left'
            }}
          >
            {placeholder}
          </div>
        )}
      </div>

      <style jsx global>{`
        .tiptap-editor .ProseMirror {
          outline: none;
          padding: 1rem;
          direction: ltr !important;
          text-align: left !important;
        }
        
        .tiptap-editor .ProseMirror p.is-editor-empty:first-child::before {
          content: '';
          float: left;
          color: transparent;
          pointer-events: none;
          height: 0;
        }
        
        .tiptap-editor .ProseMirror h1 {
          font-size: 1.875rem;
          font-weight: 700;
          margin: 1rem 0 0.5rem 0;
          line-height: 1.2;
          direction: ltr !important;
          text-align: left !important;
        }
        
        .tiptap-editor .ProseMirror h2 {
          font-size: 1.5rem;
          font-weight: 600;
          margin: 0.875rem 0 0.5rem 0;
          line-height: 1.3;
          direction: ltr !important;
          text-align: left !important;
        }
        
        .tiptap-editor .ProseMirror p {
          margin: 0.5rem 0;
          line-height: 1.6;
          direction: ltr !important;
          text-align: left !important;
        }
        
        .tiptap-editor .ProseMirror ul, 
        .tiptap-editor .ProseMirror ol {
          padding-left: 1.5rem !important;
          padding-right: 0 !important;
          margin: 0.75rem 0;
          direction: ltr !important;
          text-align: left !important;
        }
        
        .tiptap-editor .ProseMirror li {
          margin: 0.25rem 0;
          direction: ltr !important;
          text-align: left !important;
        }
        
        .tiptap-editor .ProseMirror blockquote {
          border-left: 4px solid #e5e7eb !important;
          border-right: none !important;
          padding-left: 1rem !important;
          padding-right: 0 !important;
          margin: 1rem 0;
          font-style: italic;
          color: #6b7280;
          direction: ltr !important;
          text-align: left !important;
        }
        
        .tiptap-editor .ProseMirror a {
          color: #2563eb;
          text-decoration: underline;
          direction: ltr !important;
        }
        
        .tiptap-editor .ProseMirror mark {
          background-color: #fef08a;
          border-radius: 0.25rem;
          padding: 0.125rem 0.25rem;
        }
        
        .tiptap-editor .ProseMirror * {
          direction: ltr !important;
        }
      `}</style>
    </div>
  )
}