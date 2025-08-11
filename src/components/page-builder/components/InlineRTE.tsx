import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bold, Italic, Underline, Strikethrough, Link as LinkIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface InlineRTEProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
}

// Minimal sanitizer allowing basic inline formatting
export function sanitizeHtml(input: string): string {
  const allowedTags = new Set(['B','STRONG','I','EM','U','S','BR','SPAN','FONT','A','#text']);
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${input}</div>`, 'text/html');
  const container = doc.body.firstElementChild as HTMLElement;

  const cleanNode = (node: Node): Node | null => {
    if (node.nodeType === Node.TEXT_NODE) return node;
    if (node.nodeType !== Node.ELEMENT_NODE) return null;
    const el = node as HTMLElement;
    if (!allowedTags.has(el.tagName)) {
      // Replace disallowed element with its children
      const frag = doc.createDocumentFragment();
      Array.from(el.childNodes).forEach((child) => {
        const cleaned = cleanNode(child);
        if (cleaned) frag.appendChild(cleaned);
      });
      return frag;
    }

    // Clean attributes
    const newEl = doc.createElement(el.tagName);
    if (el.tagName === 'A') {
      const href = el.getAttribute('href') || '';
      const safe = /^(https?:|mailto:|tel:)/i.test(href);
      if (safe) {
        newEl.setAttribute('href', href);
        newEl.setAttribute('rel', 'noopener noreferrer');
        newEl.setAttribute('target', '_blank');
      }
    }
    if (el.tagName === 'SPAN') {
      const style = el.getAttribute('style') || '';
      // allow only color and font-family styles
      const allowedStyles = style
        .split(';')
        .map((s) => s.trim())
        .filter((s) => /^(color|font-family)\s*:/i.test(s));
      if (allowedStyles.length) newEl.setAttribute('style', allowedStyles.join('; '));
    }
    if (el.tagName === 'FONT') {
      ['color','face'].forEach((attr) => {
        const v = el.getAttribute(attr);
        if (v) newEl.setAttribute(attr, v);
      });
    }

    Array.from(el.childNodes).forEach((child) => {
      const cleaned = cleanNode(child);
      if (cleaned) newEl.appendChild(cleaned);
    });
    return newEl;
  };

  const cleaned = cleanNode(container);
  const wrap = doc.createElement('div');
  if (cleaned) wrap.appendChild(cleaned);
  return wrap.innerHTML.replace(/^<div>|<\/div>$/g, '');
}

export const InlineRTE: React.FC<InlineRTEProps> = ({ value, onChange, placeholder, className, disabled, style }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarPos, setToolbarPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  // Keep editor content in sync
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (!isEditing) {
      el.innerHTML = value || '';
    }
  }, [value, isEditing]);

  // Selection-based toolbar
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;

    const handleSelection = () => {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) {
        setShowToolbar(false);
        return;
      }
      const range = sel.getRangeAt(0);
      if (!el.contains(range.commonAncestorContainer) || sel.isCollapsed) {
        setShowToolbar(false);
        return;
      }
      const rect = range.getBoundingClientRect();
      if (rect) {
        const top = Math.max(8, rect.top - 40);
        const left = Math.max(8, rect.left + rect.width / 2);
        setToolbarPos({ top, left });
        setShowToolbar(true);
      }
    };

    document.addEventListener('selectionchange', handleSelection);
    return () => document.removeEventListener('selectionchange', handleSelection);
  }, []);

  const exec = (command: string, valueArg?: string) => {
    try {
      document.execCommand('styleWithCSS', false, 'true');
    } catch {}
    document.execCommand(command, false, valueArg);
    // sanitize and propagate change
    const html = sanitizeHtml(editorRef.current?.innerHTML || '');
    onChange(html);
  };

  const applyColor = (color: string) => {
    exec('foreColor', color);
  };

  const resetColor = () => {
    const baseColor = getComputedStyle(editorRef.current as HTMLElement).color;
    exec('foreColor', baseColor);
  };

  const applyFont = (font: string) => {
    const useFont = font === 'default'
      ? getComputedStyle(editorRef.current as HTMLElement).fontFamily || 'inherit'
      : font;
    exec('fontName', useFont);
  };

  const toggleLink = () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    const container = range.commonAncestorContainer as HTMLElement;
    const anchor = (container.nodeType === 1 ? container : container.parentElement)?.closest('a');
    if (anchor) {
      exec('unlink');
      return;
    }
    const url = window.prompt('Enter URL (https://...)');
    if (url) {
      exec('createLink', url);
      // best-effort: add rel/target
      const el = editorRef.current;
      if (!el) return;
      const links = el.querySelectorAll('a[href]');
      links.forEach((a) => {
        a.setAttribute('rel', 'noopener noreferrer');
        if (!a.getAttribute('target')) a.setAttribute('target', '_blank');
      });
    }
  };

  const onInput = () => {
    const html = sanitizeHtml(editorRef.current?.innerHTML || '');
    onChange(html);
  };

  const onKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (e.key === 'Escape') {
      (e.currentTarget as HTMLDivElement).blur();
    }
  };

  const colors = useMemo(
    () => ['#000000','#666666','#999999','#cccccc','#e03131','#2f9e44','#1971c2','#fab005','#ae3ec9'],
    []
  );

  const fonts = useMemo(
    () => [
      { label: 'Default', value: 'default' },
      { label: 'System Sans', value: 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, \"Apple Color Emoji\", \"Segoe UI Emoji\"' },
      { label: 'Serif', value: 'Georgia, Times New Roman, Times, serif' },
      { label: 'Monospace', value: 'SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace' },
    ],
    []
  );

  return (
    <div className="relative">
      {showToolbar && isEditing && (
        <div
          className="fixed z-50 -translate-x-1/2 rounded-md border bg-popover text-popover-foreground shadow-md px-2 py-1 flex items-center gap-1"
          style={{ top: toolbarPos.top, left: toolbarPos.left }}
        >
          {/* Font family */}
          <select
            className="text-xs bg-transparent border rounded px-1 py-0.5"
            onChange={(e) => applyFont(e.target.value)}
            defaultValue="default"
          >
            {fonts.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>

          <div className="w-px h-4 bg-border mx-1" />

          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('bold')}>
            <Bold className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('italic')}>
            <Italic className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('underline')}>
            <Underline className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('strikeThrough')}>
            <Strikethrough className="h-4 w-4" />
          </Button>

          <div className="w-px h-4 bg-border mx-1" />

          {/* Colors */}
          <div className="flex items-center gap-1">
            {colors.map((c) => (
              <button
                key={c}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => applyColor(c)}
                className="h-5 w-5 rounded-full border"
                style={{ backgroundColor: c }}
                aria-label={`color ${c}`}
              />
            ))}
            <Button size="sm" variant="secondary" className="h-7 px-2 text-[10px]" onMouseDown={(e) => e.preventDefault()} onClick={resetColor}>
              Reset
            </Button>
          </div>

          <div className="w-px h-4 bg-border mx-1" />

          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onMouseDown={(e) => e.preventDefault()} onClick={toggleLink}>
            <LinkIcon className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div
        ref={editorRef}
        className={cn('min-h-[1.5em] outline-none', className)}
        style={style}
        contentEditable={!disabled}
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onFocus={() => setIsEditing(true)}
        onBlur={() => { setIsEditing(false); setShowToolbar(false); onInput(); }}
        onInput={onInput}
        onKeyDown={onKeyDown}
      />
      {/* Placeholder style */}
      <style>
        {`
          [contenteditable="true"][data-placeholder]:empty:before {
            content: attr(data-placeholder);
            color: hsl(var(--muted-foreground));
            pointer-events: none;
          }
        `}
      </style>
    </div>
  );
};
