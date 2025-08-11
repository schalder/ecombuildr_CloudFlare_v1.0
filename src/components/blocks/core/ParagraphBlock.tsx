import React, { useState } from 'react';
import { Type } from 'lucide-react';
import { BlockEditProps, BlockSaveProps, BlockRegistration } from '../types';
import { InlineEditor } from '@/components/page-builder/components/InlineEditor';

const ParagraphEdit: React.FC<BlockEditProps> = ({ block, onUpdate, isSelected }) => {
  const [content, setContent] = useState(block.content.text || '');

  const handleChange = (newText: string) => {
    setContent(newText);
    onUpdate({ text: newText });
  };

  return (
    <div className={`p-4 border rounded-lg ${isSelected ? 'border-primary' : 'border-border'}`}>
      <InlineEditor
        value={content}
        onChange={handleChange}
        placeholder="Write your paragraph here..."
        multiline={true}
        className="w-full min-h-[100px]"
      />
    </div>
  );
};

const ParagraphSave: React.FC<BlockSaveProps> = ({ block }) => {
  return (
    <p className="text-base leading-relaxed whitespace-pre-wrap">
      {block.content.text || ''}
    </p>
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