import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import 'prosemirror-view/style/prosemirror.css';
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    Link as LinkIcon,
    Image as ImageIcon,
    List,
    ListOrdered,
    Type,
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignJustify,
    Highlighter
} from 'lucide-react';
import './TipTapEditor.css';

const TipTapEditor = ({
    value,
    onChange,
    placeholder = "Write your content here...",
    className = ""
}) => {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                // Configure Link extension that comes with StarterKit
                link: {
                    openOnClick: false,
                    HTMLAttributes: {
                        class: 'link',
                    },
                },
            }),
            Image.configure({
                HTMLAttributes: {
                    class: 'image',
                },
            }),
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            TextStyle,
            Color,
            Highlight.configure({
                multicolor: true,
            }),
        ],
        content: value,
        onUpdate: ({ editor }) => {
            // Convert to HTML format similar to ReactQuill
            const html = editor.getHTML();
            onChange(html);
        },
        editorProps: {
            attributes: {
                class: `tiptap-editor ${className}`,
                placeholder: placeholder,
            },
        },
    });

    if (!editor) {
        return null;
    }

    const addLink = () => {
        const url = window.prompt('Enter URL');
        if (url) {
            editor.chain().focus().setLink({ href: url }).run();
        }
    };

    const addImage = () => {
        const url = window.prompt('Enter image URL');
        if (url) {
            editor.chain().focus().setImage({ src: url }).run();
        }
    };

    const setColor = (color) => {
        editor.chain().focus().setColor(color).run();
    };

    const setHighlight = (color) => {
        editor.chain().focus().toggleHighlight({ color }).run();
    };

    return (
        <div className="tiptap-container">
            <div className="tiptap-toolbar">
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={`tiptap-btn ${editor.isActive('bold') ? 'active' : ''}`}
                    title="Bold"
                >
                    <Bold size={16} />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={`tiptap-btn ${editor.isActive('italic') ? 'active' : ''}`}
                    title="Italic"
                >
                    <Italic size={16} />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    className={`tiptap-btn ${editor.isActive('underline') ? 'active' : ''}`}
                    title="Underline"
                >
                    <UnderlineIcon size={16} />
                </button>

                <div className="tiptap-divider"></div>

                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    className={`tiptap-btn ${editor.isActive('heading', { level: 1 }) ? 'active' : ''}`}
                    title="Heading 1"
                >
                    H1
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    className={`tiptap-btn ${editor.isActive('heading', { level: 2 }) ? 'active' : ''}`}
                    title="Heading 2"
                >
                    H2
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    className={`tiptap-btn ${editor.isActive('heading', { level: 3 }) ? 'active' : ''}`}
                    title="Heading 3"
                >
                    H3
                </button>

                <div className="tiptap-divider"></div>

                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={`tiptap-btn ${editor.isActive('bulletList') ? 'active' : ''}`}
                    title="Bullet List"
                >
                    <List size={16} />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={`tiptap-btn ${editor.isActive('orderedList') ? 'active' : ''}`}
                    title="Numbered List"
                >
                    <ListOrdered size={16} />
                </button>

                <div className="tiptap-divider"></div>

                <button
                    type="button"
                    onClick={() => editor.chain().focus().setTextAlign('left').run()}
                    className={`tiptap-btn ${editor.isActive({ textAlign: 'left' }) ? 'active' : ''}`}
                    title="Align Left"
                >
                    <AlignLeft size={16} />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().setTextAlign('center').run()}
                    className={`tiptap-btn ${editor.isActive({ textAlign: 'center' }) ? 'active' : ''}`}
                    title="Align Center"
                >
                    <AlignCenter size={16} />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().setTextAlign('right').run()}
                    className={`tiptap-btn ${editor.isActive({ textAlign: 'right' }) ? 'active' : ''}`}
                    title="Align Right"
                >
                    <AlignRight size={16} />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                    className={`tiptap-btn ${editor.isActive({ textAlign: 'justify' }) ? 'active' : ''}`}
                    title="Justify"
                >
                    <AlignJustify size={16} />
                </button>

                <div className="tiptap-divider"></div>

                <button
                    type="button"
                    onClick={addLink}
                    className={`tiptap-btn ${editor.isActive('link') ? 'active' : ''}`}
                    title="Add Link"
                >
                    <LinkIcon size={16} />
                </button>
                <button
                    type="button"
                    onClick={addImage}
                    className="tiptap-btn"
                    title="Add Image"
                >
                    <ImageIcon size={16} />
                </button>

                <div className="tiptap-divider"></div>

                <div className="tiptap-color-picker">
                    <input
                        type="color"
                        onChange={(e) => setColor(e.target.value)}
                        className="tiptap-color-input"
                        title="Text Color"
                    />
                </div>
                <button
                    type="button"
                    onClick={() => setHighlight('#fef3c7')}
                    className={`tiptap-btn ${editor.isActive('highlight') ? 'active' : ''}`}
                    title="Highlight"
                >
                    <Highlighter size={16} />
                </button>

                <div className="tiptap-divider"></div>

                <button
                    type="button"
                    onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
                    className="tiptap-btn"
                    title="Clear Formatting"
                >
                    <Type size={16} />
                </button>
            </div>
            <EditorContent editor={editor} className="tiptap-content" />
        </div>
    );
};

export default TipTapEditor; 