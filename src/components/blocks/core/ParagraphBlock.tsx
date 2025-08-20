import React, { useState } from 'react';
import { Type } from 'lucide-react';
import { BlockEditProps, BlockSaveProps, BlockRegistration } from '../types';
import { InlineRTE, sanitizeHtml } from '@/components/page-builder/components/InlineRTE';

const ParagraphEdit: React.FC<BlockEditProps> = ({ block, onUpdate, isSelected }) => {
  const [content, setContent] = useState(block.content.text || '');

  const handleChange = (newText: string) => {
    setContent(newText);
    onUpdate({ text: newText });
  };

  return (
    <div className={`p-4 border rounded-lg ${isSelected ? 'border-primary' : 'border-border'}`}>
      <InlineRTE
        value={content}
        onChange={handleChange}
        placeholder="Write your paragraph here..."
        variant="paragraph"
        className="w-full min-h-[100px]"
      />
    </div>
  );
};

const ParagraphSave: React.FC<BlockSaveProps> = ({ block }) => {
  return (
    <div 
      className="text-base leading-relaxed"
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(block.content.text || '', 'paragraph') }}
    />
  );
};

export const paragraphBlock: BlockRegistration = {
  name: 'core/paragraph',
  settings: {
    name: 'core/paragraph',
    title: 'Paragraph',
    icon: Type,
    category: 'text',
    supports: {
      alignment: true,
      spacing: true,
      color: true,
    },
  },
  edit: ParagraphEdit,
  save: ParagraphSave,
};