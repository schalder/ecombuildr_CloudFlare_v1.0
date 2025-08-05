import React from 'react';
import { PageBuilderSection, PageBuilderRow, PageBuilderColumn, PageBuilderElement, SECTION_WIDTHS, COLUMN_LAYOUTS } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ColorPicker } from '@/components/ui/color-picker';

// Section Settings Panel
interface SectionSettingsProps {
  section: PageBuilderSection;
  onUpdate: (updates: Partial<PageBuilderSection>) => void;
}

export const SectionSettings: React.FC<SectionSettingsProps> = ({ section, onUpdate }) => {
  const handleStyleUpdate = (key: string, value: any) => {
    onUpdate({
      styles: {
        ...section.styles,
        [key]: value
      }
    });
  };

  return (
    <div className="p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Section Layout</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="section-width">Width</Label>
            <Select
              value={section.width}
              onValueChange={(value) => onUpdate({ width: value as any })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full">Full Width</SelectItem>
                <SelectItem value="wide">Wide (1200px)</SelectItem>
                <SelectItem value="medium">Medium (800px)</SelectItem>
                <SelectItem value="small">Small (600px)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Background</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Background Color</Label>
            <ColorPicker
              color={section.styles?.backgroundColor || 'transparent'}
              onChange={(color) => handleStyleUpdate('backgroundColor', color)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="bg-image">Background Image URL</Label>
            <Input
              id="bg-image"
              value={section.styles?.backgroundImage || ''}
              onChange={(e) => handleStyleUpdate('backgroundImage', e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Spacing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="section-padding">Padding</Label>
            <Input
              id="section-padding"
              value={section.styles?.padding || '0'}
              onChange={(e) => handleStyleUpdate('padding', e.target.value)}
              placeholder="20px"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="section-margin">Margin</Label>
            <Input
              id="section-margin"
              value={section.styles?.margin || '0'}
              onChange={(e) => handleStyleUpdate('margin', e.target.value)}
              placeholder="10px 0"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Row Settings Panel
interface RowSettingsProps {
  row: PageBuilderRow;
  onUpdate: (updates: Partial<PageBuilderRow>) => void;
}

export const RowSettings: React.FC<RowSettingsProps> = ({ row, onUpdate }) => {
  const handleStyleUpdate = (key: string, value: any) => {
    onUpdate({
      styles: {
        ...row.styles,
        [key]: value
      }
    });
  };

  return (
    <div className="p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Row Layout</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Column Layout</Label>
            <Select
              value={row.columnLayout}
              onValueChange={(value) => {
                const columnWidths = COLUMN_LAYOUTS[value as keyof typeof COLUMN_LAYOUTS];
                // Preserve existing columns and their content when changing layout
                const newColumns = columnWidths.map((width, index) => {
                  const existingColumn = row.columns[index];
                  if (existingColumn) {
                    return { ...existingColumn, width };
                  }
                  return { 
                    id: `col-${Date.now()}-${index}`, 
                    width,
                    elements: [],
                    styles: {}
                  };
                });
                onUpdate({
                  columnLayout: value as any,
                  columns: newColumns
                });
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 Column</SelectItem>
                <SelectItem value="1-1">2 Columns (50/50)</SelectItem>
                <SelectItem value="1-2">2 Columns (33/67)</SelectItem>
                <SelectItem value="2-1">2 Columns (67/33)</SelectItem>
                <SelectItem value="1-1-1">3 Columns</SelectItem>
                <SelectItem value="1-2-1">3 Columns (25/50/25)</SelectItem>
                <SelectItem value="1-1-1-1">4 Columns</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Background</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Background Color</Label>
            <ColorPicker
              color={row.styles?.backgroundColor || 'transparent'}
              onChange={(color) => handleStyleUpdate('backgroundColor', color)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Spacing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="row-padding">Padding</Label>
            <Input
              id="row-padding"
              value={row.styles?.padding || '0'}
              onChange={(e) => handleStyleUpdate('padding', e.target.value)}
              placeholder="20px"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="row-margin">Margin</Label>
            <Input
              id="row-margin"
              value={row.styles?.margin || '0'}
              onChange={(e) => handleStyleUpdate('margin', e.target.value)}
              placeholder="10px 0"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Column Settings Panel
interface ColumnSettingsProps {
  column: PageBuilderColumn;
  onUpdate: (updates: Partial<PageBuilderColumn>) => void;
}

export const ColumnSettings: React.FC<ColumnSettingsProps> = ({ column, onUpdate }) => {
  const handleStyleUpdate = (key: string, value: any) => {
    onUpdate({
      styles: {
        ...column.styles,
        [key]: value
      }
    });
  };

  return (
    <div className="p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Column Layout</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 bg-muted/50 rounded text-sm">
            <p className="text-muted-foreground">
              Column width is determined by the row's layout. Use Row Properties to change column proportions.
            </p>
            <p className="mt-2 font-medium">
              Current width: {column.width} units
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Background</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Background Color</Label>
            <ColorPicker
              color={column.styles?.backgroundColor || 'transparent'}
              onChange={(color) => handleStyleUpdate('backgroundColor', color)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Spacing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="column-padding">Padding</Label>
            <Input
              id="column-padding"
              value={column.styles?.padding || '0'}
              onChange={(e) => handleStyleUpdate('padding', e.target.value)}
              placeholder="20px"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Unified Settings Panel that shows different controls based on selection
interface SettingsPanelProps {
  selectedItem: {
    type: 'section' | 'row' | 'column' | 'element';
    data: PageBuilderSection | PageBuilderRow | PageBuilderColumn | PageBuilderElement;
  } | null;
  onUpdate: (updates: any) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ selectedItem, onUpdate }) => {
  if (!selectedItem) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p>Select a section, row, column, or element to edit its properties</p>
      </div>
    );
  }

  switch (selectedItem.type) {
    case 'section':
      return (
        <SectionSettings
          section={selectedItem.data as PageBuilderSection}
          onUpdate={onUpdate}
        />
      );
    case 'row':
      return (
        <RowSettings
          row={selectedItem.data as PageBuilderRow}
          onUpdate={onUpdate}
        />
      );
    case 'column':
      return (
        <ColumnSettings
          column={selectedItem.data as PageBuilderColumn}
          onUpdate={onUpdate}
        />
      );
    default:
      return (
        <div className="p-4 text-center text-muted-foreground">
          <p>Element settings not implemented yet</p>
        </div>
      );
  }
};