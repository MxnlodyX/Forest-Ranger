import React, { useEffect, useRef } from 'react';
import EditorJS from '@editorjs/editorjs';
import Header from '@editorjs/header';
import List from '@editorjs/list';
import Checklist from '@editorjs/checklist';
import Quote from '@editorjs/quote';
import Table from '@editorjs/table';
import Code from '@editorjs/code';
import InlineCode from '@editorjs/inline-code';

export function Editor({ data, onChange, placeholder = 'Start writing...' }) {
  const ejInstance = useRef(null);
  const editorRef = useRef(null);

  useEffect(() => {
    if (!ejInstance.current) {
      initEditor();
    }
    return () => {
      if (ejInstance.current && typeof ejInstance.current.destroy === 'function') {
        ejInstance.current.destroy();
        ejInstance.current = null;
      }
    };
  }, []);

  const initEditor = () => {
    const editor = new EditorJS({
      holder: editorRef.current,
      data: data || {},
      placeholder: placeholder,
      tools: {
        header: {
          class: Header,
          inlineToolbar: ['link'],
          config: {
            placeholder: 'Enter a header',
            levels: [2, 3, 4],
            defaultLevel: 2
          }
        },
        list: {
          class: List,
          inlineToolbar: true,
          config: {
            defaultStyle: 'unordered'
          }
        },
        checklist: {
          class: Checklist,
          inlineToolbar: true,
        },
        quote: {
          class: Quote,
          inlineToolbar: true,
          config: {
            quotePlaceholder: 'Enter a quote',
            captionPlaceholder: 'Quote\'s author',
          },
        },
        table: {
          class: Table,
          inlineToolbar: true,
          config: {
            rows: 2,
            cols: 3,
          },
        },
        code: Code,
        inlineCode: InlineCode,
      },
      onChange: async () => {
        const savedData = await editor.save();
        onChange(savedData);
      },
    });
    ejInstance.current = editor;
  };

  return (
    <div 
      ref={editorRef} 
      className="prose prose-sm max-w-none min-h-[300px] rounded-lg border border-gray-300 bg-white px-4 py-2 focus-within:border-green-500 focus-within:ring-1 focus-within:ring-green-500"
    />
  );
}
