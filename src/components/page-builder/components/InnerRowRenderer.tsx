import React, { useState } from 'react';
import { GripVertical, Copy, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageBuilderRow, PageBuilderElement } from '../types';
import { InnerColumnRenderer } from './InnerColumnRenderer';
import { cn } from '@/lib/utils';

interface InnerRowRendererProps {
  row: PageBuilderRow;
  isPreviewMode: boolean;
  deviceType?: 'desktop' | 'tablet' | 'mobile';
  onAddElement: (rowId: string, columnId: string, elementType: string, insertIndex?: number) => void;
  onRemoveElement: (elementId: string) => void;
  onUpdateElement: (elementId: string, updates: Partial<PageBuilderElement>) => void;
  onDeleteRow: () => void;
  onDuplicateRow: () => void;
  onAddRowAfter: () => void;
  onSelectElement?: (elementId: string) => void;
  selectedElementId?: string;
}

export const InnerRowRenderer: React.FC<InnerRowRendererProps> = ({
  row,
  isPreviewMode,
  deviceType = 'desktop',
  onAddElement,
  onRemoveElement,
  onUpdateElement,
  onDeleteRow,
  onDuplicateRow,
  onAddRowAfter,
  onSelectElement,
  selectedElementId
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const getDeviceSpecificGridStyle = (): React.CSSProperties => {
    return {
      display: 'grid',
      gridTemplateColumns: row.columns.map(col => `${col.width}fr`).join(' '),
      gap: '1rem',
      width: '100%'
    };
  };

  return (
    <div
      className={cn(
        'inner-row relative min-h-[60px] p-2 rounded',
        !isPreviewMode && 'border border-dashed border-transparent hover:border-muted-foreground/30'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Row Controls */}
      {!isPreviewMode && isHovered && (
        <div className="absolute -top-8 left-0 flex items-center space-x-1 bg-muted text-muted-foreground px-2 py-1 rounded-md text-xs z-10">
          <GripVertical className="h-3 w-3" />
          <span>Row</span>
          <Button
            size="sm"
            variant="ghost"
            className="h-5 w-5 p-0 hover:bg-muted-foreground/20"
            onClick={onDuplicateRow}
            title="Duplicate Row"
          >
            <Copy className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-5 w-5 p-0 hover:bg-destructive/20 text-destructive"
            onClick={onDeleteRow}
            title="Delete Row"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-5 w-5 p-0 hover:bg-muted-foreground/20"
            onClick={onAddRowAfter}
            title="Add Row Below"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Columns Grid */}
      <div style={getDeviceSpecificGridStyle()}>
        {row.columns.map((column) => (
          <InnerColumnRenderer
            key={column.id}
            column={column}
            rowId={row.id}
            isPreviewMode={isPreviewMode}
            deviceType={deviceType}
            onAddElement={onAddElement}
            onRemoveElement={onRemoveElement}
            onUpdateElement={onUpdateElement}
            onSelectElement={onSelectElement}
            selectedElementId={selectedElementId}
          />
        ))}
      </div>
    </div>
  );
};