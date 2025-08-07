import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface InlineEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  multiline?: boolean;
  disabled?: boolean;
}

export const InlineEditor: React.FC<InlineEditorProps> = ({
  value,
  onChange,
  placeholder = "Click to edit...",
  className = "",
  multiline = false,
  disabled = false
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

  // Auto-resize textarea based on content
  useEffect(() => {
    if (isEditing && multiline && inputRef.current) {
      const textarea = inputRef.current as HTMLTextAreaElement;
      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = 'auto';
      // Get computed font size to calculate better minimum height
      const computedStyle = window.getComputedStyle(textarea);
      const fontSize = parseFloat(computedStyle.fontSize);
      const lineHeight = parseFloat(computedStyle.lineHeight) || fontSize * 1.2;
      const minHeight = Math.max(lineHeight + 16, 48); // padding + line height, minimum 48px
      const newHeight = Math.max(textarea.scrollHeight, minHeight);
      textarea.style.height = `${newHeight}px`;
    }
  }, [isEditing, multiline, editValue]);

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
    // Real-time updates
    onChange(newValue);
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
        "cursor-text inline-block min-h-[1.5rem] hover:bg-muted/20 rounded px-1 transition-colors",
        !value && "text-muted-foreground",
        disabled && "cursor-default hover:bg-transparent",
        multiline && "block w-full",
        className
      )}
    >
      {value || placeholder}
    </span>
  );
};