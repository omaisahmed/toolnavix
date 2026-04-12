'use client';

import { useEffect, useRef } from 'react';
import { sanitizeRichHtml, stripHtml } from '../lib/richText';
import { useState } from 'react';

type RichTextEditorProps = {
  value: string;
  onChange: (nextValue: string) => void;
  maxLength?: number;
  minHeightClassName?: string;
  placeholder?: string;
  error?: string;
};

export default function RichTextEditor({
  value,
  onChange,
  maxLength,
  minHeightClassName = 'min-h-[180px]',
  placeholder = 'Write description...',
  error,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [isHtmlInputOpen, setIsHtmlInputOpen] = useState(false);
  const [htmlInput, setHtmlInput] = useState('');

  useEffect(() => {
    if (!editorRef.current) return;
    if (editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const applyCommand = (command: string, commandValue?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, commandValue);
    const html = sanitizeRichHtml(editorRef.current?.innerHTML || '');
    onChange(html);
  };

  const handleInput = () => {
    if (!editorRef.current) return;

    const html = sanitizeRichHtml(editorRef.current.innerHTML);
    const plainText = stripHtml(html);

    if (maxLength && plainText.length > maxLength) {
      const trimmed = plainText.slice(0, maxLength);
      editorRef.current.innerText = trimmed;
      onChange(trimmed);
      return;
    }

    onChange(html);
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    event.preventDefault();
    
    // Try to get HTML content first, fall back to plain text
    const htmlData = event.clipboardData.getData('text/html');
    const textData = event.clipboardData.getData('text/plain');
    
    if (htmlData) {
      // Sanitize and insert HTML
      const sanitized = sanitizeRichHtml(htmlData);
      document.execCommand('insertHTML', false, sanitized);
    } else if (textData) {
      // Fall back to plain text
      document.execCommand('insertText', false, textData);
    }
    
    // Handle image files from clipboard
    const files = event.clipboardData.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith('image/')) {
          // Insert loading placeholder
          const loadingImg = document.createElement('img');
          loadingImg.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDMTMuMSAyIDE0IDIuOSAxNCA0VjE2QzE0IDE3LjEgMTMuMSAxOCA5IDE4QzYuOSAxOCA2IDE3LjEgNiAxNlY0QzYgMi45IDYuOSAyIDggMkgxNkMxNy4xIDIgMTggMi45IDE4IDRWMTZDMTggMTcuMSAxNy4xIDE4IDE2IDE4SDEyQzEwLjkgMTggMTAgMTcuMSAxMCAxNlY0QzEwIDIuOSAxMC45IDIgMTIgMloiIGZpbGw9IiM5Q0E0QUYiLz4KPC9zdmc+';
          loadingImg.style.cssText = 'width: 24px; height: 24px; display: inline-block; margin: 10px 0;';
          document.execCommand('insertHTML', false, loadingImg.outerHTML);

          // Upload to Cloudinary
          (async () => {
            try {
              const formData = new FormData();
              formData.append('image', file);
              formData.append('folder', 'editor');

              const token = localStorage.getItem('toolnavix_token');
              const response = await fetch('/api/upload-image', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                },
                body: formData,
              });

              if (response.ok) {
                const data = await response.json();
                // Replace loading image with uploaded image
                const imgHtml = `<img src="${data.url}" style="max-width: 100%; height: auto; margin: 10px 0;" alt="Pasted image" />`;
                // Find and replace the loading image
                const loadingImgs = editorRef.current?.querySelectorAll('img[src*="data:image/svg+xml"]');
                if (loadingImgs && loadingImgs.length > 0) {
                  const lastLoadingImg = loadingImgs[loadingImgs.length - 1];
                  lastLoadingImg.outerHTML = imgHtml;
                }
              } else {
                // Remove loading image and show error
                const errorMsg = document.createElement('span');
                errorMsg.textContent = 'Failed to upload image';
                errorMsg.style.cssText = 'color: red; font-size: 12px; margin: 10px 0; display: inline-block;';
                const loadingImgs = editorRef.current?.querySelectorAll('img[src*="data:image/svg+xml"]');
                if (loadingImgs && loadingImgs.length > 0) {
                  const lastLoadingImg = loadingImgs[loadingImgs.length - 1];
                  lastLoadingImg.outerHTML = errorMsg.outerHTML;
                }
              }

              setTimeout(() => {
                if (editorRef.current) {
                  const html = sanitizeRichHtml(editorRef.current.innerHTML);
                  onChange(html);
                }
              }, 100);
            } catch (error) {
              console.error('Image upload failed:', error);
              const errorMsg = document.createElement('span');
              errorMsg.textContent = 'Failed to upload image';
              errorMsg.style.cssText = 'color: red; font-size: 12px; margin: 10px 0; display: inline-block;';
              const loadingImgs = editorRef.current?.querySelectorAll('img[src*="data:image/svg+xml"]');
              if (loadingImgs && loadingImgs.length > 0) {
                const lastLoadingImg = loadingImgs[loadingImgs.length - 1];
                lastLoadingImg.outerHTML = errorMsg.outerHTML;
              }
              setTimeout(() => {
                if (editorRef.current) {
                  const html = sanitizeRichHtml(editorRef.current.innerHTML);
                  onChange(html);
                }
              }, 100);
            }
          })();
        }
      }
    }
    
    setTimeout(() => {
      if (editorRef.current) {
        const html = sanitizeRichHtml(editorRef.current.innerHTML);
        onChange(html);
      }
    }, 100);
  };

  const plainCount = stripHtml(value).length;

  return (
    <div className={`rounded-2xl border ${error ? 'border-red-300' : 'border-slate-200'}`}>
      <div className="flex flex-wrap gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2">
        <button type="button" onClick={() => applyCommand('formatBlock', 'P')} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600">P</button>
        <button type="button" onClick={() => applyCommand('formatBlock', 'H1')} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600">H1</button>
        <button type="button" onClick={() => applyCommand('formatBlock', 'H2')} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600">H2</button>
        <button type="button" onClick={() => applyCommand('bold')} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700">B</button>
        <button type="button" onClick={() => applyCommand('italic')} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs italic text-slate-700">I</button>
        <button type="button" onClick={() => applyCommand('underline')} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs underline text-slate-700">U</button>
        <button type="button" onClick={() => applyCommand('insertUnorderedList')} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600">Bullet</button>
        <button type="button" onClick={() => applyCommand('insertOrderedList')} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600">Numbered</button>
        <button type="button" onClick={() => applyCommand('formatBlock', 'BLOCKQUOTE')} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600">Quote</button>
        <button type="button" onClick={() => applyCommand('formatBlock', 'PRE')} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600">Code Block</button>
        <button
          type="button"
          onClick={() => setIsHtmlInputOpen((prev) => !prev)}
          className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600"
        >
          HTML
        </button>
        <button
          type="button"
          onClick={() => {
            const url = window.prompt('Enter URL');
            if (url) applyCommand('createLink', url);
          }}
          className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600"
        >
          Link
        </button>
        <button
          type="button"
          onClick={async () => {
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'image/*';
            fileInput.onchange = async (e) => {
              const file = (e.target as HTMLInputElement).files?.[0];
              if (file) {
                try {
                  // Show loading state
                  const loadingImg = document.createElement('img');
                  loadingImg.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDMTMuMSAyIDE0IDIuOSAxNCA0VjE2QzE0IDE3LjEgMTMuMSAxOCA5IDE4QzYuOSAxOCA2IDE3LjEgNiAxNlY0QzYgMi45IDYuOSAyIDggMkgxNkMxNy4xIDIgMTggMi45IDE4IDRWMTZDMTggMTcuMSAxNy4xIDE4IDE2IDE4SDEyQzEwLjkgMTggMTAgMTcuMSAxMCAxNlY0QzEwIDIuOSAxMC45IDIgMTIgMloiIGZpbGw9IiM5Q0E0QUYiLz4KPC9zdmc+';
                  loadingImg.style.cssText = 'width: 24px; height: 24px; display: inline-block; margin: 10px 0;';
                  document.execCommand('insertHTML', false, loadingImg.outerHTML);

                  // Upload to Cloudinary
                  const formData = new FormData();
                  formData.append('image', file);
                  formData.append('folder', 'editor');

                  const token = localStorage.getItem('toolnavix_token');
                  const response = await fetch('/api/upload-image', {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${token}`,
                    },
                    body: formData,
                  });

                  if (response.ok) {
                    const data = await response.json();
                    // Replace loading image with uploaded image
                    const imgHtml = `<img src="${data.url}" style="max-width: 100%; height: auto; margin: 10px 0;" alt="Uploaded image" />`;
                    document.execCommand('insertHTML', false, imgHtml);
                  } else {
                    // Remove loading image and show error
                    const errorMsg = document.createElement('span');
                    errorMsg.textContent = 'Failed to upload image';
                    errorMsg.style.cssText = 'color: red; font-size: 12px; margin: 10px 0; display: inline-block;';
                    document.execCommand('insertHTML', false, errorMsg.outerHTML);
                  }

                  handleInput();
                } catch (error) {
                  console.error('Image upload failed:', error);
                  const errorMsg = document.createElement('span');
                  errorMsg.textContent = 'Failed to upload image';
                  errorMsg.style.cssText = 'color: red; font-size: 12px; margin: 10px 0; display: inline-block;';
                  document.execCommand('insertHTML', false, errorMsg.outerHTML);
                  handleInput();
                }
              }
            };
            fileInput.click();
          }}
          className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600"
        >
          Image
        </button>
        <button type="button" onClick={() => applyCommand('removeFormat')} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600">Clear</button>
      </div>
      {isHtmlInputOpen && (
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-3 py-2">
          <input
            value={htmlInput}
            onChange={(event) => setHtmlInput(event.target.value)}
            className="min-w-[220px] flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs"
            placeholder="<h1>Title</h1>"
          />
          <button
            type="button"
            onClick={() => {
              if (!htmlInput.trim()) return;
              applyCommand('insertHTML', htmlInput);
              setHtmlInput('');
              setIsHtmlInputOpen(false);
            }}
            className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
          >
            Insert
          </button>
          <button
            type="button"
            onClick={() => {
              setHtmlInput('');
              setIsHtmlInputOpen(false);
            }}
            className="rounded-md border border-slate-200 px-3 py-1.5 text-xs text-slate-600"
          >
            Cancel
          </button>
        </div>
      )}

      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onPaste={handlePaste}
        data-placeholder={placeholder}
        className={`${minHeightClassName} w-full resize-y overflow-auto rounded-b-2xl px-3 py-2 focus:outline-none [&[data-placeholder]:empty::before]:text-slate-400 [&[data-placeholder]:empty::before]:content-[attr(data-placeholder)]`}
      />

      {typeof maxLength === 'number' && (
        <p className="border-t border-slate-100 px-3 py-2 text-xs text-slate-500">
          {plainCount}/{maxLength} characters
        </p>
      )}
      {error && <p className="border-t border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
