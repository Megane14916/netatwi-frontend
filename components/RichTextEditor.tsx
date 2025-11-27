'use client';

import { useEffect, useImperativeHandle, forwardRef } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import twemoji from 'twemoji';

// エディタのref経由で操作できるメソッドの定義
export interface RichTextEditorHandle {
  insertEmoji: (emoji: string) => void;
  getText: () => string;
  clear: () => void;
  isEmpty: () => boolean;
}

interface Props {
  content?: string;
  placeholder?: string;
  editable?: boolean;
  onChange?: (text: string) => void;
  className?: string;
}

const TWEMOJI_BASE_URL = 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72';

const getEmojiHex = (emoji: string) => {
  return Array.from(emoji).map(char => char.codePointAt(0)?.toString(16)).join('-');
};

const RichTextEditor = forwardRef<RichTextEditorHandle, Props>(({ 
  content = '', 
  placeholder = '', 
  editable = true,
  onChange,
  className 
}, ref) => {

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
    ],
    content: '', // 初期値はuseEffectでセット
    editable: editable,
    editorProps: {
      attributes: {
        class: `prose prose-invert prose-sm sm:prose-base focus:outline-none text-white min-h-[100px] w-full max-w-none ${className || ''}`,
      },
    },
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      if (onChange) {
        onChange(getEditorText(editor));
      }
    },
  });

  // エディタの内容をテキストとして取得する関数
  const getEditorText = (editor: Editor) => {
    let text = '';
    editor.state.doc.descendants((node) => {
      if (node.isText) {
        text += node.text;
      } else if (node.type.name === 'image') {
        text += node.attrs.alt || '';
      } else if (node.type.name === 'hardBreak') { // <br>タグ対応
        text += '\n';
      } else if (node.type.name === 'paragraph') {
        if (text.length > 0 && !text.endsWith('\n')) {
          text += '\n';
        }
      }
    });
    return text.trim();
  };

  // 外部からcontentが変更された場合の同期
  useEffect(() => {
    if (!editor) return;

    // 1. クリア処理: contentが空でエディタに中身がある場合
    if (content === '' && !editor.isEmpty) {
      editor.commands.clearContent();
      return;
    }

    // 2. 値のセット: 編集開始時など (contentがあり、かつエディタが空の場合)
    const currentText = getEditorText(editor);
    if (content !== '' && currentText === '') {
         // 改行を<br>タグに変換
         const textWithBr = content.replace(/\n/g, '<br/>');
         
         // twemojiでパースしてHTML文字列（<img>タグ含む）に変換
         const parsedContent = twemoji.parse(textWithBr, {
             folder: 'svg',
             ext: '.svg',
             className: 'twemoji-emoji', // CSSクラス
             // 必要に応じてbase URLを指定 (デフォルトはCDN)
         });

         // パース済みのHTMLをセットすることで、TipTapが画像ノードとして認識する
         editor.commands.setContent(parsedContent);
    }
  }, [content, editor]);

  useImperativeHandle(ref, () => ({
    insertEmoji: (emoji: string) => {
      if (!editor) return;
      
      const hex = getEmojiHex(emoji);
      const url = `${TWEMOJI_BASE_URL}/${hex}.png`;
      
      editor.chain().focus().setImage({ src: url, alt: emoji }).run();
    },
    getText: () => {
      return editor ? getEditorText(editor) : '';
    },
    clear: () => {
      editor?.commands.clearContent();
    },
    isEmpty: () => {
      return editor ? editor.isEmpty : true;
    }
  }));

  if (!editor) return null;

  return (
    <div className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 cursor-text relative" onClick={() => editor.commands.focus()}>
      <EditorContent editor={editor} />
      {editor.isEmpty && (
        <div className="absolute top-3 left-3 text-gray-500 pointer-events-none select-none">
          {placeholder}
        </div>
      )}
      <style jsx global>{`
        .ProseMirror p {
          margin: 0;
        }
        .ProseMirror img {
          display: inline-block;
          height: 1.2em;
          width: 1.2em;
          vertical-align: -0.2em;
          margin: 0 0.1em;
        }
        .ProseMirror:focus {
          outline: none;
        }
      `}</style>
    </div>
  );
});
RichTextEditor.displayName = 'RichTextEditor';
export default RichTextEditor;