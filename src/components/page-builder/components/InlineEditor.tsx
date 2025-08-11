import React, { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface InlineEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  multiline?: boolean;
  disabled?: boolean;
  style?: React.CSSProperties;
}

export const InlineEditor: React.FC<InlineEditorProps> = ({
  value,
  onChange,
  placeholder = "Click to edit...",
  className = "",
  multiline = false,
  disabled = false,
  style
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Optimized auto-resize with debounce and RAF
  const autoResize = useCallback((textarea: HTMLTextAreaElement) => {
    // Use RAF to prevent forced reflow during DOM updates
    requestAnimationFrame(() => {
      if (!textarea) return;
      
      // Batch DOM reads/writes to avoid layout thrashing
      const currentHeight = textarea.style.height;
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      
      // Cache computed style to avoid repeated calculations
      const computedStyle = window.getComputedStyle(textarea);
      const fontSize = parseFloat(computedStyle.fontSize);
      const lineHeight = parseFloat(computedStyle.lineHeight) || fontSize * 1.2;
      const minHeight = Math.max(lineHeight + 16, 48);
      const newHeight = Math.max(scrollHeight, minHeight);
      
      // Only update if height actually changed to prevent unnecessary reflows
      if (currentHeight !== `${newHeight}px`) {
        textarea.style.height = `${newHeight}px`;
      }
    });
  }, []);

  // Debounced resize effect
  useEffect(() => {
    if (isEditing && multiline && inputRef.current) {
      const textarea = inputRef.current as HTMLTextAreaElement;
      const timeoutId = setTimeout(() => autoResize(textarea), 0);
      return () => clearTimeout(timeoutId);
    }
  }, [isEditing, multiline, editValue, autoResize]);

  const handleClick = () => {
    if (!disabled) {
      setIsEditing(true);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (editValue !== value) {
      onChange(editValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      handleBlur();
    } else if (e.key === 'Enter' && multiline && (e.ctrlKey || e.metaKey)) {
      // Ctrl/Cmd+Enter to finish editing multiline text
      e.preventDefault();
      handleBlur();
    } else if (e.key === 'Escape') {
      setEditValue(value);
      setIsEditing(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setEditValue(newValue);
    // Remove real-time updates to prevent flash effects
    
    // Trigger resize for multiline inputs with debounce
    if (multiline && e.target instanceof HTMLTextAreaElement) {
      autoResize(e.target);
    }
  };

  if (isEditing) {
    const Component = multiline ? 'textarea' : 'input';
    return (
      <Component
        ref={inputRef as any}
        value={editValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={cn(
          "w-full bg-transparent border-none outline-none resize-none overflow-hidden",
          multiline && "min-h-[3rem]",
          className
        )}
        placeholder={placeholder}
        style={{
          ...(style || {}),
          height: multiline ? 'auto' : undefined,
          minHeight: multiline ? '3rem' : undefined,
        }}
      />
    );
  }

  return (
    <span
      onClick={handleClick}
      className={cn(
        disabled ? "cursor-default select-text" : "cursor-text hover:bg-muted/20",
        "inline-block min-h-[1.5rem] rounded px-1 transition-colors",
        !value && "text-muted-foreground",
        multiline && "block w-full",
        className
      )}
      style={style}
    >
      {value || placeholder}
    </span>
  );
};