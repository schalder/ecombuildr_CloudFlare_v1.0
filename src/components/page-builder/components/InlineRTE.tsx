import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bold, Italic, Underline, Strikethrough, Link as LinkIcon, Minus, X, Circle, Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ColorPicker } from '@/components/ui/color-picker';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useHeadStyle } from '@/hooks/useHeadStyle';

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
      // allow safe inline styles including CSS custom properties for hand-drawn effects
      const allowedStyles = style
        .split(';')
        .map((s) => s.trim())
        .filter((s) => {
          // Allow standard styles
          if (/^(color|font-family|font-weight|font-style|text-decoration(?:-line)?)\s*:/i.test(s)) return true;
          // Allow CSS custom properties (--effect-color, --underline-svg)
          if (/^--[a-zA-Z-]+\s*:/.test(s)) return true;
          return false;
        });
      if (allowedStyles.length) newEl.setAttribute('style', allowedStyles.join('; '));
      
      // Allow class attribute for hand-drawn effects
      const className = el.getAttribute('class') || '';
      if (className && /hand-drawn-(underline|cross|circle)/.test(className)) {
        newEl.setAttribute('class', className);
      }
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
  const [handDrawnEffectColor, setHandDrawnEffectColor] = useState<string>('#e03131');
  const [handDrawnThickness, setHandDrawnThickness] = useState<number>(2.5);
  const [handDrawnSize, setHandDrawnSize] = useState<number>(100); // Percentage for size scaling
  const toolbarRef = useRef<HTMLDivElement>(null);
  
  const keepOpenRef = useRef(false);
  const settingsDropdownOpenRef = useRef(false);

  // Inject placeholder CSS into document head to prevent visibility issues
  useHeadStyle('inline-rte-placeholder', `
    [contenteditable="true"][data-placeholder]:empty:before {
      content: attr(data-placeholder);
      color: hsl(var(--muted-foreground));
      pointer-events: none;
    }
  `);
  

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
      if (settingsDropdownOpenRef.current) {
        setShowToolbar(true);
        return;
      }
      const sel = window.getSelection();
      const active = document.activeElement as HTMLElement | null;
      const floatingEls = Array.from(document.querySelectorAll('[data-rte-floating], [data-radix-popper-content-wrapper]')) as HTMLElement[];
      const toolbarEl = toolbarRef.current;
      const interactingWithFloating = !!active && floatingEls.some((f) => f.contains(active));
      const interactingWithToolbar = !!active && !!toolbarEl && toolbarEl.contains(active);

      if (interactingWithFloating || interactingWithToolbar) {
        // Keep toolbar visible when interacting with its popovers/menus or the toolbar itself
        setShowToolbar(true);
        return;
      }

      if (!sel || sel.rangeCount === 0) {
        if (!settingsDropdownOpenRef.current) {
          setShowToolbar(false);
        }
        return;
      }
      const range = sel.getRangeAt(0);
      if (!el.contains(range.commonAncestorContainer) || sel.isCollapsed) {
        if (!settingsDropdownOpenRef.current) {
          setShowToolbar(false);
        }
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
      const inFloating = !!(target as Element | null) && ((target as Element).closest?.('[data-rte-floating]') || (target as Element).closest?.('[data-radix-popper-content-wrapper]'));
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
        if (!settingsDropdownOpenRef.current) {
          keepOpenRef.current = false;
        }
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

  const generateHandDrawnUnderlineSVG = (color: string, thickness: number = 2.5): string => {
    // Remove # from color if present
    const colorHex = color.replace('#', '');
    // Build the SVG data URL with custom thickness
    const svgContent = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 10'><path d='M0,8 Q15,4 30,7 T60,5 T90,8 T100,7' stroke='#${colorHex}' stroke-width='${thickness}' fill='none' stroke-linecap='round'/></svg>`;
    const encodedSvg = encodeURIComponent(svgContent);
    return `url("data:image/svg+xml,${encodedSvg}")`;
  };

  const resetAllFormatting = () => {
    const editorEl = editorRef.current;
    if (!editorEl) return;
    
    editorEl.focus();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    
    const range = lastRangeRef.current || sel.getRangeAt(0);
    if (!range) return;
    
    try {
      // Get the container element
      let container = range.commonAncestorContainer as HTMLElement;
      if (container.nodeType === Node.TEXT_NODE) {
        container = container.parentElement as HTMLElement;
      }
      
      // Find all formatting elements in the selection
      const walker = document.createTreeWalker(
        range.commonAncestorContainer,
        NodeFilter.SHOW_ELEMENT,
        {
          acceptNode: (node) => {
            const el = node as HTMLElement;
            if (range.intersectsNode(el)) {
              if (el.tagName === 'B' || el.tagName === 'STRONG' || el.tagName === 'I' || 
                  el.tagName === 'EM' || el.tagName === 'U' || el.tagName === 'S' ||
                  el.classList.contains('hand-drawn-underline') || 
                  el.classList.contains('hand-drawn-cross') || 
                  el.classList.contains('hand-drawn-circle') ||
                  (el.tagName === 'SPAN' && el.hasAttribute('style'))) {
                return NodeFilter.FILTER_ACCEPT;
              }
            }
            return NodeFilter.FILTER_SKIP;
          }
        }
      );
      
      const elementsToRemove: HTMLElement[] = [];
      let node;
      while (node = walker.nextNode()) {
        elementsToRemove.push(node as HTMLElement);
      }
      
      // Remove formatting while preserving text content
      elementsToRemove.forEach(el => {
        const parent = el.parentElement;
        if (parent) {
          const textContent = el.textContent || '';
          const textNode = document.createTextNode(textContent);
          parent.replaceChild(textNode, el);
        }
      });
      
      // Also remove formatting using execCommand
      try {
        document.execCommand('removeFormat', false);
        document.execCommand('unlink', false);
      } catch (e) {
        // Ignore errors
      }
      
      onInput();
    } catch (error) {
      console.error('Error resetting formatting:', error);
    }
  };

  const applyHandDrawnEffect = (effectType: 'underline' | 'cross' | 'circle') => {
    const editorEl = editorRef.current;
    if (!editorEl) return;
    
    editorEl.focus();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    
    const range = lastRangeRef.current || sel.getRangeAt(0);
    if (!range) return;
    
    try {
      // Check if selection is already wrapped in a hand-drawn effect
      let container = range.commonAncestorContainer as HTMLElement;
      if (container.nodeType === Node.TEXT_NODE) {
        container = container.parentElement as HTMLElement;
      }
      
      const existingEffect = container.closest('.hand-drawn-underline, .hand-drawn-cross, .hand-drawn-circle') as HTMLElement;
      if (existingEffect && existingEffect.classList.contains(`hand-drawn-${effectType}`)) {
        // Remove existing effect if same type
        const parent = existingEffect.parentElement;
        if (parent) {
          const textNode = document.createTextNode(existingEffect.textContent || '');
          parent.replaceChild(textNode, existingEffect);
          parent.normalize();
        }
        onInput();
        return;
      }
      
      // Create new span with hand-drawn effect
      const span = document.createElement('span');
      span.className = `hand-drawn-${effectType}`;
      
      // Set color using CSS variable and inline style
      const colorHex = handDrawnEffectColor || '#e03131';
      const thickness = handDrawnThickness || 2.5;
      const size = handDrawnSize || 100;
      
      span.style.setProperty('--effect-color', colorHex);
      span.style.setProperty('--effect-thickness', `${thickness}px`);
      span.style.setProperty('--effect-size', `${size}%`);
      
      // For underline, generate SVG with color and thickness
      if (effectType === 'underline') {
        const svgUrl = generateHandDrawnUnderlineSVG(colorHex, thickness);
        span.style.setProperty('--underline-svg', svgUrl);
      }
      
      // Wrap selected content
      try {
        range.surroundContents(span);
      } catch (e) {
        // If surroundContents fails, extract content and wrap it
        const contents = range.extractContents();
        span.appendChild(contents);
        range.insertNode(span);
      }
      
      // Update selection
      sel.removeAllRanges();
      const newRange = document.createRange();
      newRange.selectNodeContents(span);
      sel.addRange(newRange);
      
      onInput();
    } catch (error) {
      console.error('Error applying hand-drawn effect:', error);
    }
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
            <div className="flex items-center gap-2" onMouseDown={(e) => e.preventDefault()}>
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
              <Button size="sm" variant="secondary" className="h-7 px-2 text-[10px]" onMouseDown={(e) => e.preventDefault()} onClick={resetAllFormatting}>
                Reset
              </Button>
            </div>

            <div className="w-px h-4 bg-border mx-1" />

            {/* Hand-drawn effects */}
            <div className="flex items-center gap-1">
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-7 w-7 p-0" 
                onMouseDown={(e) => e.preventDefault()} 
                onClick={() => applyHandDrawnEffect('underline')}
                title="Hand-drawn underline"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-7 w-7 p-0" 
                onMouseDown={(e) => e.preventDefault()} 
                onClick={() => applyHandDrawnEffect('cross')}
                title="Hand-drawn cross-out"
              >
                <X className="h-4 w-4" />
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-7 w-7 p-0" 
                onMouseDown={(e) => e.preventDefault()} 
                onClick={() => applyHandDrawnEffect('circle')}
                title="Hand-drawn circle"
              >
                <Circle className="h-4 w-4" />
              </Button>
            </div>

            <div className="w-px h-4 bg-border mx-1" />

            {/* Hand-drawn effect color picker */}
            <div className="flex items-center gap-1" onMouseDown={(e) => e.preventDefault()}>
              <ColorPicker
                compact
                color={handDrawnEffectColor}
                onChange={(c) => {
                  const colorHex = c || '#e03131';
                  setHandDrawnEffectColor(colorHex);
                  
                  // Update existing hand-drawn effects in selection
                  const editorEl = editorRef.current;
                  if (editorEl) {
                    const sel = window.getSelection();
                    if (sel && sel.rangeCount > 0) {
                      const range = sel.getRangeAt(0);
                      const container = range.commonAncestorContainer as HTMLElement;
                      const effectEl = (container.nodeType === Node.TEXT_NODE ? container.parentElement : container)?.closest('.hand-drawn-underline, .hand-drawn-cross, .hand-drawn-circle') as HTMLElement;
                      if (effectEl) {
                        const thickness = parseFloat(effectEl.style.getPropertyValue('--effect-thickness') || '2.5');
                        effectEl.style.setProperty('--effect-color', colorHex);
                        // Update underline SVG if it's an underline effect
                        if (effectEl.classList.contains('hand-drawn-underline')) {
                          const svgUrl = generateHandDrawnUnderlineSVG(colorHex, thickness);
                          effectEl.style.setProperty('--underline-svg', svgUrl);
                        }
                        onInput();
                      }
                    }
                  }
                }}
              />
            </div>

            {/* Hand-drawn effect settings (thickness & size) */}
            <DropdownMenu
              onOpenChange={(open) => {
                settingsDropdownOpenRef.current = open;
                if (open) {
                  keepOpenRef.current = true;
                  const sel = window.getSelection();
                  if (sel && sel.rangeCount > 0) {
                    lastRangeRef.current = sel.getRangeAt(0).cloneRange();
                  }
                } else {
                  setTimeout(() => {
                    keepOpenRef.current = false;
                  }, 100);
                }
              }}
            >
              <DropdownMenuTrigger asChild>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-7 w-7 p-0" 
                  onMouseDown={(e) => e.preventDefault()}
                  title="Effect settings"
                >
                  <Settings2 className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                className="w-64 p-4" 
                align="start"
                onOpenAutoFocus={(e) => e.preventDefault()}
                data-rte-floating
              >
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs mb-2 block">Thickness</Label>
                    <div className="flex items-center gap-2">
                      <Slider
                        value={[handDrawnThickness]}
                        onValueChange={(val) => {
                          const thickness = val[0];
                          setHandDrawnThickness(thickness);
                          
                          // Update ALL hand-drawn effects in the editor
                          const editorEl = editorRef.current;
                          if (editorEl) {
                            const allEffects = editorEl.querySelectorAll('.hand-drawn-underline, .hand-drawn-cross, .hand-drawn-circle') as NodeListOf<HTMLElement>;
                            
                            allEffects.forEach((effectEl) => {
                              const colorHex = effectEl.style.getPropertyValue('--effect-color') || handDrawnEffectColor || '#e03131';
                              effectEl.style.setProperty('--effect-thickness', `${thickness}px`);
                              if (effectEl.classList.contains('hand-drawn-underline')) {
                                const svgUrl = generateHandDrawnUnderlineSVG(colorHex, thickness);
                                effectEl.style.setProperty('--underline-svg', svgUrl);
                              }
                            });
                            
                            if (allEffects.length > 0) {
                              onInput();
                            }
                          }
                        }}
                        onValueCommit={(val) => {
                          const thickness = val[0];
                          setHandDrawnThickness(thickness);
                        }}
                        min={1}
                        max={8}
                        step={0.5}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        value={handDrawnThickness}
                        onChange={(e) => {
                          const val = Math.max(1, Math.min(8, parseFloat(e.target.value) || 2.5));
                          setHandDrawnThickness(val);
                          
                          // Update ALL hand-drawn effects in the editor
                          const editorEl = editorRef.current;
                          if (editorEl) {
                            const allEffects = editorEl.querySelectorAll('.hand-drawn-underline, .hand-drawn-cross, .hand-drawn-circle') as NodeListOf<HTMLElement>;
                            
                            allEffects.forEach((effectEl) => {
                              const colorHex = effectEl.style.getPropertyValue('--effect-color') || handDrawnEffectColor || '#e03131';
                              effectEl.style.setProperty('--effect-thickness', `${val}px`);
                              if (effectEl.classList.contains('hand-drawn-underline')) {
                                const svgUrl = generateHandDrawnUnderlineSVG(colorHex, val);
                                effectEl.style.setProperty('--underline-svg', svgUrl);
                              }
                            });
                            
                            if (allEffects.length > 0) {
                              onInput();
                            }
                          }
                        }}
                        onBlur={(e) => {
                          const val = Math.max(1, Math.min(8, parseFloat(e.target.value) || 2.5));
                          setHandDrawnThickness(val);
                        }}
                        min={1}
                        max={8}
                        step={0.5}
                        className="w-16 h-8 text-xs"
                      />
                      <span className="text-xs text-muted-foreground">px</span>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-xs mb-2 block">Size</Label>
                    <div className="flex items-center gap-2">
                      <Slider
                        value={[handDrawnSize]}
                        onValueChange={(val) => {
                          const size = val[0];
                          setHandDrawnSize(size);
                          
                          // Update ALL hand-drawn effects in the editor
                          const editorEl = editorRef.current;
                          if (editorEl) {
                            const allEffects = editorEl.querySelectorAll('.hand-drawn-underline, .hand-drawn-cross, .hand-drawn-circle') as NodeListOf<HTMLElement>;
                            
                            allEffects.forEach((effectEl) => {
                              effectEl.style.setProperty('--effect-size', `${size}%`);
                            });
                            
                            if (allEffects.length > 0) {
                              onInput();
                            }
                          }
                        }}
                        onValueCommit={(val) => {
                          const size = val[0];
                          setHandDrawnSize(size);
                        }}
                        min={50}
                        max={150}
                        step={5}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        value={handDrawnSize}
                        onChange={(e) => {
                          const val = Math.max(50, Math.min(150, parseInt(e.target.value) || 100));
                          setHandDrawnSize(val);
                          
                          // Update ALL hand-drawn effects in the editor
                          const editorEl = editorRef.current;
                          if (editorEl) {
                            const allEffects = editorEl.querySelectorAll('.hand-drawn-underline, .hand-drawn-cross, .hand-drawn-circle') as NodeListOf<HTMLElement>;
                            
                            allEffects.forEach((effectEl) => {
                              effectEl.style.setProperty('--effect-size', `${val}%`);
                            });
                            
                            if (allEffects.length > 0) {
                              onInput();
                            }
                          }
                        }}
                        onBlur={(e) => {
                          const val = Math.max(50, Math.min(150, parseInt(e.target.value) || 100));
                          setHandDrawnSize(val);
                        }}
                        min={50}
                        max={150}
                        step={5}
                        className="w-16 h-8 text-xs"
                      />
                      <span className="text-xs text-muted-foreground">%</span>
                    </div>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

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
          const floatingEls = Array.from(document.querySelectorAll('[data-rte-floating], [data-radix-popper-content-wrapper]')) as HTMLElement[];
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
    </div>
  );
};
