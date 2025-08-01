import React from 'react';
import { Block } from './types';
import { blockRegistry } from './registry';

interface BlockRendererProps {
  blocks: Block[];
  className?: string;
}

export const BlockRenderer: React.FC<BlockRendererProps> = ({ blocks, className = '' }) => {
  return (
    <div className={`space-y-6 ${className}`}>
      {blocks.map((block) => {
        const blockRegistration = blockRegistry.get(block.type);
        if (!blockRegistration) {
          console.warn(`Block type "${block.type}" not found in registry`);
          return null;
        }

        const SaveComponent = blockRegistration.save;
        return (
          <div key={block.id}>
            <SaveComponent block={block} />
          </div>
        );
      })}
    </div>
  );
};