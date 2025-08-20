import React, { useState } from 'react';
import { Heading } from 'lucide-react';
import { BlockEditProps, BlockSaveProps, BlockRegistration } from '../types';
import { InlineRTE, sanitizeHtml } from '@/components/page-builder/components/InlineRTE';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const HeadingEdit: React.FC<BlockEditProps> = ({ block, onUpdate, isSelected }) => {
  const [content, setContent] = useState(block.content.text || '');
  const [level, setLevel] = useState(block.content.level || 2);

  const handleTextChange = (newText: string) => {
    setContent(newText);
    onUpdate({ text: newText, level });
  };

  const handleLevelChange = (newLevel: string) => {
    const levelNum = parseInt(newLevel);
    setLevel(levelNum);
    onUpdate({ text: content, level: levelNum });
  };

  return (
    <div className={`p-4 border rounded-lg ${isSelected ? 'border-primary' : 'border-border'}`}>
      <div className="flex gap-2 mb-2">
        <Select value={level.toString()} onValueChange={handleLevelChange}>
          <SelectTrigger className="w-20">
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
      </div>
      <InlineRTE
        value={content}
        onChange={handleTextChange}
        placeholder="Write your heading..."
        variant="heading"
        className="text-lg font-semibold w-full"
      />
    </div>
  );
};

const HeadingSave: React.FC<BlockSaveProps> = ({ block }) => {
  const level = block.content.level || 2;
  const text = block.content.text || '';
  
  const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements;
  const headingClasses = {
    1: 'text-4xl font-bold',
    2: 'text-3xl font-bold',
    3: 'text-2xl font-bold',
    4: 'text-xl font-semibold',
    5: 'text-lg font-semibold',
    6: 'text-base font-semibold',
  };

  return (
    <HeadingTag 
      className={`${headingClasses[level as keyof typeof headingClasses]} whitespace-pre-wrap`}
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(text, 'heading') }}
    />
  );
};

export const headingBlock: BlockRegistration = {
  name: 'core/heading',
  settings: {
    name: 'core/heading',
    title: 'Heading',
    icon: Heading,
    category: 'text',
    supports: {
      alignment: true,
      spacing: true,
      color: true,
    },
  },
  edit: HeadingEdit,
  save: HeadingSave,
};