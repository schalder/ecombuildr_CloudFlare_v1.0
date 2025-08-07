import React from 'react';
import { PageBuilderData } from '@/components/page-builder/types';
import { SectionRenderer } from '@/components/page-builder/components/SectionRenderer';

interface PageBuilderRendererProps {
  data: PageBuilderData;
  className?: string;
}

export const PageBuilderRenderer: React.FC<PageBuilderRendererProps> = ({ 
  data, 
  className = '' 
}) => {
  if (!data?.sections || data.sections.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <p className="text-muted-foreground">This page is still being set up.</p>
      </div>
    );
  }

  return (
    <div className={`page-builder-content ${className}`}>
      {/* Apply global styles if they exist */}
      {data.globalStyles && (
        <style>{`
          .page-builder-content {
            ${Object.entries(data.globalStyles).map(([key, value]) => `${key}: ${value};`).join(' ')}
          }
        `}</style>
      )}
      
      {/* Render sections in preview mode for storefront */}
      <div className="space-y-0">
        {data.sections.map((section, index) => (
          <SectionRenderer
            key={section.id}
            section={section}
            sectionIndex={index}
            isSelected={false}
            isPreviewMode={true}
            deviceType="desktop"
            onSelectElement={() => {}}
            onUpdateElement={() => {}}
            onAddElement={() => {}}
            onRemoveElement={() => {}}
            onMoveElement={() => {}}
            onAddSectionAfter={() => {}}
            onAddRowAfter={() => {}}
          />
        ))}
      </div>
    </div>
  );
};