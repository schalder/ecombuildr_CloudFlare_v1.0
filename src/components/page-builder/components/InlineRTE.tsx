import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bold, Italic, Underline, Strikethrough, Link as LinkIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ColorPicker } from '@/components/ui/color-picker';

export interface InlineRTEProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
  variant?: 'heading' | 'paragraph';
}

// Minimal sanitizer allowing basic inline formatting
export function sanitizeHtml(input: string, variant?: 'heading' | 'paragraph'): string {
  const baseAllowedTags = new Set(['B','STRONG','I','EM','U','S','BR','SPAN','FONT','A','#text']);
  if (variant === 'paragraph') {
    baseAllowedTags.add('P');
    baseAllowedTags.add('DIV');
  }
  const allowedTags = baseAllowedTags;
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
      // allow only safe inline styles we use
      const allowedStyles = style
        .split(';')
        .map((s) => s.trim())
        .filter((s) => /^(color|font-family|font-weight|font-style|text-decoration(?:-line)?)\s*:/i.test(s));
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

export const InlineRTE: React.FC<InlineRTEProps> = ({ value, onChange, placeholder, className, disabled, style, variant = 'heading' }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const lastRangeRef = useRef<Range | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarPos, setToolbarPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [currentColor, setCurrentColor] = useState<string>('');
  const toolbarRef = useRef<HTMLDivElement>(null);
  
  const keepOpenRef = useRef(false);
  

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
      if (keepOpenRef.current) {
        setShowToolbar(true);
        return;
      }
      const sel = window.getSelection();
      const active = document.activeElement as HTMLElement | null;
      const floatingEls = Array.from(document.querySelectorAll('[data-rte-floating]')) as HTMLElement[];
      const toolbarEl = toolbarRef.current;
      const interactingWithFloating = !!active && floatingEls.some((f) => f.contains(active));
      const interactingWithToolbar = !!active && !!toolbarEl && toolbarEl.contains(active);

      if (interactingWithFloating || interactingWithToolbar) {
        // Keep toolbar visible when interacting with its popovers/menus or the toolbar itself
        setShowToolbar(true);
        return;
      }

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
      // save selection for toolbar actions
      lastRangeRef.current = range.cloneRange();
      if (rect) {
        const top = Math.max(8, rect.top - 48);
        const left = Math.max(8, rect.left + rect.width / 2);
        setToolbarPos({ top, left });
        setShowToolbar(true);
      }
    };

    document.addEventListener('selectionchange', handleSelection);
    return () => document.removeEventListener('selectionchange', handleSelection);
  }, []);

  useEffect(() => {
    const onDocMouseDown = (e: MouseEvent) => {
      const target = e.target as Node | null;
      const toolbarEl = toolbarRef.current;
      const inToolbar = !!toolbarEl && !!target && toolbarEl.contains(target);
      const inFloating = !!(target as Element | null) && (target as Element).closest?.('[data-rte-floating]');
      if (inToolbar || inFloating) {
        keepOpenRef.current = true;
        // Preserve current selection
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
          lastRangeRef.current = sel.getRangeAt(0).cloneRange();
        }
      }
    };
    const onDocMouseUp = () => {
      // release latch after current event loop to allow handlers to run
      setTimeout(() => {
        keepOpenRef.current = false;
      }, 0);
    };
    document.addEventListener('mousedown', onDocMouseDown, true);
    document.addEventListener('mouseup', onDocMouseUp, true);
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown, true);
      document.removeEventListener('mouseup', onDocMouseUp, true);
    };
  }, []);


  const exec = (command: string, valueArg?: string) => {
    // focus editor and restore selection before executing
    const editorEl = editorRef.current;
    if (editorEl) editorEl.focus();
    const sel = window.getSelection();
    if (lastRangeRef.current && sel) {
      sel.removeAllRanges();
      sel.addRange(lastRangeRef.current);
    }
    try {
      document.execCommand('styleWithCSS', false, 'true');
    } catch {}
    document.execCommand(command, false, valueArg);
    const html = sanitizeHtml(editorRef.current?.innerHTML || '', variant);
    onChange(html);
  };

  const applyColor = (color: string) => {
    setCurrentColor(color);
    if (!color) {
      const baseColor = getComputedStyle(editorRef.current as HTMLElement).color;
      exec('foreColor', baseColor);
      return;
    }
    exec('foreColor', color);
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
    const html = sanitizeHtml(editorRef.current?.innerHTML || '', variant);
    onChange(html);
  };

  const onKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (e.key === 'Escape') {
      (e.currentTarget as HTMLDivElement).blur();
    }
    
    // Handle Enter key differently based on variant
    if (e.key === 'Enter') {
      if (variant === 'heading') {
        // For headings, insert line breaks instead of paragraphs
        e.preventDefault();
        exec('insertHTML', '<br>');
      }
      // For paragraphs, let the default behavior create <p> tags
    }
  };

  const colors = useMemo(
    () => ['#000000','#666666','#999999','#cccccc','#e03131','#2f9e44','#1971c2','#fab005','#ae3ec9'],
    []
  );


  return (
      <div className="relative">
        {showToolbar && (
          <div
            ref={toolbarRef}
            className="fixed z-50 -translate-x-1/2 rounded-md border bg-popover text-popover-foreground shadow-md px-2 py-1 flex items-center gap-1"
            style={{ top: toolbarPos.top, left: toolbarPos.left }}
            data-rte-floating
          >

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

            {/* Full color picker with reset */}
            <div className="flex items-center gap-2">
              <ColorPicker
                compact
                color={currentColor}
                onChange={(c) => {
                  if (!c || c === 'transparent') {
                    applyColor('');
                  } else {
                    applyColor(c);
                  }
                }}
              />
              <Button size="sm" variant="secondary" className="h-7 px-2 text-[10px]" onMouseDown={(e) => e.preventDefault()} onClick={() => applyColor('')}>
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
        className={cn('min-h-[1.5em] outline-none', variant === 'heading' ? 'whitespace-pre-wrap' : '', className)}
        style={style}
        contentEditable={!disabled}
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onFocus={() => {
          setIsEditing(true);
          // Set the default paragraph separator for paragraph variant
          if (variant === 'paragraph') {
            try {
              document.execCommand('defaultParagraphSeparator', false, 'p');
            } catch {}
          }
        }}
        onBlur={() => {
          if (keepOpenRef.current) {
            setIsEditing(true);
            setShowToolbar(true);
            onInput();
            return;
          }
          const active = document.activeElement as HTMLElement | null;
          const toolbarEl = toolbarRef.current;
          const floatingEls = Array.from(document.querySelectorAll('[data-rte-floating]')) as HTMLElement[];
          const interacting = !!active && ((toolbarEl && toolbarEl.contains(active)) || floatingEls.some((f) => f.contains(active)));

          if (interacting) {
            // Stay in editing mode when interacting with toolbar/popovers
            setIsEditing(true);
            setShowToolbar(true);
          } else {
            setIsEditing(false);
            setShowToolbar(false);
          }

          onInput();
        }}
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
