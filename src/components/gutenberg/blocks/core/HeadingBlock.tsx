import React, { useState, useRef, useEffect } from 'react';
import { Heading, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GutenbergBlockEditProps, GutenbergBlockSaveProps } from '../../types';

const HeadingEdit: React.FC<GutenbergBlockEditProps> = ({
  block,
  isSelected,
  setAttributes
}) => {
  const textRef = useRef<HTMLDivElement>(null);
  
  const content = block.content.content || '';
  const level = block.content.level || 2;
  const alignment = block.content.alignment || 'left';
  
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

  const handleLevelChange = (newLevel: string) => {
    setAttributes({ level: parseInt(newLevel) });
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

  const getHeadingClass = () => {
    switch (level) {
      case 1: return 'text-4xl font-bold';
      case 2: return 'text-3xl font-bold';
      case 3: return 'text-2xl font-semibold';
      case 4: return 'text-xl font-semibold';
      case 5: return 'text-lg font-medium';
      case 6: return 'text-base font-medium';
      default: return 'text-2xl font-semibold';
    }
  };

  const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements;

  return (
    <div className="relative group">
      {/* Inline toolbar */}
      {isSelected && (
        <div className="absolute -top-12 left-0 flex items-center gap-1 bg-background border rounded-md shadow-lg z-20 p-1">
          <Select value={level.toString()} onValueChange={handleLevelChange}>
            <SelectTrigger className="w-16 h-6 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">H1</SelectItem>
              <SelectItem value="2">H2</SelectItem>
              <SelectItem value="3">H3</SelectItem>
              <SelectItem value="4">H4</SelectItem>
              <SelectItem value="5">H5</SelectItem>
              <SelectItem value="6">H6</SelectItem>
            </SelectContent>
          </Select>
          
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
          outline-none focus:ring-2 focus:ring-primary/20 rounded p-1
          ${getAlignmentClass()} ${getHeadingClass()}
          ${isSelected ? 'ring-1 ring-primary/30' : ''}
        `}
        dangerouslySetInnerHTML={{ __html: content }}
        onInput={handleContentChange}
        data-placeholder="Write heading..."
        style={{ display: 'block' }}
      />
    </div>
  );
};

const HeadingSave: React.FC<GutenbergBlockSaveProps> = ({ block }) => {
  const content = block.content.content || '';
  const level = block.content.level || 2;
  const alignment = block.content.alignment || 'left';

  const getAlignmentClass = () => {
    switch (alignment) {
      case 'center': return 'text-center';
      case 'right': return 'text-right';
      default: return 'text-left';
    }
  };

  const getHeadingClass = () => {
    switch (level) {
      case 1: return 'text-4xl font-bold';
      case 2: return 'text-3xl font-bold';
      case 3: return 'text-2xl font-semibold';
      case 4: return 'text-xl font-semibold';
      case 5: return 'text-lg font-medium';
      case 6: return 'text-base font-medium';
      default: return 'text-2xl font-semibold';
    }
  };

  if (!content.trim()) return null;

  const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements;

  return (
    <HeadingTag 
      className={`${getAlignmentClass()} ${getHeadingClass()}`}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
};

export const headingBlock = {
  name: 'core/heading',
  settings: {
    name: 'core/heading',
    title: 'Heading',
    icon: Heading,
    category: 'text' as const,
    description: 'Introduce new sections and organize content to help visitors find what they need.',
    keywords: ['heading', 'title', 'subtitle'],
    supports: {
      align: true,
      color: true,
      fontSize: true,
      spacing: true,
    }
  },
  edit: HeadingEdit,
  save: HeadingSave,
  variations: [
    {
      name: 'h1',
      title: 'H1',
      attributes: { level: 1 },
      scope: ['inserter' as const, 'transform' as const]
    },
    {
      name: 'h2',
      title: 'H2',
      attributes: { level: 2 },
      scope: ['inserter' as const, 'transform' as const],
      isDefault: true
    },
    {
      name: 'h3',
      title: 'H3',
      attributes: { level: 3 },
      scope: ['inserter' as const, 'transform' as const]
    }
  ]
};