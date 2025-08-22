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
import { CollapsibleGroup } from './ElementStyles/_shared/CollapsibleGroup';
import { SpacingSliders } from './ElementStyles/_shared/SpacingSliders';
import { BorderControls } from './ElementStyles/_shared/BorderControls';
import { CompactMediaSelector } from './CompactMediaSelector';

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
    effects: false,
    responsive: false,
  });

  const toggleGroup = (groupKey: string) => {
    setOpenGroups(prev => ({ ...prev, [groupKey]: !prev[groupKey] }));
  };

  // Helper functions for height mode management
  const getHeightMode = (styles: any, device: 'desktop' | 'mobile' = 'desktop'): 'auto' | 'viewport' | 'custom' => {
    const deviceStyles = device === 'mobile' ? styles?.responsive?.mobile : styles;
    
    if (!deviceStyles) return 'auto';
    
    if (deviceStyles.minHeight === '100vh') return 'viewport';
    if (deviceStyles.minHeight && deviceStyles.minHeight !== '' && deviceStyles.minHeight !== '100vh') return 'custom';
    return 'auto';
  };

  const applyHeightMode = (mode: 'auto' | 'viewport' | 'custom', device: 'desktop' | 'mobile' = 'desktop') => {
    if (mode === 'auto') {
      if (device === 'mobile') {
        const newResponsive = { ...section.styles?.responsive };
        if (newResponsive.mobile) {
          delete newResponsive.mobile.height;
          delete newResponsive.mobile.minHeight;
          delete newResponsive.mobile.maxHeight;
          if (Object.keys(newResponsive.mobile).length === 0) {
            delete newResponsive.mobile;
          }
        }
        const newStyles = {
          ...section.styles,
          responsive: newResponsive
        };
        
        onUpdate({ styles: newStyles });
      } else {
        const newStyles = { ...section.styles };
        delete newStyles.height;
        delete newStyles.minHeight;
        delete newStyles.maxHeight;
        
        onUpdate({ styles: newStyles });
      }
    } else if (mode === 'viewport') {
      if (device === 'mobile') {
        const newStyles = {
          ...section.styles,
          responsive: {
            ...section.styles?.responsive,
            mobile: {
              ...(section.styles?.responsive?.mobile || {}),
              minHeight: '100vh'
            }
          }
        };
        
        onUpdate({ styles: newStyles });
      } else {
        const newStyles = {
          ...section.styles,
          minHeight: '100vh'
        };
        delete newStyles.height;
        
        onUpdate({ styles: newStyles });
      }
    } else if (mode === 'custom') {
      if (device === 'mobile') {
        const newStyles = {
          ...section.styles,
          responsive: {
            ...section.styles?.responsive,
            mobile: {
              ...(section.styles?.responsive?.mobile || {}),
              minHeight: '50vh'
            }
          }
        };
        
        onUpdate({ styles: newStyles });
      } else {
        const newStyles = {
          ...section.styles,
          minHeight: '50vh'
        };
        delete newStyles.height;
        
        onUpdate({ styles: newStyles });
      }
    }
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

  const handleResponsiveStyleUpdate = (device: 'desktop' | 'mobile', key: string, value: any) => {
    if (value === undefined || value === '') {
      const newResponsive = { ...section.styles?.responsive };
      if (newResponsive[device]) {
        delete newResponsive[device][key];
        if (Object.keys(newResponsive[device]).length === 0) {
          delete newResponsive[device];
        }
      }
      onUpdate({
        styles: {
          ...section.styles,
          responsive: newResponsive
        }
      });
    } else {
      onUpdate({
        styles: {
          ...section.styles,
          responsive: {
            ...section.styles?.responsive,
            [device]: {
              ...(section.styles?.responsive?.[device] || {}),
              [key]: value
            }
          }
        }
      });
    }
  };

  return (
    <div className="p-4 space-y-2">
      <Card>
        <CardHeader className="pb-3">
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

      <div className="space-y-1">
        <CollapsibleGroup
          title="Layout"
          isOpen={openGroups.layout}
          onToggle={() => toggleGroup('layout')}
        >
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
            ) : (
              <Input
                value={section.customWidth || ''}
                onChange={(e) => onUpdate({ customWidth: e.target.value })}
                placeholder="e.g., 1000px, 80%, 100vw"
              />
            )}
          </div>
        </CollapsibleGroup>

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
              value={section.styles?.backgroundGradient || ''}
              onChange={(gradient) => handleStyleUpdate('backgroundGradient', gradient)}
              label="Background Gradient"
            />
            
            <div className="space-y-2">
              <Label>Background Image</Label>
              <CompactMediaSelector
                value={section.styles?.backgroundImage || ''}
                onChange={(url) => handleStyleUpdate('backgroundImage', url)}
                label="Select Background Image"
                maxSize={4}
              />
            </div>
          </div>
        </CollapsibleGroup>

        <CollapsibleGroup
          title="Border"
          isOpen={openGroups.border}
          onToggle={() => toggleGroup('border')}
        >
          <BorderControls
            borderWidth={section.styles?.borderWidth}
            borderColor={section.styles?.borderColor}
            borderRadius={section.styles?.borderRadius}
            onBorderChange={(property, value) => handleStyleUpdate(property, value)}
          />
        </CollapsibleGroup>

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
            onMarginChange={(property, value) => handleStyleUpdate(property, value)}
            onPaddingChange={(property, value) => handleStyleUpdate(property, value)}
          />
        </CollapsibleGroup>

        <CollapsibleGroup
          title="Effects"
          isOpen={openGroups.effects}
          onToggle={() => toggleGroup('effects')}
        >
          <BoxShadowPicker
            value={section.styles?.boxShadow || 'none'}
            onChange={(shadow) => handleStyleUpdate('boxShadow', shadow)}
            label="Box Shadow"
          />
        </CollapsibleGroup>
      </div>
    </div>
  );
};

