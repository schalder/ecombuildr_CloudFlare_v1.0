import React, { useState } from 'react';
import { PageBuilderSection, PageBuilderRow, PageBuilderColumn, PageBuilderElement, SECTION_WIDTHS, COLUMN_LAYOUTS, BackgroundImageMode } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ColorPicker } from '@/components/ui/color-picker';
import { BoxShadowPicker } from '@/components/ui/box-shadow-picker';
import GradientPicker from '@/components/ui/gradient-picker';
import { Switch } from '@/components/ui/switch';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CompactMediaSelector } from './CompactMediaSelector';
import { CollapsibleGroup } from './ElementStyles/_shared/CollapsibleGroup';
import { SpacingSliders } from './ElementStyles/_shared/SpacingSliders';

// Section Settings Panel
interface SectionSettingsProps {
  section: PageBuilderSection;
  onUpdate: (updates: Partial<PageBuilderSection>) => void;
}

export const SectionSettings: React.FC<SectionSettingsProps> = ({ section, onUpdate }) => {
  const [customWidthMode, setCustomWidthMode] = useState(!!section.customWidth);
  const [openGroups, setOpenGroups] = useState({
    layout: true,
    background: false,
    border: false,
    spacing: false,
    responsive: false
  });

  const toggleGroup = (group: string) => {
    setOpenGroups(prev => ({
      ...prev,
      [group]: !prev[group]
    }));
  };

  const handleStyleUpdate = (key: string, value: any) => {
    if (value === undefined || value === '') {
      const newStyles = { ...section.styles };
      delete newStyles[key];
      onUpdate({ styles: newStyles });
    } else {
      onUpdate({
        styles: {
          ...section.styles,
          [key]: value
        }
      });
    }
  };

  const handleSpacingChange = (type: 'margin' | 'padding', property: string, value: string) => {
    handleStyleUpdate(property, value);
  };

  return (
    <div className="p-4 space-y-4">
      {/* Anchor */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Anchor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2">
            <Input readOnly value={section.anchor || ''} />
            <Button size="sm" onClick={() => section.anchor && navigator.clipboard.writeText(section.anchor)}>Copy</Button>
          </div>
          <p className="text-xs text-muted-foreground">Use #{section.anchor} for in-page scrolling</p>
        </CardContent>
      </Card>

      {/* Layout Group */}
      <Card>
        <CollapsibleGroup
          title="Layout"
          isOpen={openGroups.layout}
          onToggle={() => toggleGroup('layout')}
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Width</Label>
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
                <Label>Preset Width</Label>
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
                <Label>Custom Width</Label>
                <Input
                  value={section.customWidth || ''}
                  onChange={(e) => onUpdate({ customWidth: e.target.value })}
                  placeholder="e.g., 1000px, 80%, 100vw"
                />
              </div>
            )}
          </div>
        </CollapsibleGroup>
      </Card>

      {/* Background Group */}
      <Card>
        <CollapsibleGroup
          title="Background"
          isOpen={openGroups.background}
          onToggle={() => toggleGroup('background')}
        >
          <div className="space-y-4">
            <ColorPicker
              color={section.styles?.backgroundColor || 'transparent'}
              onChange={(color) => handleStyleUpdate('backgroundColor', color)}
              label="Background Color"
            />
            
            <GradientPicker
              gradient={section.styles?.backgroundGradient || ''}
              onChange={(gradient) => handleStyleUpdate('backgroundGradient', gradient)}
              label="Background Gradient"
            />

            <CompactMediaSelector
              selectedMedia={section.styles?.backgroundImage || null}
              onMediaSelect={(media) => handleStyleUpdate('backgroundImage', media)}
              label="Background Image"
            />

            <div className="space-y-2">
              <Label>Background Opacity</Label>
              <Slider
                min={0}
                max={1}
                step={0.1}
                value={[section.styles?.backgroundOpacity ?? 1]}
                onValueChange={(value) => handleStyleUpdate('backgroundOpacity', value[0])}
              />
            </div>

            <BoxShadowPicker
              value={section.styles?.boxShadow || 'none'}
              onChange={(shadow) => handleStyleUpdate('boxShadow', shadow)}
              label="Box Shadow"
            />
          </div>
        </CollapsibleGroup>
      </Card>

      {/* Border Group */}
      <Card>
        <CollapsibleGroup
          title="Border"
          isOpen={openGroups.border}
          onToggle={() => toggleGroup('border')}
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Border Width (px)</Label>
              <Slider
                min={0}
                max={20}
                step={1}
                value={[parseInt(section.styles?.borderWidth?.replace('px', '') || '0')]}
                onValueChange={(value) => handleStyleUpdate('borderWidth', `${value[0]}px`)}
              />
              <div className="text-xs text-muted-foreground">
                {parseInt(section.styles?.borderWidth?.replace('px', '') || '0')}px
              </div>
            </div>

            <ColorPicker
              color={section.styles?.borderColor || '#000000'}
              onChange={(color) => handleStyleUpdate('borderColor', color)}
              label="Border Color"
            />

            <div className="space-y-2">
              <Label>Border Radius (px)</Label>
              <Slider
                min={0}
                max={100}
                step={1}
                value={[parseInt(section.styles?.borderRadius?.replace('px', '') || '0')]}
                onValueChange={(value) => handleStyleUpdate('borderRadius', `${value[0]}px`)}
              />
              <div className="text-xs text-muted-foreground">
                {parseInt(section.styles?.borderRadius?.replace('px', '') || '0')}px
              </div>
            </div>
          </div>
        </CollapsibleGroup>
      </Card>

      {/* Spacing Group */}
      <Card>
        <CollapsibleGroup
          title="Spacing"
          isOpen={openGroups.spacing}
          onToggle={() => toggleGroup('spacing')}
        >
          <SpacingSliders
            marginTop={section.styles?.marginTop}
            marginRight={section.styles?.marginRight}
            marginBottom={section.styles?.marginBottom}
            marginLeft={section.styles?.marginLeft}
            paddingTop={section.styles?.paddingTop}
            paddingRight={section.styles?.paddingRight}
            paddingBottom={section.styles?.paddingBottom}
            paddingLeft={section.styles?.paddingLeft}
            onMarginChange={(property, value) => handleSpacingChange('margin', property, value)}
            onPaddingChange={(property, value) => handleSpacingChange('padding', property, value)}
          />
        </CollapsibleGroup>
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
  const [openGroups, setOpenGroups] = useState({
    layout: true,
    background: false,
    border: false,
    spacing: false,
    responsive: false
  });

  const toggleGroup = (group: string) => {
    setOpenGroups(prev => ({
      ...prev,
      [group]: !prev[group]
    }));
  };

  const handleStyleUpdate = (key: string, value: any) => {
    if (value === undefined || value === '') {
      const newStyles = { ...row.styles };
      delete newStyles[key];
      onUpdate({ styles: newStyles });
    } else {
      onUpdate({
        styles: {
          ...row.styles,
          [key]: value
        }
      });
    }
  };

  const handleSpacingChange = (type: 'margin' | 'padding', property: string, value: string) => {
    handleStyleUpdate(property, value);
  };

  return (
    <div className="p-4 space-y-4">
      {/* Anchor */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Anchor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2">
            <Input readOnly value={row.anchor || ''} />
            <Button size="sm" onClick={() => row.anchor && navigator.clipboard.writeText(row.anchor)}>Copy</Button>
          </div>
          <p className="text-xs text-muted-foreground">Use #{row.anchor} for in-page scrolling</p>
        </CardContent>
      </Card>

      {/* Layout Group */}
      <Card>
        <CollapsibleGroup
          title="Layout"
          isOpen={openGroups.layout}
          onToggle={() => toggleGroup('layout')}
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Column Layout</Label>
              <Select
                value={row.columnLayout}
                onValueChange={(value) => onUpdate({ columnLayout: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Column</SelectItem>
                  <SelectItem value="1-1">2 Columns (1:1)</SelectItem>
                  <SelectItem value="1-2">2 Columns (1:2)</SelectItem>
                  <SelectItem value="2-1">2 Columns (2:1)</SelectItem>
                  <SelectItem value="1-1-1">3 Columns (1:1:1)</SelectItem>
                  <SelectItem value="1-2-1">3 Columns (1:2:1)</SelectItem>
                  <SelectItem value="2-1-1">3 Columns (2:1:1)</SelectItem>
                  <SelectItem value="1-1-1-1">4 Columns</SelectItem>
                  <SelectItem value="1-1-1-1-1">5 Columns</SelectItem>
                  <SelectItem value="1-1-1-1-1-1">6 Columns</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CollapsibleGroup>
      </Card>

      {/* Background Group */}
      <Card>
        <CollapsibleGroup
          title="Background"
          isOpen={openGroups.background}
          onToggle={() => toggleGroup('background')}
        >
          <div className="space-y-4">
            <ColorPicker
              color={row.styles?.backgroundColor || 'transparent'}
              onChange={(color) => handleStyleUpdate('backgroundColor', color)}
              label="Background Color"
            />
            
            <GradientPicker
              gradient={row.styles?.backgroundGradient || ''}
              onChange={(gradient) => handleStyleUpdate('backgroundGradient', gradient)}
              label="Background Gradient"
            />

            <CompactMediaSelector
              selectedMedia={row.styles?.backgroundImage || null}
              onMediaSelect={(media) => handleStyleUpdate('backgroundImage', media)}
              label="Background Image"
            />

            <div className="space-y-2">
              <Label>Background Opacity</Label>
              <Slider
                min={0}
                max={1}
                step={0.1}
                value={[row.styles?.backgroundOpacity ?? 1]}
                onValueChange={(value) => handleStyleUpdate('backgroundOpacity', value[0])}
              />
            </div>

            <BoxShadowPicker
              value={row.styles?.boxShadow || 'none'}
              onChange={(shadow) => handleStyleUpdate('boxShadow', shadow)}
              label="Box Shadow"
            />
          </div>
        </CollapsibleGroup>
      </Card>

      {/* Border Group */}
      <Card>
        <CollapsibleGroup
          title="Border"
          isOpen={openGroups.border}
          onToggle={() => toggleGroup('border')}
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Border Width (px)</Label>
              <Slider
                min={0}
                max={20}
                step={1}
                value={[parseInt(row.styles?.borderWidth?.replace('px', '') || '0')]}
                onValueChange={(value) => handleStyleUpdate('borderWidth', `${value[0]}px`)}
              />
              <div className="text-xs text-muted-foreground">
                {parseInt(row.styles?.borderWidth?.replace('px', '') || '0')}px
              </div>
            </div>

            <ColorPicker
              color={row.styles?.borderColor || '#000000'}
              onChange={(color) => handleStyleUpdate('borderColor', color)}
              label="Border Color"
            />

            <div className="space-y-2">
              <Label>Border Radius (px)</Label>
              <Slider
                min={0}
                max={100}
                step={1}
                value={[parseInt(row.styles?.borderRadius?.replace('px', '') || '0')]}
                onValueChange={(value) => handleStyleUpdate('borderRadius', `${value[0]}px`)}
              />
              <div className="text-xs text-muted-foreground">
                {parseInt(row.styles?.borderRadius?.replace('px', '') || '0')}px
              </div>
            </div>
          </div>
        </CollapsibleGroup>
      </Card>

      {/* Spacing Group */}
      <Card>
        <CollapsibleGroup
          title="Spacing"
          isOpen={openGroups.spacing}
          onToggle={() => toggleGroup('spacing')}
        >
          <SpacingSliders
            marginTop={row.styles?.marginTop}
            marginRight={row.styles?.marginRight}
            marginBottom={row.styles?.marginBottom}
            marginLeft={row.styles?.marginLeft}
            paddingTop={row.styles?.paddingTop}
            paddingRight={row.styles?.paddingRight}
            paddingBottom={row.styles?.paddingBottom}
            paddingLeft={row.styles?.paddingLeft}
            onMarginChange={(property, value) => handleSpacingChange('margin', property, value)}
            onPaddingChange={(property, value) => handleSpacingChange('padding', property, value)}
          />
        </CollapsibleGroup>
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
  const [openGroups, setOpenGroups] = useState({
    layout: true,
    background: false,
    border: false,
    spacing: false,
    responsive: false
  });

  const toggleGroup = (group: string) => {
    setOpenGroups(prev => ({
      ...prev,
      [group]: !prev[group]
    }));
  };

  const handleStyleUpdate = (key: string, value: any) => {
    if (value === undefined || value === '') {
      const newStyles = { ...column.styles };
      delete newStyles[key];
      onUpdate({ styles: newStyles });
    } else {
      onUpdate({
        styles: {
          ...column.styles,
          [key]: value
        }
      });
    }
  };

  const handleSpacingChange = (type: 'margin' | 'padding', property: string, value: string) => {
    handleStyleUpdate(property, value);
  };

  return (
    <div className="p-4 space-y-4">
      {/* Anchor */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Anchor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2">
            <Input readOnly value={column.anchor || ''} />
            <Button size="sm" onClick={() => column.anchor && navigator.clipboard.writeText(column.anchor)}>Copy</Button>
          </div>
          <p className="text-xs text-muted-foreground">Use #{column.anchor} for in-page scrolling</p>
        </CardContent>
      </Card>

      {/* Layout Group */}
      <Card>
        <CollapsibleGroup
          title="Layout"
          isOpen={openGroups.layout}
          onToggle={() => toggleGroup('layout')}
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Content Direction</Label>
              <Select
                value={column.styles?.contentDirection || 'column'}
                onValueChange={(value) => handleStyleUpdate('contentDirection', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="column">Vertical</SelectItem>
                  <SelectItem value="row">Horizontal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Content Alignment</Label>
              <Select
                value={column.styles?.contentAlignment || 'flex-start'}
                onValueChange={(value) => handleStyleUpdate('contentAlignment', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flex-start">Start</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="flex-end">End</SelectItem>
                  <SelectItem value="stretch">Stretch</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Content Justification</Label>
              <Select
                value={column.styles?.contentJustification || 'flex-start'}
                onValueChange={(value) => handleStyleUpdate('contentJustification', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flex-start">Start</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="flex-end">End</SelectItem>
                  <SelectItem value="space-between">Space Between</SelectItem>
                  <SelectItem value="space-around">Space Around</SelectItem>
                  <SelectItem value="space-evenly">Space Evenly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Content Gap</Label>
              <Input
                value={column.styles?.contentGap || ''}
                onChange={(e) => handleStyleUpdate('contentGap', e.target.value)}
                placeholder="e.g., 16px, 1rem"
              />
            </div>
          </div>
        </CollapsibleGroup>
      </Card>

      {/* Background Group */}
      <Card>
        <CollapsibleGroup
          title="Background"
          isOpen={openGroups.background}
          onToggle={() => toggleGroup('background')}
        >
          <div className="space-y-4">
            <ColorPicker
              color={column.styles?.backgroundColor || 'transparent'}
              onChange={(color) => handleStyleUpdate('backgroundColor', color)}
              label="Background Color"
            />
            
            <GradientPicker
              gradient={column.styles?.backgroundGradient || ''}
              onChange={(gradient) => handleStyleUpdate('backgroundGradient', gradient)}
              label="Background Gradient"
            />

            <CompactMediaSelector
              selectedMedia={column.styles?.backgroundImage || null}
              onMediaSelect={(media) => handleStyleUpdate('backgroundImage', media)}
              label="Background Image"
            />

            <div className="space-y-2">
              <Label>Background Opacity</Label>
              <Slider
                min={0}
                max={1}
                step={0.1}
                value={[column.styles?.backgroundOpacity ?? 1]}
                onValueChange={(value) => handleStyleUpdate('backgroundOpacity', value[0])}
              />
            </div>

            <BoxShadowPicker
              value={column.styles?.boxShadow || 'none'}
              onChange={(shadow) => handleStyleUpdate('boxShadow', shadow)}
              label="Box Shadow"
            />
          </div>
        </CollapsibleGroup>
      </Card>

      {/* Border Group */}
      <Card>
        <CollapsibleGroup
          title="Border"
          isOpen={openGroups.border}
          onToggle={() => toggleGroup('border')}
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Border Width (px)</Label>
              <Slider
                min={0}
                max={20}
                step={1}
                value={[parseInt(column.styles?.borderWidth?.replace('px', '') || '0')]}
                onValueChange={(value) => handleStyleUpdate('borderWidth', `${value[0]}px`)}
              />
              <div className="text-xs text-muted-foreground">
                {parseInt(column.styles?.borderWidth?.replace('px', '') || '0')}px
              </div>
            </div>

            <ColorPicker
              color={column.styles?.borderColor || '#000000'}
              onChange={(color) => handleStyleUpdate('borderColor', color)}
              label="Border Color"
            />

            <div className="space-y-2">
              <Label>Border Radius (px)</Label>
              <Slider
                min={0}
                max={100}
                step={1}
                value={[parseInt(column.styles?.borderRadius?.replace('px', '') || '0')]}
                onValueChange={(value) => handleStyleUpdate('borderRadius', `${value[0]}px`)}
              />
              <div className="text-xs text-muted-foreground">
                {parseInt(column.styles?.borderRadius?.replace('px', '') || '0')}px
              </div>
            </div>
          </div>
        </CollapsibleGroup>
      </Card>

      {/* Spacing Group */}
      <Card>
        <CollapsibleGroup
          title="Spacing"
          isOpen={openGroups.spacing}
          onToggle={() => toggleGroup('spacing')}
        >
          <SpacingSliders
            marginTop={column.styles?.marginTop}
            marginRight={column.styles?.marginRight}
            marginBottom={column.styles?.marginBottom}
            marginLeft={column.styles?.marginLeft}
            paddingTop={column.styles?.paddingTop}
            paddingRight={column.styles?.paddingRight}
            paddingBottom={column.styles?.paddingBottom}
            paddingLeft={column.styles?.paddingLeft}
            onMarginChange={(property, value) => handleSpacingChange('margin', property, value)}
            onPaddingChange={(property, value) => handleSpacingChange('padding', property, value)}
          />
        </CollapsibleGroup>
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