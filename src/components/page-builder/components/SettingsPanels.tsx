import React, { useState } from 'react';
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
import { Switch } from '@/components/ui/switch';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

// Section Settings Panel
interface SectionSettingsProps {
  section: PageBuilderSection;
  onUpdate: (updates: Partial<PageBuilderSection>) => void;
}

export const SectionSettings: React.FC<SectionSettingsProps> = ({ section, onUpdate }) => {
  const [useAdvancedSpacing, setUseAdvancedSpacing] = useState(false);
  const [customWidthMode, setCustomWidthMode] = useState(!!section.customWidth);

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
            <Label htmlFor="section-width">Width Mode</Label>
            <div className="flex items-center space-x-2">
              <Switch 
                checked={customWidthMode}
                onCheckedChange={(checked) => {
                  setCustomWidthMode(checked);
                  if (!checked) {
                    onUpdate({ customWidth: undefined });
                  }
                }}
              />
              <Label className="text-sm">Custom Width</Label>
            </div>
          </div>
          
          {!customWidthMode ? (
            <div className="space-y-2">
              <Label htmlFor="section-width">Preset Width</Label>
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
          ) : (
            <div className="space-y-2">
              <Label htmlFor="custom-width">Custom Width</Label>
              <Input
                id="custom-width"
                value={section.customWidth || ''}
                onChange={(e) => onUpdate({ customWidth: e.target.value })}
                placeholder="e.g., 1000px, 80%, 100vw"
              />
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="max-width">Max Width</Label>
            <Input
              id="max-width"
              value={section.styles?.maxWidth || ''}
              onChange={(e) => handleStyleUpdate('maxWidth', e.target.value)}
              placeholder="e.g., 1400px, 100%"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="min-width">Min Width</Label>
            <Input
              id="min-width"
              value={section.styles?.minWidth || ''}
              onChange={(e) => handleStyleUpdate('minWidth', e.target.value)}
              placeholder="e.g., 320px, 50%"
            />
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
            <div className="flex items-center space-x-2">
              <Input
                type="color"
                value={section.styles?.backgroundColor || '#ffffff'}
                onChange={(e) => handleStyleUpdate('backgroundColor', e.target.value)}
                className="w-16 h-8 rounded border"
              />
              <Input
                type="text"
                value={section.styles?.backgroundColor || 'transparent'}
                onChange={(e) => handleStyleUpdate('backgroundColor', e.target.value)}
                placeholder="transparent or #ffffff"
                className="flex-1"
              />
            </div>
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
          <div className="flex items-center space-x-2 mb-4">
            <Switch 
              checked={useAdvancedSpacing}
              onCheckedChange={setUseAdvancedSpacing}
            />
            <Label className="text-sm">Advanced Spacing</Label>
          </div>
          
          {!useAdvancedSpacing ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="section-padding">Padding</Label>
                <Input
                  id="section-padding"
                  value={section.styles?.padding || ''}
                  onChange={(e) => handleStyleUpdate('padding', e.target.value)}
                  placeholder="20px or 20px 40px"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="section-margin">Margin</Label>
                <Input
                  id="section-margin"
                  value={section.styles?.margin || ''}
                  onChange={(e) => handleStyleUpdate('margin', e.target.value)}
                  placeholder="10px 0 or auto"
                />
              </div>
            </>
          ) : (
            <>
              <Collapsible>
                <CollapsibleTrigger className="flex items-center space-x-2 w-full text-left">
                  <ChevronRight className="h-4 w-4" />
                  <Label className="text-sm font-medium">Padding</Label>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 mt-2 pl-6">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Top</Label>
                      <Input
                        value={section.styles?.paddingTop || ''}
                        onChange={(e) => handleStyleUpdate('paddingTop', e.target.value)}
                        placeholder="0px"
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Right</Label>
                      <Input
                        value={section.styles?.paddingRight || ''}
                        onChange={(e) => handleStyleUpdate('paddingRight', e.target.value)}
                        placeholder="0px"
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Bottom</Label>
                      <Input
                        value={section.styles?.paddingBottom || ''}
                        onChange={(e) => handleStyleUpdate('paddingBottom', e.target.value)}
                        placeholder="0px"
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Left</Label>
                      <Input
                        value={section.styles?.paddingLeft || ''}
                        onChange={(e) => handleStyleUpdate('paddingLeft', e.target.value)}
                        placeholder="0px"
                        className="h-8"
                      />
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
              
              <Collapsible>
                <CollapsibleTrigger className="flex items-center space-x-2 w-full text-left">
                  <ChevronRight className="h-4 w-4" />
                  <Label className="text-sm font-medium">Margin</Label>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 mt-2 pl-6">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Top</Label>
                      <Input
                        value={section.styles?.marginTop || ''}
                        onChange={(e) => handleStyleUpdate('marginTop', e.target.value)}
                        placeholder="0px"
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Right</Label>
                      <Input
                        value={section.styles?.marginRight || ''}
                        onChange={(e) => handleStyleUpdate('marginRight', e.target.value)}
                        placeholder="0px"
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Bottom</Label>
                      <Input
                        value={section.styles?.marginBottom || ''}
                        onChange={(e) => handleStyleUpdate('marginBottom', e.target.value)}
                        placeholder="0px"
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Left</Label>
                      <Input
                        value={section.styles?.marginLeft || ''}
                        onChange={(e) => handleStyleUpdate('marginLeft', e.target.value)}
                        placeholder="0px"
                        className="h-8"
                      />
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </>
          )}
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
  const [useAdvancedSpacing, setUseAdvancedSpacing] = useState(false);
  const [customWidthMode, setCustomWidthMode] = useState(!!row.customWidth);

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
          
          <div className="space-y-2">
            <Label>Row Width Mode</Label>
            <div className="flex items-center space-x-2">
              <Switch 
                checked={customWidthMode}
                onCheckedChange={(checked) => {
                  setCustomWidthMode(checked);
                  if (!checked) {
                    onUpdate({ customWidth: undefined });
                  }
                }}
              />
              <Label className="text-sm">Custom Width</Label>
            </div>
          </div>
          
          {customWidthMode && (
            <div className="space-y-2">
              <Label htmlFor="row-custom-width">Custom Width</Label>
              <Input
                id="row-custom-width"
                value={row.customWidth || ''}
                onChange={(e) => onUpdate({ customWidth: e.target.value })}
                placeholder="e.g., 800px, 90%, 100vw"
              />
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="row-max-width">Max Width</Label>
            <Input
              id="row-max-width"
              value={row.styles?.maxWidth || ''}
              onChange={(e) => handleStyleUpdate('maxWidth', e.target.value)}
              placeholder="e.g., 1200px, 100%"
            />
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
            <div className="flex items-center space-x-2">
              <Input
                type="color"
                value={row.styles?.backgroundColor || '#ffffff'}
                onChange={(e) => handleStyleUpdate('backgroundColor', e.target.value)}
                className="w-16 h-8 rounded border"
              />
              <Input
                type="text"
                value={row.styles?.backgroundColor || 'transparent'}
                onChange={(e) => handleStyleUpdate('backgroundColor', e.target.value)}
                placeholder="transparent or #ffffff"
                className="flex-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Spacing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2 mb-4">
            <Switch 
              checked={useAdvancedSpacing}
              onCheckedChange={setUseAdvancedSpacing}
            />
            <Label className="text-sm">Advanced Spacing</Label>
          </div>
          
          {!useAdvancedSpacing ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="row-padding">Padding</Label>
                <Input
                  id="row-padding"
                  value={row.styles?.padding || ''}
                  onChange={(e) => handleStyleUpdate('padding', e.target.value)}
                  placeholder="20px or 20px 40px"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="row-margin">Margin</Label>
                <Input
                  id="row-margin"
                  value={row.styles?.margin || ''}
                  onChange={(e) => handleStyleUpdate('margin', e.target.value)}
                  placeholder="10px 0 or auto"
                />
              </div>
            </>
          ) : (
            <>
              <Collapsible>
                <CollapsibleTrigger className="flex items-center space-x-2 w-full text-left">
                  <ChevronRight className="h-4 w-4" />
                  <Label className="text-sm font-medium">Padding</Label>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 mt-2 pl-6">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Top</Label>
                      <Input
                        value={row.styles?.paddingTop || ''}
                        onChange={(e) => handleStyleUpdate('paddingTop', e.target.value)}
                        placeholder="0px"
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Right</Label>
                      <Input
                        value={row.styles?.paddingRight || ''}
                        onChange={(e) => handleStyleUpdate('paddingRight', e.target.value)}
                        placeholder="0px"
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Bottom</Label>
                      <Input
                        value={row.styles?.paddingBottom || ''}
                        onChange={(e) => handleStyleUpdate('paddingBottom', e.target.value)}
                        placeholder="0px"
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Left</Label>
                      <Input
                        value={row.styles?.paddingLeft || ''}
                        onChange={(e) => handleStyleUpdate('paddingLeft', e.target.value)}
                        placeholder="0px"
                        className="h-8"
                      />
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
              
              <Collapsible>
                <CollapsibleTrigger className="flex items-center space-x-2 w-full text-left">
                  <ChevronRight className="h-4 w-4" />
                  <Label className="text-sm font-medium">Margin</Label>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 mt-2 pl-6">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Top</Label>
                      <Input
                        value={row.styles?.marginTop || ''}
                        onChange={(e) => handleStyleUpdate('marginTop', e.target.value)}
                        placeholder="0px"
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Right</Label>
                      <Input
                        value={row.styles?.marginRight || ''}
                        onChange={(e) => handleStyleUpdate('marginRight', e.target.value)}
                        placeholder="0px"
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Bottom</Label>
                      <Input
                        value={row.styles?.marginBottom || ''}
                        onChange={(e) => handleStyleUpdate('marginBottom', e.target.value)}
                        placeholder="0px"
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Left</Label>
                      <Input
                        value={row.styles?.marginLeft || ''}
                        onChange={(e) => handleStyleUpdate('marginLeft', e.target.value)}
                        placeholder="0px"
                        className="h-8"
                      />
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </>
          )}
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
  const [useAdvancedSpacing, setUseAdvancedSpacing] = useState(false);
  const [customWidthMode, setCustomWidthMode] = useState(!!column.customWidth);

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
              Current grid width: {column.width} units
            </p>
          </div>
          
          <div className="space-y-2">
            <Label>Column Width Mode</Label>
            <div className="flex items-center space-x-2">
              <Switch 
                checked={customWidthMode}
                onCheckedChange={(checked) => {
                  setCustomWidthMode(checked);
                  if (!checked) {
                    onUpdate({ customWidth: undefined });
                  }
                }}
              />
              <Label className="text-sm">Override Grid Width</Label>
            </div>
          </div>
          
          {customWidthMode && (
            <div className="space-y-2">
              <Label htmlFor="column-custom-width">Custom Width</Label>
              <Input
                id="column-custom-width"
                value={column.customWidth || ''}
                onChange={(e) => onUpdate({ customWidth: e.target.value })}
                placeholder="e.g., 300px, 50%, 20rem"
              />
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="column-max-width">Max Width</Label>
            <Input
              id="column-max-width"
              value={column.styles?.maxWidth || ''}
              onChange={(e) => handleStyleUpdate('maxWidth', e.target.value)}
              placeholder="e.g., 400px, 100%"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="column-min-width">Min Width</Label>
            <Input
              id="column-min-width"
              value={column.styles?.minWidth || ''}
              onChange={(e) => handleStyleUpdate('minWidth', e.target.value)}
              placeholder="e.g., 200px, 30%"
            />
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
            <div className="flex items-center space-x-2">
              <Input
                type="color"
                value={column.styles?.backgroundColor || '#ffffff'}
                onChange={(e) => handleStyleUpdate('backgroundColor', e.target.value)}
                className="w-16 h-8 rounded border"
              />
              <Input
                type="text"
                value={column.styles?.backgroundColor || 'transparent'}
                onChange={(e) => handleStyleUpdate('backgroundColor', e.target.value)}
                placeholder="transparent or #ffffff"
                className="flex-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Spacing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2 mb-4">
            <Switch 
              checked={useAdvancedSpacing}
              onCheckedChange={setUseAdvancedSpacing}
            />
            <Label className="text-sm">Advanced Spacing</Label>
          </div>
          
          {!useAdvancedSpacing ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="column-padding">Padding</Label>
                <Input
                  id="column-padding"
                  value={column.styles?.padding || ''}
                  onChange={(e) => handleStyleUpdate('padding', e.target.value)}
                  placeholder="20px or 20px 40px"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="column-margin">Margin</Label>
                <Input
                  id="column-margin"
                  value={column.styles?.margin || ''}
                  onChange={(e) => handleStyleUpdate('margin', e.target.value)}
                  placeholder="10px 0 or auto"
                />
              </div>
            </>
          ) : (
            <>
              <Collapsible>
                <CollapsibleTrigger className="flex items-center space-x-2 w-full text-left">
                  <ChevronRight className="h-4 w-4" />
                  <Label className="text-sm font-medium">Padding</Label>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 mt-2 pl-6">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Top</Label>
                      <Input
                        value={column.styles?.paddingTop || ''}
                        onChange={(e) => handleStyleUpdate('paddingTop', e.target.value)}
                        placeholder="0px"
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Right</Label>
                      <Input
                        value={column.styles?.paddingRight || ''}
                        onChange={(e) => handleStyleUpdate('paddingRight', e.target.value)}
                        placeholder="0px"
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Bottom</Label>
                      <Input
                        value={column.styles?.paddingBottom || ''}
                        onChange={(e) => handleStyleUpdate('paddingBottom', e.target.value)}
                        placeholder="0px"
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Left</Label>
                      <Input
                        value={column.styles?.paddingLeft || ''}
                        onChange={(e) => handleStyleUpdate('paddingLeft', e.target.value)}
                        placeholder="0px"
                        className="h-8"
                      />
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
              
              <Collapsible>
                <CollapsibleTrigger className="flex items-center space-x-2 w-full text-left">
                  <ChevronRight className="h-4 w-4" />
                  <Label className="text-sm font-medium">Margin</Label>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 mt-2 pl-6">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Top</Label>
                      <Input
                        value={column.styles?.marginTop || ''}
                        onChange={(e) => handleStyleUpdate('marginTop', e.target.value)}
                        placeholder="0px"
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Right</Label>
                      <Input
                        value={column.styles?.marginRight || ''}
                        onChange={(e) => handleStyleUpdate('marginRight', e.target.value)}
                        placeholder="0px"
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Bottom</Label>
                      <Input
                        value={column.styles?.marginBottom || ''}
                        onChange={(e) => handleStyleUpdate('marginBottom', e.target.value)}
                        placeholder="0px"
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Left</Label>
                      <Input
                        value={column.styles?.marginLeft || ''}
                        onChange={(e) => handleStyleUpdate('marginLeft', e.target.value)}
                        placeholder="0px"
                        className="h-8"
                      />
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </>
          )}
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