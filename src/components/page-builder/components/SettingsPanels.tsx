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

// Section Settings Panel
interface SectionSettingsProps {
  section: PageBuilderSection;
  onUpdate: (updates: Partial<PageBuilderSection>) => void;
}

export const SectionSettings: React.FC<SectionSettingsProps> = ({ section, onUpdate }) => {
  const [customWidthMode, setCustomWidthMode] = useState(!!section.customWidth);

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
        // Remove mobile overrides completely
        const newResponsive = { ...section.styles?.responsive };
        if (newResponsive.mobile) {
          delete newResponsive.mobile.height;
          delete newResponsive.mobile.minHeight;
          delete newResponsive.mobile.maxHeight;
          // If mobile object is empty, remove it
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
        // Remove desktop styles
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
        // If device object is empty, remove it
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
    <div className="p-4 space-y-6">
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

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Section Layout</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Width Settings */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Width</Label>
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
          </div>

          {/* Height Settings */}
          <Separator className="my-4" />
          <div className="space-y-4">
            <Label className="text-sm font-medium">Height</Label>
            <Tabs defaultValue="desktop" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="desktop">Desktop</TabsTrigger>
                <TabsTrigger value="mobile">Mobile</TabsTrigger>
              </TabsList>
              <TabsContent value="desktop" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="height-preset-desktop">Height Mode</Label>
                  <Select
                    value={getHeightMode(section.styles, 'desktop')}
                    onValueChange={(value: 'auto' | 'viewport' | 'custom') => {
                      applyHeightMode(value, 'desktop');
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto (Content Height)</SelectItem>
                      <SelectItem value="viewport">Full Viewport (100vh)</SelectItem>
                      <SelectItem value="custom">Custom Height</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {section.styles?.minHeight && section.styles.minHeight !== '100vh' && (
                    <div className="space-y-2">
                      <Label htmlFor="custom-height-desktop">Custom Min Height</Label>
                      <Input
                        id="custom-height-desktop"
                        value={section.styles.minHeight}
                        onChange={(e) => handleStyleUpdate('minHeight', e.target.value)}
                        placeholder="e.g., 50vh, 400px"
                      />
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="contentVerticalAlignment-desktop">Content Vertical Position</Label>
                    <Select
                      value={section.styles?.contentVerticalAlignment || 'top'}
                      onValueChange={(value: 'top' | 'center' | 'bottom') => {
                        handleStyleUpdate('contentVerticalAlignment', value);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="top">Top</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="bottom">Bottom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="mobile" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="height-preset-mobile">Height Mode</Label>
                  <Select
                    value={getHeightMode(section.styles, 'mobile')}
                    onValueChange={(value: 'auto' | 'viewport' | 'custom') => {
                      applyHeightMode(value, 'mobile');
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto (Content Height)</SelectItem>
                      <SelectItem value="viewport">Full Viewport (100vh)</SelectItem>
                      <SelectItem value="custom">Custom Height</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {section.styles?.responsive?.mobile?.minHeight && section.styles.responsive.mobile.minHeight !== '100vh' && (
                    <div className="space-y-2">
                      <Label htmlFor="custom-height-mobile">Custom Min Height</Label>
                      <Input
                        id="custom-height-mobile"
                        value={section.styles.responsive.mobile.minHeight}
                        onChange={(e) => handleResponsiveStyleUpdate('mobile', 'minHeight', e.target.value)}
                        placeholder="e.g., 50vh, 400px"
                      />
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="contentVerticalAlignment-mobile">Content Vertical Position</Label>
                    <Select
                      value={section.styles?.responsive?.mobile?.contentVerticalAlignment || 'top'}
                      onValueChange={(value: 'top' | 'center' | 'bottom') => {
                        handleResponsiveStyleUpdate('mobile', 'contentVerticalAlignment', value);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="top">Top</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="bottom">Bottom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Responsive Overrides */}
          <Separator className="my-4" />
          <div className="space-y-4">
            <Label className="text-sm font-medium">Responsive Overrides</Label>
            <Tabs defaultValue="desktop" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="desktop">Desktop</TabsTrigger>
                <TabsTrigger value="mobile">Mobile</TabsTrigger>
              </TabsList>
              <TabsContent value="desktop" className="space-y-4">
                <div className="space-y-2">
                  <Label>Width (%): <span className="text-muted-foreground">{Math.min(100, Math.max(30, parseInt(String(section.styles?.responsive?.desktop?.width || '').replace(/[^0-9]/g, '')) || 100))}%</span></Label>
                  <Slider
                    min={30}
                    max={100}
                    step={1}
                    value={[Math.min(100, Math.max(30, parseInt(String(section.styles?.responsive?.desktop?.width || '').replace(/[^0-9]/g, '')) || 100))]}
                    onValueChange={(v) => handleResponsiveStyleUpdate('desktop', 'width', `${v[0]}%`)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Padding (px)</Label>
                  <Slider
                    min={0}
                    max={140}
                    step={1}
                    value={[Math.min(140, Math.max(0, parseInt(String(section.styles?.responsive?.desktop?.padding || '').replace(/[^0-9]/g, '')) || 0))]}
                    onValueChange={(v) => handleResponsiveStyleUpdate('desktop', 'padding', `${v[0]}px`)}
                  />
                  <Input
                    value={section.styles?.responsive?.desktop?.padding || ''}
                    onChange={(e) => handleResponsiveStyleUpdate('desktop', 'padding', e.target.value)}
                    placeholder="Custom e.g., 12px 16px"
                  />
                </div>
              </TabsContent>
              <TabsContent value="mobile" className="space-y-4">
                <div className="space-y-2">
                  <Label>Width (%): <span className="text-muted-foreground">{Math.min(100, Math.max(30, parseInt(String(section.styles?.responsive?.mobile?.width || '').replace(/[^0-9]/g, '')) || 100))}%</span></Label>
                  <Slider
                    min={30}
                    max={100}
                    step={1}
                    value={[Math.min(100, Math.max(30, parseInt(String(section.styles?.responsive?.mobile?.width || '').replace(/[^0-9]/g, '')) || 100))]}
                    onValueChange={(v) => handleResponsiveStyleUpdate('mobile', 'width', `${v[0]}%`)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Padding (px)</Label>
                  <Slider
                    min={0}
                    max={140}
                    step={1}
                    value={[Math.min(140, Math.max(0, parseInt(String(section.styles?.responsive?.mobile?.padding || '').replace(/[^0-9]/g, '')) || 0))]}
                    onValueChange={(v) => handleResponsiveStyleUpdate('mobile', 'padding', `${v[0]}px`)}
                  />
                  <Input
                    value={section.styles?.responsive?.mobile?.padding || ''}
                    onChange={(e) => handleResponsiveStyleUpdate('mobile', 'padding', e.target.value)}
                    placeholder="Custom e.g., 12px 16px"
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Background</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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

          {section.styles?.backgroundImage && (
            <div className="space-y-2">
              <Label>Background Image Mode</Label>
              <Tabs defaultValue="desktop" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="desktop">Desktop</TabsTrigger>
                  <TabsTrigger value="mobile">Mobile</TabsTrigger>
                </TabsList>
                <TabsContent value="desktop" className="space-y-2">
                  <Select
                    value={section.styles?.backgroundImageMode || 'full-center'}
                    onValueChange={(value: BackgroundImageMode) => handleStyleUpdate('backgroundImageMode', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full-center">Full Center</SelectItem>
                      <SelectItem value="parallax">Parallax</SelectItem>
                      <SelectItem value="fill-width">Fill Width</SelectItem>
                      <SelectItem value="no-repeat">No Repeat</SelectItem>
                      <SelectItem value="repeat">Repeat</SelectItem>
                    </SelectContent>
                  </Select>
                </TabsContent>
                <TabsContent value="mobile" className="space-y-2">
                  <Select
                    value={section.styles?.responsive?.mobile?.backgroundImageMode || section.styles?.backgroundImageMode || 'full-center'}
                    onValueChange={(value: BackgroundImageMode) => handleResponsiveStyleUpdate('mobile', 'backgroundImageMode', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full-center">Full Center</SelectItem>
                      <SelectItem value="parallax">Parallax</SelectItem>
                      <SelectItem value="fill-width">Fill Width</SelectItem>
                      <SelectItem value="no-repeat">No Repeat</SelectItem>
                      <SelectItem value="repeat">Repeat</SelectItem>
                    </SelectContent>
                  </Select>
                </TabsContent>
              </Tabs>
            </div>
          )}
          
          <div className="space-y-2">
            <Label>Color/Gradient Opacity: <span className="text-muted-foreground">{Math.round((section.styles?.backgroundOpacity ?? 1) * 100)}%</span></Label>
            <Slider
              min={0}
              max={1}
              step={0.01}
              value={[section.styles?.backgroundOpacity ?? 1]}
              onValueChange={(value) => handleStyleUpdate('backgroundOpacity', value[0])}
            />
          </div>
          
          <BoxShadowPicker
            value={section.styles?.boxShadow || 'none'}
            onChange={(shadow) => handleStyleUpdate('boxShadow', shadow)}
            label="Box Shadow"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Spacing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label className="text-sm font-medium">Padding</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-muted-foreground">Top</Label>
                <Input
                  value={section.styles?.paddingTop || ''}
                  onChange={(e) => handleStyleUpdate('paddingTop', e.target.value)}
                  placeholder="0px"
                  className="h-8"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Right</Label>
                <Input
                  value={section.styles?.paddingRight || ''}
                  onChange={(e) => handleStyleUpdate('paddingRight', e.target.value)}
                  placeholder="0px"
                  className="h-8"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Bottom</Label>
                <Input
                  value={section.styles?.paddingBottom || ''}
                  onChange={(e) => handleStyleUpdate('paddingBottom', e.target.value)}
                  placeholder="0px"
                  className="h-8"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Left</Label>
                <Input
                  value={section.styles?.paddingLeft || ''}
                  onChange={(e) => handleStyleUpdate('paddingLeft', e.target.value)}
                  placeholder="0px"
                  className="h-8"
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <Label className="text-sm font-medium">Margin</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-muted-foreground">Top</Label>
                <Input
                  value={section.styles?.marginTop || ''}
                  onChange={(e) => handleStyleUpdate('marginTop', e.target.value)}
                  placeholder="0px"
                  className="h-8"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Right</Label>
                <Input
                  value={section.styles?.marginRight || ''}
                  onChange={(e) => handleStyleUpdate('marginRight', e.target.value)}
                  placeholder="0px"
                  className="h-8"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Bottom</Label>
                <Input
                  value={section.styles?.marginBottom || ''}
                  onChange={(e) => handleStyleUpdate('marginBottom', e.target.value)}
                  placeholder="0px"
                  className="h-8"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Left</Label>
                <Input
                  value={section.styles?.marginLeft || ''}
                  onChange={(e) => handleStyleUpdate('marginLeft', e.target.value)}
                  placeholder="0px"
                  className="h-8"
                />
              </div>
            </div>
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
  const [customWidthMode, setCustomWidthMode] = useState(!!row.customWidth);

  const handleStyleUpdate = (key: string, value: any) => {
    onUpdate({
      styles: {
        ...row.styles,
        [key]: value
      }
    });
  };

  const handleResponsiveStyleUpdate = (device: 'desktop' | 'mobile', key: string, value: any) => {
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
  };

  return (
    <div className="p-4 space-y-6">
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

          <Separator className="my-4" />
          
          <div className="space-y-4">
            <Label className="text-sm font-medium">Responsive Overrides</Label>
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
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Background</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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

          {row.styles?.backgroundImage && (
            <div className="space-y-2">
              <Label>Background Image Mode</Label>
              <Tabs defaultValue="desktop" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="desktop">Desktop</TabsTrigger>
                  <TabsTrigger value="mobile">Mobile</TabsTrigger>
                </TabsList>
                <TabsContent value="desktop" className="space-y-2">
                  <Select
                    value={row.styles?.backgroundImageMode || 'full-center'}
                    onValueChange={(value: BackgroundImageMode) => handleStyleUpdate('backgroundImageMode', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full-center">Full Center</SelectItem>
                      <SelectItem value="parallax">Parallax</SelectItem>
                      <SelectItem value="fill-width">Fill Width</SelectItem>
                      <SelectItem value="no-repeat">No Repeat</SelectItem>
                      <SelectItem value="repeat">Repeat</SelectItem>
                    </SelectContent>
                  </Select>
                </TabsContent>
                <TabsContent value="mobile" className="space-y-2">
                  <Select
                    value={row.styles?.responsive?.mobile?.backgroundImageMode || row.styles?.backgroundImageMode || 'full-center'}
                    onValueChange={(value: BackgroundImageMode) => handleResponsiveStyleUpdate('mobile', 'backgroundImageMode', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full-center">Full Center</SelectItem>
                      <SelectItem value="parallax">Parallax</SelectItem>
                      <SelectItem value="fill-width">Fill Width</SelectItem>
                      <SelectItem value="no-repeat">No Repeat</SelectItem>
                      <SelectItem value="repeat">Repeat</SelectItem>
                    </SelectContent>
                  </Select>
                </TabsContent>
              </Tabs>
            </div>
          )}
          
          <div className="space-y-2">
            <Label>Color/Gradient Opacity: <span className="text-muted-foreground">{Math.round((row.styles?.backgroundOpacity ?? 1) * 100)}%</span></Label>
            <Slider
              min={0}
              max={1}
              step={0.01}
              value={[row.styles?.backgroundOpacity ?? 1]}
              onValueChange={(value) => handleStyleUpdate('backgroundOpacity', value[0])}
            />
          </div>
          
          <BoxShadowPicker
            value={row.styles?.boxShadow || 'none'}
            onChange={(shadow) => handleStyleUpdate('boxShadow', shadow)}
            label="Box Shadow"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Spacing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label className="text-sm font-medium">Padding</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-muted-foreground">Top</Label>
                <Input
                  value={row.styles?.paddingTop || ''}
                  onChange={(e) => handleStyleUpdate('paddingTop', e.target.value)}
                  placeholder="0px"
                  className="h-8"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Right</Label>
                <Input
                  value={row.styles?.paddingRight || ''}
                  onChange={(e) => handleStyleUpdate('paddingRight', e.target.value)}
                  placeholder="0px"
                  className="h-8"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Bottom</Label>
                <Input
                  value={row.styles?.paddingBottom || ''}
                  onChange={(e) => handleStyleUpdate('paddingBottom', e.target.value)}
                  placeholder="0px"
                  className="h-8"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Left</Label>
                <Input
                  value={row.styles?.paddingLeft || ''}
                  onChange={(e) => handleStyleUpdate('paddingLeft', e.target.value)}
                  placeholder="0px"
                  className="h-8"
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <Label className="text-sm font-medium">Margin</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-muted-foreground">Top</Label>
                <Input
                  value={row.styles?.marginTop || ''}
                  onChange={(e) => handleStyleUpdate('marginTop', e.target.value)}
                  placeholder="0px"
                  className="h-8"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Right</Label>
                <Input
                  value={row.styles?.marginRight || ''}
                  onChange={(e) => handleStyleUpdate('marginRight', e.target.value)}
                  placeholder="0px"
                  className="h-8"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Bottom</Label>
                <Input
                  value={row.styles?.marginBottom || ''}
                  onChange={(e) => handleStyleUpdate('marginBottom', e.target.value)}
                  placeholder="0px"
                  className="h-8"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Left</Label>
                <Input
                  value={row.styles?.marginLeft || ''}
                  onChange={(e) => handleStyleUpdate('marginLeft', e.target.value)}
                  placeholder="0px"
                  className="h-8"
                />
              </div>
            </div>
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
  const [customWidthMode, setCustomWidthMode] = useState(!!column.customWidth);

  const handleStyleUpdate = (key: string, value: any) => {
    onUpdate({
      styles: {
        ...column.styles,
        [key]: value
      }
    });
  };

  const handleResponsiveStyleUpdate = (device: 'desktop' | 'mobile', key: string, value: any) => {
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
  };

  return (
    <div className="p-4 space-y-6">
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
          
          <Separator className="my-4" />
          
          <div className="space-y-4">
            <Label className="text-sm font-medium">Responsive Overrides</Label>
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
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Background</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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

          {column.styles?.backgroundImage && (
            <div className="space-y-2">
              <Label>Background Image Mode</Label>
              <Tabs defaultValue="desktop" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="desktop">Desktop</TabsTrigger>
                  <TabsTrigger value="mobile">Mobile</TabsTrigger>
                </TabsList>
                <TabsContent value="desktop" className="space-y-2">
                  <Select
                    value={column.styles?.backgroundImageMode || 'full-center'}
                    onValueChange={(value: BackgroundImageMode) => handleStyleUpdate('backgroundImageMode', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full-center">Full Center</SelectItem>
                      <SelectItem value="parallax">Parallax</SelectItem>
                      <SelectItem value="fill-width">Fill Width</SelectItem>
                      <SelectItem value="no-repeat">No Repeat</SelectItem>
                      <SelectItem value="repeat">Repeat</SelectItem>
                    </SelectContent>
                  </Select>
                </TabsContent>
                <TabsContent value="mobile" className="space-y-2">
                  <Select
                    value={column.styles?.responsive?.mobile?.backgroundImageMode || column.styles?.backgroundImageMode || 'full-center'}
                    onValueChange={(value: BackgroundImageMode) => handleResponsiveStyleUpdate('mobile', 'backgroundImageMode', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full-center">Full Center</SelectItem>
                      <SelectItem value="parallax">Parallax</SelectItem>
                      <SelectItem value="fill-width">Fill Width</SelectItem>
                      <SelectItem value="no-repeat">No Repeat</SelectItem>
                      <SelectItem value="repeat">Repeat</SelectItem>
                    </SelectContent>
                  </Select>
                </TabsContent>
              </Tabs>
            </div>
          )}
          
          <div className="space-y-2">
            <Label>Color/Gradient Opacity: <span className="text-muted-foreground">{Math.round((column.styles?.backgroundOpacity ?? 1) * 100)}%</span></Label>
            <Slider
              min={0}
              max={1}
              step={0.01}
              value={[column.styles?.backgroundOpacity ?? 1]}
              onValueChange={(value) => handleStyleUpdate('backgroundOpacity', value[0])}
            />
          </div>
          
          <BoxShadowPicker
            value={column.styles?.boxShadow || 'none'}
            onChange={(shadow) => handleStyleUpdate('boxShadow', shadow)}
            label="Box Shadow"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Spacing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label className="text-sm font-medium">Padding</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-muted-foreground">Top</Label>
                <Input
                  value={column.styles?.paddingTop || ''}
                  onChange={(e) => handleStyleUpdate('paddingTop', e.target.value)}
                  placeholder="0px"
                  className="h-8"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Right</Label>
                <Input
                  value={column.styles?.paddingRight || ''}
                  onChange={(e) => handleStyleUpdate('paddingRight', e.target.value)}
                  placeholder="0px"
                  className="h-8"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Bottom</Label>
                <Input
                  value={column.styles?.paddingBottom || ''}
                  onChange={(e) => handleStyleUpdate('paddingBottom', e.target.value)}
                  placeholder="0px"
                  className="h-8"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Left</Label>
                <Input
                  value={column.styles?.paddingLeft || ''}
                  onChange={(e) => handleStyleUpdate('paddingLeft', e.target.value)}
                  placeholder="0px"
                  className="h-8"
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <Label className="text-sm font-medium">Margin</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-muted-foreground">Top</Label>
                <Input
                  value={column.styles?.marginTop || ''}
                  onChange={(e) => handleStyleUpdate('marginTop', e.target.value)}
                  placeholder="0px"
                  className="h-8"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Right</Label>
                <Input
                  value={column.styles?.marginRight || ''}
                  onChange={(e) => handleStyleUpdate('marginRight', e.target.value)}
                  placeholder="0px"
                  className="h-8"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Bottom</Label>
                <Input
                  value={column.styles?.marginBottom || ''}
                  onChange={(e) => handleStyleUpdate('marginBottom', e.target.value)}
                  placeholder="0px"
                  className="h-8"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Left</Label>
                <Input
                  value={column.styles?.marginLeft || ''}
                  onChange={(e) => handleStyleUpdate('marginLeft', e.target.value)}
                  placeholder="0px"
                  className="h-8"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>


      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Content Layout</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="content-direction">Content Direction</Label>
            <Select
              value={column.styles?.contentDirection || 'column'}
              onValueChange={(value) => handleStyleUpdate('contentDirection', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="column">Vertical (Column)</SelectItem>
                <SelectItem value="row">Horizontal (Row)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content-alignment">Content Alignment</Label>
            <Select
              value={column.styles?.contentAlignment || 'normal'}
              onValueChange={(value) => handleStyleUpdate('contentAlignment', value === 'normal' ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select alignment..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Default</SelectItem>
                <SelectItem value="flex-start">Start</SelectItem>
                <SelectItem value="center">Center</SelectItem>
                <SelectItem value="flex-end">End</SelectItem>
                <SelectItem value="stretch">Stretch</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content-justification">Content Distribution</Label>
            <Select
              value={column.styles?.contentJustification || 'normal'}
              onValueChange={(value) => handleStyleUpdate('contentJustification', value === 'normal' ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select distribution..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Default</SelectItem>
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
            <Label htmlFor="content-gap">Content Gap</Label>
            <Input
              id="content-gap"
              value={column.styles?.contentGap || ''}
              onChange={(e) => handleStyleUpdate('contentGap', e.target.value)}
              placeholder="e.g., 16px, 1rem, 2%"
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
