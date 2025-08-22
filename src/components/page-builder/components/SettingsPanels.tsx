import React, { useState } from 'react';
import { PageBuilderSection, PageBuilderRow, PageBuilderColumn, SECTION_WIDTHS, COLUMN_LAYOUTS } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { ColorPicker } from '@/components/ui/color-picker';
import { BoxShadowPicker } from '@/components/ui/box-shadow-picker';
import GradientPicker from '@/components/ui/gradient-picker';
import { Switch } from '@/components/ui/switch';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CompactMediaSelector } from './CompactMediaSelector';
import { SpacingSliders } from './ElementStyles/_shared/SpacingSliders';

// Main SettingsPanel component that ElementorPageBuilder expects
interface SettingsPanelProps {
  selectedItem: any;
  onUpdate: (updates: any) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ 
  selectedItem, 
  onUpdate 
}) => {
  if (!selectedItem) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Select a section, row, or column to edit its settings.
      </div>
    );
  }

  if (selectedItem.type === 'section') {
    return (
      <SectionSettings
        section={selectedItem.data}
        onUpdate={onUpdate}
      />
    );
  }

  if (selectedItem.type === 'row') {
    return (
      <RowSettings
        row={selectedItem.data}
        onUpdate={onUpdate}
      />
    );
  }

  if (selectedItem.type === 'column') {
    return (
      <ColumnSettings
        column={selectedItem.data}
        onUpdate={onUpdate}
      />
    );
  }

  return (
    <div className="p-4 text-center text-muted-foreground">
      Unsupported selection type.
    </div>
  );
};

// Section Settings Panel
interface SectionSettingsProps {
  section: PageBuilderSection;
  onUpdate: (updates: Partial<PageBuilderSection>) => void;
}