// Row Settings Panel
interface RowSettingsProps {
  row: PageBuilderRow;
  onUpdate: (updates: Partial<PageBuilderRow>) => void;
}

export const RowSettings: React.FC<RowSettingsProps> = ({ row, onUpdate }) => {
  const [customWidthMode, setCustomWidthMode] = useState(!!row.customWidth);
  const [openGroups, setOpenGroups] = useState({
    layout: true,
    background: false,
    border: false,
    spacing: false,
    effects: false,
    responsive: false,
  });

  const toggleGroup = (groupKey: string) => {
    setOpenGroups(prev => ({ ...prev, [groupKey]: !prev[groupKey] }));
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

  const handleResponsiveStyleUpdate = (device: 'desktop' | 'mobile', key: string, value: any) => {
    if (value === undefined || value === '') {
      const newResponsive = { ...row.styles?.responsive };
      if (newResponsive[device]) {
        delete newResponsive[device][key];
        if (Object.keys(newResponsive[device]).length === 0) {
          delete newResponsive[device];
        }
      }
      onUpdate({
        styles: {
          ...row.styles,
          responsive: newResponsive
        }
      });
    } else {
      onUpdate({
        styles: {
          ...row.styles,
          responsive: {
            ...row.styles?.responsive,
            [device]: {
              ...(row.styles?.responsive?.[device] || {}),
              [key]: value
            }
          }
        }
      });
    }
  };

  return (
    <div className="p-4 space-y-2">
      <Card>
        <CardHeader className="pb-3">
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

      <div className="space-y-1">
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
                onValueChange={(value) => {
                  const columnWidths = COLUMN_LAYOUTS[value as keyof typeof COLUMN_LAYOUTS];
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
                  <SelectItem value="1-1-1">3 Columns (33/33/33)</SelectItem>
                  <SelectItem value="1-2-1">3 Columns (25/50/25)</SelectItem>
                  <SelectItem value="2-1-1">3 Columns (50/25/25)</SelectItem>
                  <SelectItem value="1-1-1-1">4 Columns</SelectItem>
                  <SelectItem value="1-1-1-1-1">5 Columns</SelectItem>
                  <SelectItem value="1-1-1-1-1-1">6 Columns</SelectItem>
                </SelectContent>
              </Select>
            </div>

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
            
            {customWidthMode && (
              <Input
                value={row.customWidth || ''}
                onChange={(e) => onUpdate({ customWidth: e.target.value })}
                placeholder="e.g., 1000px, 80%, 100vw"
              />
            )}
          </div>
        </CollapsibleGroup>

        <CollapsibleGroup
          title="Responsive Overrides"
          isOpen={openGroups.responsive}
          onToggle={() => toggleGroup('responsive')}
        >
          <Tabs defaultValue="desktop" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="desktop">Desktop</TabsTrigger>
              <TabsTrigger value="mobile">Mobile</TabsTrigger>
            </TabsList>
            <TabsContent value="desktop" className="space-y-4">
              <div className="space-y-2">
                <Label>Width (%): <span className="text-muted-foreground">{Math.min(100, Math.max(30, parseInt(String(row.styles?.responsive?.desktop?.width || '').replace(/[^0-9]/g, '')) || 100))}%</span></Label>
                <Slider
                  min={30}
                  max={100}
                  step={1}
                  value={[Math.min(100, Math.max(30, parseInt(String(row.styles?.responsive?.desktop?.width || '').replace(/[^0-9]/g, '')) || 100))]}
                  onValueChange={(v) => handleResponsiveStyleUpdate('desktop', 'width', `${v[0]}%`)}
                />
              </div>
              <div className="space-y-2">
                <Label>Padding (px)</Label>
                <Slider
                  min={0}
                  max={140}
                  step={1}
                  value={[Math.min(140, Math.max(0, parseInt(String(row.styles?.responsive?.desktop?.padding || '').replace(/[^0-9]/g, '')) || 0))]}
                  onValueChange={(v) => handleResponsiveStyleUpdate('desktop', 'padding', `${v[0]}px`)}
                />
                <Input
                  value={row.styles?.responsive?.desktop?.padding || ''}
                  onChange={(e) => handleResponsiveStyleUpdate('desktop', 'padding', e.target.value)}
                  placeholder="Custom e.g., 12px 16px"
                />
              </div>
            </TabsContent>
            <TabsContent value="mobile" className="space-y-4">
              <div className="space-y-2">
                <Label>Width (%): <span className="text-muted-foreground">{Math.min(100, Math.max(30, parseInt(String(row.styles?.responsive?.mobile?.width || '').replace(/[^0-9]/g, '')) || 100))}%</span></Label>
                <Slider
                  min={30}
                  max={100}
                  step={1}
                  value={[Math.min(100, Math.max(30, parseInt(String(row.styles?.responsive?.mobile?.width || '').replace(/[^0-9]/g, '')) || 100))]}
                  onValueChange={(v) => handleResponsiveStyleUpdate('mobile', 'width', `${v[0]}%`)}
                />
              </div>
              <div className="space-y-2">
                <Label>Padding (px)</Label>
                <Slider
                  min={0}
                  max={140}
                  step={1}
                  value={[Math.min(140, Math.max(0, parseInt(String(row.styles?.responsive?.mobile?.padding || '').replace(/[^0-9]/g, '')) || 0))]}
                  onValueChange={(v) => handleResponsiveStyleUpdate('mobile', 'padding', `${v[0]}px`)}
                />
                <Input
                  value={row.styles?.responsive?.mobile?.padding || ''}
                  onChange={(e) => handleResponsiveStyleUpdate('mobile', 'padding', e.target.value)}
                  placeholder="Custom e.g., 12px 16px"
                />
              </div>
            </TabsContent>
          </Tabs>
        </CollapsibleGroup>

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
              value={row.styles?.backgroundGradient || ''}
              onChange={(gradient) => handleStyleUpdate('backgroundGradient', gradient)}
              label="Background Gradient"
            />
            
            <div className="space-y-2">
              <Label>Background Image</Label>
              <CompactMediaSelector
                value={row.styles?.backgroundImage || ''}
                onChange={(url) => handleStyleUpdate('backgroundImage', url)}
                label="Select Background Image"
                maxSize={4}
              />
            </div>
          </div>
        </CollapsibleGroup>

        <CollapsibleGroup
          title="Border"
          isOpen={openGroups.border}
          onToggle={() => toggleGroup('border')}
        >
          <BorderControls
            borderWidth={row.styles?.borderWidth}
            borderColor={row.styles?.borderColor}
            borderRadius={row.styles?.borderRadius}
            onBorderChange={(property, value) => handleStyleUpdate(property, value)}
          />
        </CollapsibleGroup>

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
            onMarginChange={(property, value) => handleStyleUpdate(property, value)}
            onPaddingChange={(property, value) => handleStyleUpdate(property, value)}
          />
        </CollapsibleGroup>

        <CollapsibleGroup
          title="Effects"
          isOpen={openGroups.effects}
          onToggle={() => toggleGroup('effects')}
        >
          <BoxShadowPicker
            value={row.styles?.boxShadow || 'none'}
            onChange={(shadow) => handleStyleUpdate('boxShadow', shadow)}
            label="Box Shadow"
          />
        </CollapsibleGroup>
      </div>
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
    effects: false,
    responsive: false,
  });

  const toggleGroup = (groupKey: string) => {
    setOpenGroups(prev => ({ ...prev, [groupKey]: !prev[groupKey] }));
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

  const handleResponsiveStyleUpdate = (device: 'desktop' | 'mobile', key: string, value: any) => {
    if (value === undefined || value === '') {
      const newResponsive = { ...column.styles?.responsive };
      if (newResponsive[device]) {
        delete newResponsive[device][key];
        if (Object.keys(newResponsive[device]).length === 0) {
          delete newResponsive[device];
        }
      }
      onUpdate({
        styles: {
          ...column.styles,
          responsive: newResponsive
        }
      });
    } else {
      onUpdate({
        styles: {
          ...column.styles,
          responsive: {
            ...column.styles?.responsive,
            [device]: {
              ...(column.styles?.responsive?.[device] || {}),
              [key]: value
            }
          }
        }
      });
    }
  };

  return (
    <div className="p-4 space-y-2">
      <div className="space-y-1">
        <CollapsibleGroup
          title="Layout"
          isOpen={openGroups.layout}
          onToggle={() => toggleGroup('layout')}
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Content Alignment</Label>
              <Select
                value={column.styles?.contentAlignment || 'stretch'}
                onValueChange={(value) => handleStyleUpdate('contentAlignment', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flex-start">Top</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="flex-end">Bottom</SelectItem>
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
              <Label>Content Direction</Label>
              <Select
                value={column.styles?.contentDirection || 'column'}
                onValueChange={(value) => handleStyleUpdate('contentDirection', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="column">Column</SelectItem>
                  <SelectItem value="row">Row</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CollapsibleGroup>

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
              value={column.styles?.backgroundGradient || ''}
              onChange={(gradient) => handleStyleUpdate('backgroundGradient', gradient)}
              label="Background Gradient"
            />
            
            <div className="space-y-2">
              <Label>Background Image</Label>
              <CompactMediaSelector
                value={column.styles?.backgroundImage || ''}
                onChange={(url) => handleStyleUpdate('backgroundImage', url)}
                label="Select Background Image"
                maxSize={4}
              />
            </div>
          </div>
        </CollapsibleGroup>

        <CollapsibleGroup
          title="Border"
          isOpen={openGroups.border}
          onToggle={() => toggleGroup('border')}
        >
          <BorderControls
            borderWidth={column.styles?.borderWidth}
            borderColor={column.styles?.borderColor}
            borderRadius={column.styles?.borderRadius}
            onBorderChange={(property, value) => handleStyleUpdate(property, value)}
          />
        </CollapsibleGroup>

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
            onMarginChange={(property, value) => handleStyleUpdate(property, value)}
            onPaddingChange={(property, value) => handleStyleUpdate(property, value)}
          />
        </CollapsibleGroup>

        <CollapsibleGroup
          title="Effects"
          isOpen={openGroups.effects}
          onToggle={() => toggleGroup('effects')}
        >
          <BoxShadowPicker
            value={column.styles?.boxShadow || 'none'}
            onChange={(shadow) => handleStyleUpdate('boxShadow', shadow)}
            label="Box Shadow"
          />
        </CollapsibleGroup>

        <CollapsibleGroup
          title="Responsive Overrides"
          isOpen={openGroups.responsive}
          onToggle={() => toggleGroup('responsive')}
        >
          <Tabs defaultValue="desktop" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="desktop">Desktop</TabsTrigger>
              <TabsTrigger value="mobile">Mobile</TabsTrigger>
            </TabsList>
            <TabsContent value="desktop" className="space-y-4">
              <div className="space-y-2">
                <Label>Width (%): <span className="text-muted-foreground">{Math.min(100, Math.max(30, parseInt(String(column.styles?.responsive?.desktop?.width || '').replace(/[^0-9]/g, '')) || 100))}%</span></Label>
                <Slider
                  min={30}
                  max={100}
                  step={1}
                  value={[Math.min(100, Math.max(30, parseInt(String(column.styles?.responsive?.desktop?.width || '').replace(/[^0-9]/g, '')) || 100))]}
                  onValueChange={(v) => handleResponsiveStyleUpdate('desktop', 'width', `${v[0]}%`)}
                />
              </div>
              <div className="space-y-2">
                <Label>Padding (px)</Label>
                <Slider
                  min={0}
                  max={140}
                  step={1}
                  value={[Math.min(140, Math.max(0, parseInt(String(column.styles?.responsive?.desktop?.padding || '').replace(/[^0-9]/g, '')) || 0))]}
                  onValueChange={(v) => handleResponsiveStyleUpdate('desktop', 'padding', `${v[0]}px`)}
                />
                <Input
                  value={column.styles?.responsive?.desktop?.padding || ''}
                  onChange={(e) => handleResponsiveStyleUpdate('desktop', 'padding', e.target.value)}
                  placeholder="Custom e.g., 12px 16px"
                />
              </div>
            </TabsContent>
            <TabsContent value="mobile" className="space-y-4">
              <div className="space-y-2">
                <Label>Width (%): <span className="text-muted-foreground">{Math.min(100, Math.max(30, parseInt(String(column.styles?.responsive?.mobile?.width || '').replace(/[^0-9]/g, '')) || 100))}%</span></Label>
                <Slider
                  min={30}
                  max={100}
                  step={1}
                  value={[Math.min(100, Math.max(30, parseInt(String(column.styles?.responsive?.mobile?.width || '').replace(/[^0-9]/g, '')) || 100))]}
                  onValueChange={(v) => handleResponsiveStyleUpdate('mobile', 'width', `${v[0]}%`)}
                />
              </div>
              <div className="space-y-2">
                <Label>Padding (px)</Label>
                <Slider
                  min={0}
                  max={140}
                  step={1}
                  value={[Math.min(140, Math.max(0, parseInt(String(column.styles?.responsive?.mobile?.padding || '').replace(/[^0-9]/g, '')) || 0))]}
                  onValueChange={(v) => handleResponsiveStyleUpdate('mobile', 'padding', `${v[0]}px`)}
                />
                <Input
                  value={column.styles?.responsive?.mobile?.padding || ''}
                  onChange={(e) => handleResponsiveStyleUpdate('mobile', 'padding', e.target.value)}
                  placeholder="Custom e.g., 12px 16px"
                />
              </div>
            </TabsContent>
          </Tabs>
        </CollapsibleGroup>
      </div>
    </div>
  );
};

// Element Settings Panel (simplified placeholder)
export const ElementSettings: React.FC<{ element: PageBuilderElement; onUpdate: (updates: Partial<PageBuilderElement>) => void }> = ({ element, onUpdate }) => {
  return (
    <div className="p-4 text-center text-muted-foreground">
      <p>Element settings not implemented yet</p>
    </div>
  );
};

// Main Settings Panel Component
export const SettingsPanel: React.FC<{
  selectedItem: any;
  onUpdate: (updates: any) => void;
}> = ({ selectedItem, onUpdate }) => {
  if (!selectedItem) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p>Select an element to edit its properties</p>
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