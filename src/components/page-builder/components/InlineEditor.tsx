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
    } else if (e.key === 'Escape') {
      setEditValue(value);
      setIsEditing(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setEditValue(e.target.value);
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
          "w-full bg-transparent border-none outline-none resize-none",
          className
        )}
        placeholder={placeholder}
        {...(multiline && { rows: 3 })}
      />
    );
  }

  return (
    <div
      onClick={handleClick}
      className={cn(
        "cursor-text min-h-[1.5rem] hover:bg-muted/20 rounded px-1 transition-colors",
        !value && "text-muted-foreground",
        disabled && "cursor-default hover:bg-transparent",
        className
      )}
    >
      {value || placeholder}
    </div>
  );
};