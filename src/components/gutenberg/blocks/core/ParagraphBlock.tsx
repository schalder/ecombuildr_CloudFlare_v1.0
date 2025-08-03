import React, { useState, useRef, useEffect } from 'react';
import { Type, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GutenbergBlockEditProps, GutenbergBlockSaveProps } from '../../types';

const ParagraphEdit: React.FC<GutenbergBlockEditProps> = ({
  block,
  onUpdate,
  isSelected,
  setAttributes
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);
  
  const content = block.content.content || '';
  const alignment = block.content.alignment || 'left';
  const fontSize = block.content.fontSize || 'medium';
  
  useEffect(() => {
    if (isSelected && textRef.current) {
      textRef.current.focus();
    }
  }, [isSelected]);

  const handleContentChange = () => {
    if (textRef.current) {
      const newContent = textRef.current.innerHTML;
      setAttributes({ content: newContent });
    }
  };

  const handleAlignment = (align: string) => {
    setAttributes({ alignment: align });
  };

  const getAlignmentClass = () => {
    switch (alignment) {
      case 'center': return 'text-center';
      case 'right': return 'text-right';
      default: return 'text-left';
    }
  };

  const getFontSizeClass = () => {
    switch (fontSize) {
      case 'small': return 'text-sm';
      case 'large': return 'text-lg';
      case 'extra-large': return 'text-xl';
      default: return 'text-base';
    }
  };

  return (
    <div className="relative group">
      {/* Inline toolbar */}
      {isSelected && (
        <div className="absolute -top-10 left-0 flex items-center gap-1 bg-background border rounded-md shadow-lg z-20 p-1">
          <Button
            variant={alignment === 'left' ? 'default' : 'ghost'}
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => handleAlignment('left')}
          >
            <AlignLeft className="h-3 w-3" />
          </Button>
          <Button
            variant={alignment === 'center' ? 'default' : 'ghost'}
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => handleAlignment('center')}
          >
            <AlignCenter className="h-3 w-3" />
          </Button>
          <Button
            variant={alignment === 'right' ? 'default' : 'ghost'}
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => handleAlignment('right')}
          >
            <AlignRight className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Editable content */}
      <div
        ref={textRef}
        contentEditable
        suppressContentEditableWarning
        className={`
          min-h-[1.5em] p-2 outline-none focus:ring-2 focus:ring-primary/20 rounded
          ${getAlignmentClass()} ${getFontSizeClass()}
          ${isSelected ? 'ring-1 ring-primary/30' : ''}
        `}
        dangerouslySetInnerHTML={{ __html: content }}
        onInput={handleContentChange}
        onFocus={() => setIsEditing(true)}
        onBlur={() => setIsEditing(false)}
        data-placeholder="Start writing..."
        style={{ minHeight: '1.5em' }}
      />
    </div>
  );
};

const ParagraphSave: React.FC<GutenbergBlockSaveProps> = ({ block }) => {
  const content = block.content.content || '';
  const alignment = block.content.alignment || 'left';
  const fontSize = block.content.fontSize || 'medium';

  const getAlignmentClass = () => {
    switch (alignment) {
      case 'center': return 'text-center';
      case 'right': return 'text-right';
      default: return 'text-left';
    }
  };

  const getFontSizeClass = () => {
    switch (fontSize) {
      case 'small': return 'text-sm';
      case 'large': return 'text-lg';
      case 'extra-large': return 'text-xl';
      default: return 'text-base';
    }
  };

  if (!content.trim()) return null;

  return (
    <p 
      className={`${getAlignmentClass()} ${getFontSizeClass()}`}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
};

export const paragraphBlock = {
  name: 'core/paragraph',
  settings: {
    name: 'core/paragraph',
    title: 'Paragraph',
    icon: Type,
    category: 'text' as const,
    description: 'Start with the building block of all narrative.',
    keywords: ['text', 'paragraph'],
    supports: {
      align: true,
      color: true,
      fontSize: true,
      spacing: true,
    }
  },
  edit: ParagraphEdit,
  save: ParagraphSave
};