export const SectionSettings: React.FC<SectionSettingsProps> = ({ section, onUpdate }) => {
  const [customWidthMode, setCustomWidthMode] = useState(!!section.customWidth);
  const [layoutOpen, setLayoutOpen] = useState(true);
  const [backgroundOpen, setBackgroundOpen] = useState(false);
  const [borderOpen, setBorderOpen] = useState(false);
  const [spacingOpen, setSpacingOpen] = useState(false);

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

  const parsePixelValue = (value?: string): number => {
    if (!value) return 0;
    const parsed = parseInt(value.replace(/[^0-9]/g, ''));
    return Math.min(200, Math.max(0, parsed || 0));
  };

  return (
    <div className="p-4 space-y-4">
      {/* Layout Settings */}
      <Collapsible open={layoutOpen} onOpenChange={setLayoutOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-2">
            <span className="font-medium">Layout</span>
            {layoutOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 p-2">
          <div className="space-y-4">
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
        </CollapsibleContent>
      </Collapsible>

      {/* Background Settings */}
      <Collapsible open={backgroundOpen} onOpenChange={setBackgroundOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-2">
            <span className="font-medium">Background</span>
            {backgroundOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 p-2">
          <ColorPicker
            color={section.styles?.backgroundColor || 'transparent'}
            onChange={(color) => handleStyleUpdate('backgroundColor', color)}
            label="Background Color"
          />
          
          <div className="space-y-2">
            <Label>Background Image</Label>
            <CompactMediaSelector
              value={section.styles?.backgroundImage || ''}
              onChange={(url) => handleStyleUpdate('backgroundImage', url)}
              label="Select Background Image"
            />
          </div>
          
          <GradientPicker
            value={section.styles?.backgroundGradient || ''}
            onChange={(gradient) => handleStyleUpdate('backgroundGradient', gradient)}
            label="Background Gradient"
          />
          
          <BoxShadowPicker
            value={section.styles?.boxShadow || 'none'}
            onChange={(shadow) => handleStyleUpdate('boxShadow', shadow)}
            label="Shadow"
          />
        </CollapsibleContent>
      </Collapsible>

      {/* Border Settings */}
      <Collapsible open={borderOpen} onOpenChange={setBorderOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-2">
            <span className="font-medium">Border</span>
            {borderOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 p-2">
          <div className="space-y-2">
            <Label>Border Width: {parsePixelValue(section.styles?.borderWidth)}px</Label>
            <Slider
              min={0}
              max={20}
              step={1}
              value={[parsePixelValue(section.styles?.borderWidth)]}
              onValueChange={(v) => handleStyleUpdate('borderWidth', `${v[0]}px`)}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Border Style</Label>
            <Select
              value={section.styles?.borderStyle || 'solid'}
              onValueChange={(value) => handleStyleUpdate('borderStyle', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="solid">Solid</SelectItem>
                <SelectItem value="dashed">Dashed</SelectItem>
                <SelectItem value="dotted">Dotted</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <ColorPicker
            color={section.styles?.borderColor || '#000000'}
            onChange={(color) => handleStyleUpdate('borderColor', color)}
            label="Border Color"
          />
          
          <div className="space-y-2">
            <Label>Border Radius: {parsePixelValue(section.styles?.borderRadius)}px</Label>
            <Slider
              min={0}
              max={50}
              step={1}
              value={[parsePixelValue(section.styles?.borderRadius)]}
              onValueChange={(v) => handleStyleUpdate('borderRadius', `${v[0]}px`)}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Spacing Settings */}
      <Collapsible open={spacingOpen} onOpenChange={setSpacingOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-2">
            <span className="font-medium">Spacing</span>
            {spacingOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 p-2">
          <SpacingSliders
            marginTop={section.styles?.marginTop}
            marginRight={section.styles?.marginRight}
            marginBottom={section.styles?.marginBottom}
            marginLeft={section.styles?.marginLeft}
            paddingTop={section.styles?.paddingTop}
            paddingRight={section.styles?.paddingRight}
            paddingBottom={section.styles?.paddingBottom}
            paddingLeft={section.styles?.paddingLeft}
            onMarginChange={(property, value) => handleStyleUpdate(property, value)}
            onPaddingChange={(property, value) => handleStyleUpdate(property, value)}
          />
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

// Similar implementations for RowSettings and ColumnSettings would follow the same pattern
// Row Settings Panel (simplified version)
interface RowSettingsProps {
  row: PageBuilderRow;
  onUpdate: (updates: Partial<PageBuilderRow>) => void;
}

export const RowSettings: React.FC<RowSettingsProps> = ({ row, onUpdate }) => {
  const [backgroundOpen, setBackgroundOpen] = useState(false);
  const [borderOpen, setBorderOpen] = useState(false);
  const [spacingOpen, setSpacingOpen] = useState(false);

  const handleStyleUpdate = (key: string, value: any) => {
    onUpdate({
      styles: {
        ...row.styles,
        [key]: value
      }
    });
  };

  const parsePixelValue = (value?: string): number => {
    if (!value) return 0;
    return Math.min(200, Math.max(0, parseInt(value.replace(/[^0-9]/g, '')) || 0));
  };

  return (
    <div className="p-4 space-y-4">
      {/* Background, Border, and Spacing settings similar to Section */}
      <Collapsible open={borderOpen} onOpenChange={setBorderOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-2">
            <span className="font-medium">Border</span>
            {borderOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 p-2">
          <div className="space-y-2">
            <Label>Border Width: {parsePixelValue(row.styles?.borderWidth)}px</Label>
            <Slider
              min={0}
              max={20}
              step={1}
              value={[parsePixelValue(row.styles?.borderWidth)]}
              onValueChange={(v) => handleStyleUpdate('borderWidth', `${v[0]}px`)}
            />
          </div>
          <ColorPicker
            color={row.styles?.borderColor || '#000000'}
            onChange={(color) => handleStyleUpdate('borderColor', color)}
            label="Border Color"
          />
        </CollapsibleContent>
      </Collapsible>
      
      <Collapsible open={spacingOpen} onOpenChange={setSpacingOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-2">
            <span className="font-medium">Spacing</span>
            {spacingOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 p-2">
          <SpacingSliders
            marginTop={row.styles?.marginTop}
            marginRight={row.styles?.marginRight}
            marginBottom={row.styles?.marginBottom}
            marginLeft={row.styles?.marginLeft}
            paddingTop={row.styles?.paddingTop}
            paddingRight={row.styles?.paddingRight}
            paddingBottom={row.styles?.paddingBottom}
            paddingLeft={row.styles?.paddingLeft}
            onMarginChange={(property, value) => handleStyleUpdate(property, value)}
            onPaddingChange={(property, value) => handleStyleUpdate(property, value)}
          />
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

// Column Settings Panel (simplified version)
interface ColumnSettingsProps {
  column: PageBuilderColumn;
  onUpdate: (updates: Partial<PageBuilderColumn>) => void;
}

export const ColumnSettings: React.FC<ColumnSettingsProps> = ({ column, onUpdate }) => {
  const [borderOpen, setBorderOpen] = useState(false);
  const [spacingOpen, setSpacingOpen] = useState(false);

  const handleStyleUpdate = (key: string, value: any) => {
    onUpdate({
      styles: {
        ...column.styles,
        [key]: value
      }
    });
  };

  const parsePixelValue = (value?: string): number => {
    if (!value) return 0;
    return Math.min(200, Math.max(0, parseInt(value.replace(/[^0-9]/g, '')) || 0));
  };

  return (
    <div className="p-4 space-y-4">
      <Collapsible open={borderOpen} onOpenChange={setBorderOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-2">
            <span className="font-medium">Border</span>
            {borderOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 p-2">
          <div className="space-y-2">
            <Label>Border Width: {parsePixelValue(column.styles?.borderWidth)}px</Label>
            <Slider
              min={0}
              max={20}
              step={1}
              value={[parsePixelValue(column.styles?.borderWidth)]}
              onValueChange={(v) => handleStyleUpdate('borderWidth', `${v[0]}px`)}
            />
          </div>
          <ColorPicker
            color={column.styles?.borderColor || '#000000'}
            onChange={(color) => handleStyleUpdate('borderColor', color)}
            label="Border Color"
          />
        </CollapsibleContent>
      </Collapsible>
      
      <Collapsible open={spacingOpen} onOpenChange={setSpacingOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-2">
            <span className="font-medium">Spacing</span>
            {spacingOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 p-2">
          <SpacingSliders
            marginTop={column.styles?.marginTop}
            marginRight={column.styles?.marginRight}
            marginBottom={column.styles?.marginBottom}
            marginLeft={column.styles?.marginLeft}
            paddingTop={column.styles?.paddingTop}
            paddingRight={column.styles?.paddingRight}
            paddingBottom={column.styles?.paddingBottom}
            paddingLeft={column.styles?.paddingLeft}
            onMarginChange={(property, value) => handleStyleUpdate(property, value)}
            onPaddingChange={(property, value) => handleStyleUpdate(property, value)}
          />
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};