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
import { ChevronDown, ChevronRight, RotateCcw } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CompactMediaSelector } from './CompactMediaSelector';
import { CollapsibleGroup } from './ElementStyles/_shared/CollapsibleGroup';
import { SpacingSliders } from './ElementStyles/_shared/SpacingSliders';
import { ResponsiveSpacingSliders } from './ElementStyles/_shared/ResponsiveSpacingSliders';
import { getEffectiveResponsiveValue, hasResponsiveOverride, getInheritanceSource, getInheritanceLabel, clearResponsiveOverride } from '../utils/responsiveHelpers';
import { useDevicePreview } from '../contexts/DevicePreviewContext';

// Section Settings Panel
interface SectionSettingsProps {
  section: PageBuilderSection;
  onUpdate: (updates: Partial<PageBuilderSection>) => void;
}

export const SectionSettings: React.FC<SectionSettingsProps> = ({ section, onUpdate }) => {
  const { setDeviceType } = useDevicePreview();
  const [customWidthMode, setCustomWidthMode] = useState(!!section.customWidth);
  const [openCards, setOpenCards] = useState({
    anchor: false,
    layout: false,
    background: false,
    border: false,
    spacing: false,
    sticky: false
  });

  // Helper functions for device-aware spacing conversion
  const parsePixelValue = (value: string | undefined): number => {
    if (!value) return 0;
    return parseInt(value.replace('px', '')) || 0;
  };

  const getCurrentSpacingByDevice = () => {
    const marginByDevice = section.styles?.marginByDevice || {
      desktop: { top: 0, right: 0, bottom: 0, left: 0 },
      tablet: { top: 0, right: 0, bottom: 0, left: 0 },
      mobile: { top: 0, right: 0, bottom: 0, left: 0 }
    };
    
    const paddingByDevice = section.styles?.paddingByDevice || {
      desktop: { top: 0, right: 0, bottom: 0, left: 0 },
      tablet: { top: 0, right: 0, bottom: 0, left: 0 },
      mobile: { top: 0, right: 0, bottom: 0, left: 0 }
    };

    // Convert legacy spacing to device-aware if needed
    if (!section.styles?.marginByDevice && (section.styles?.marginTop || section.styles?.marginRight || section.styles?.marginBottom || section.styles?.marginLeft)) {
      marginByDevice.desktop = {
        top: parsePixelValue(section.styles?.marginTop),
        right: parsePixelValue(section.styles?.marginRight),
        bottom: parsePixelValue(section.styles?.marginBottom),
        left: parsePixelValue(section.styles?.marginLeft)
      };
    }

    if (!section.styles?.paddingByDevice && (section.styles?.paddingTop || section.styles?.paddingRight || section.styles?.paddingBottom || section.styles?.paddingLeft)) {
      paddingByDevice.desktop = {
        top: parsePixelValue(section.styles?.paddingTop),
        right: parsePixelValue(section.styles?.paddingRight),
        bottom: parsePixelValue(section.styles?.paddingBottom),
        left: parsePixelValue(section.styles?.paddingLeft)
      };
    }

    return { marginByDevice, paddingByDevice };
  };

  const handleMarginChange = (device: 'desktop' | 'tablet' | 'mobile', property: 'top' | 'right' | 'bottom' | 'left', value: number) => {
    const { marginByDevice } = getCurrentSpacingByDevice();
    const updated = { ...marginByDevice };
    updated[device] = { ...updated[device], [property]: value };
    handleStyleUpdate('marginByDevice', updated);
  };

  const handlePaddingChange = (device: 'desktop' | 'tablet' | 'mobile', property: 'top' | 'right' | 'bottom' | 'left', value: number) => {
    const { paddingByDevice } = getCurrentSpacingByDevice();
    const updated = { ...paddingByDevice };
    updated[device] = { ...updated[device], [property]: value };
    handleStyleUpdate('paddingByDevice', updated);
  };
  const getSectionEffectiveWidth = (deviceType: 'desktop' | 'tablet' | 'mobile'): string => {
    const responsiveStyles = section.styles?.responsive;
    if (!responsiveStyles) return '100%';

    const currentValue = responsiveStyles[deviceType]?.width;
    if (currentValue !== undefined && currentValue !== null && currentValue !== '') {
      return currentValue;
    }

    if (deviceType === 'mobile') {
      const tabletValue = responsiveStyles.tablet?.width;
      if (tabletValue !== undefined && tabletValue !== null && tabletValue !== '') {
        return tabletValue;
      }
    }
    
    if (deviceType === 'mobile' || deviceType === 'tablet') {
      const desktopValue = responsiveStyles.desktop?.width;
      if (desktopValue !== undefined && desktopValue !== null && desktopValue !== '') {
        return desktopValue;
      }
    }

    return section.styles?.width || '100%';
  };

  const hasSectionWidthOverride = (deviceType: 'desktop' | 'tablet' | 'mobile'): boolean => {
    const responsiveStyles = section.styles?.responsive;
    if (!responsiveStyles) return false;
    const value = responsiveStyles[deviceType]?.width;
    return value !== undefined && value !== null && value !== '';
  };

  const getSectionInheritanceLabel = (deviceType: 'desktop' | 'tablet' | 'mobile'): string => {
    const responsiveStyles = section.styles?.responsive;
    if (!responsiveStyles) {
      return section.styles?.width ? 'Base Style' : '';
    }

    const currentValue = responsiveStyles[deviceType]?.width;
    if (currentValue !== undefined && currentValue !== null && currentValue !== '') {
      return '';
    }

    if (deviceType === 'mobile') {
      const tabletValue = responsiveStyles.tablet?.width;
      if (tabletValue !== undefined && tabletValue !== null && tabletValue !== '') {
        return 'Inherited from Tablet';
      }
    }
    
    if (deviceType === 'mobile' || deviceType === 'tablet') {
      const desktopValue = responsiveStyles.desktop?.width;
      if (desktopValue !== undefined && desktopValue !== null && desktopValue !== '') {
        return 'Inherited from Desktop';
      }
    }

    if (section.styles?.width) {
      return 'Base Style';
    }

    return '';
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

  const handleResponsiveStyleUpdate = (device: 'desktop' | 'tablet' | 'mobile', key: string, value: any) => {
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
      <CollapsibleGroup
        title="Anchor"
        isOpen={openCards.anchor}
        onToggle={(isOpen) => setOpenCards(prev => ({ ...prev, anchor: isOpen }))}
      >
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Input readOnly value={section.anchor || ''} />
            <Button size="sm" onClick={() => section.anchor && navigator.clipboard.writeText(section.anchor)}>Copy</Button>
          </div>
          <p className="text-xs text-muted-foreground">Use #{section.anchor} for in-page scrolling</p>
        </div>
      </CollapsibleGroup>

      <CollapsibleGroup
        title="Section Layout"
        isOpen={openCards.layout}
        onToggle={(isOpen) => setOpenCards(prev => ({ ...prev, layout: isOpen }))}
      >
        <div className="space-y-6">
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
            <Tabs defaultValue="desktop" className="w-full" onValueChange={(value) => setDeviceType(value as 'desktop' | 'tablet' | 'mobile')}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="desktop">Desktop</TabsTrigger>
                <TabsTrigger value="tablet">Tablet</TabsTrigger>
                <TabsTrigger value="mobile">Mobile</TabsTrigger>
              </TabsList>
              <TabsContent value="desktop" className="space-y-4">
                <div className="space-y-2">
                  {(() => {
                    const effectiveValue = getSectionEffectiveWidth('desktop');
                    const hasOverride = hasSectionWidthOverride('desktop');
                    const inheritanceLabel = getSectionInheritanceLabel('desktop');
                    const widthValue = Math.min(100, Math.max(30, parseInt(String(effectiveValue).replace(/[^0-9]/g, '')) || 100));
                    
                    return (
                      <>
                        <div className="flex items-center justify-between">
                          <Label>Width (%): <span className="text-muted-foreground">{widthValue}%</span></Label>
                          {hasOverride && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleResponsiveStyleUpdate('desktop', 'width', '')}
                              className="h-6 w-6 p-0"
                            >
                              <RotateCcw className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        {inheritanceLabel && (
                          <p className="text-xs text-muted-foreground">{inheritanceLabel}</p>
                        )}
                        <Slider
                          min={30}
                          max={100}
                          step={1}
                          value={[widthValue]}
                          onValueChange={(v) => handleResponsiveStyleUpdate('desktop', 'width', `${v[0]}%`)}
                        />
                      </>
                    );
                  })()}
                </div>
              </TabsContent>
              <TabsContent value="tablet" className="space-y-4">
                <div className="space-y-2">
                  {(() => {
                    const effectiveValue = getSectionEffectiveWidth('tablet');
                    const hasOverride = hasSectionWidthOverride('tablet');
                    const inheritanceLabel = getSectionInheritanceLabel('tablet');
                    const widthValue = Math.min(100, Math.max(30, parseInt(String(effectiveValue).replace(/[^0-9]/g, '')) || 100));
                    
                    return (
                      <>
                        <div className="flex items-center justify-between">
                          <Label>Width (%): <span className="text-muted-foreground">{widthValue}%</span></Label>
                          {hasOverride && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleResponsiveStyleUpdate('tablet', 'width', '')}
                              className="h-6 w-6 p-0"
                            >
                              <RotateCcw className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        {inheritanceLabel && (
                          <p className="text-xs text-muted-foreground">{inheritanceLabel}</p>
                        )}
                        <Slider
                          min={30}
                          max={100}
                          step={1}
                          value={[widthValue]}
                          onValueChange={(v) => handleResponsiveStyleUpdate('tablet', 'width', `${v[0]}%`)}
                        />
                      </>
                    );
                  })()}
                </div>
              </TabsContent>
              <TabsContent value="mobile" className="space-y-4">
                <div className="space-y-2">
                  {(() => {
                    const effectiveValue = getSectionEffectiveWidth('mobile');
                    const hasOverride = hasSectionWidthOverride('mobile');
                    const inheritanceLabel = getSectionInheritanceLabel('mobile');
                    const widthValue = Math.min(100, Math.max(30, parseInt(String(effectiveValue).replace(/[^0-9]/g, '')) || 100));
                    
                    return (
                      <>
                        <div className="flex items-center justify-between">
                          <Label>Width (%): <span className="text-muted-foreground">{widthValue}%</span></Label>
                          {hasOverride && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleResponsiveStyleUpdate('mobile', 'width', '')}
                              className="h-6 w-6 p-0"
                            >
                              <RotateCcw className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        {inheritanceLabel && (
                          <p className="text-xs text-muted-foreground">{inheritanceLabel}</p>
                        )}
                        <Slider
                          min={30}
                          max={100}
                          step={1}
                          value={[widthValue]}
                          onValueChange={(v) => handleResponsiveStyleUpdate('mobile', 'width', `${v[0]}%`)}
                        />
                      </>
                    );
                  })()}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </CollapsibleGroup>

      <CollapsibleGroup
        title="Background"
        isOpen={openCards.background}
        onToggle={(isOpen) => setOpenCards(prev => ({ ...prev, background: isOpen }))}
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
            <Label>Overlay Opacity: <span className="text-muted-foreground">{Math.round((section.styles?.backgroundOpacity || 1) * 100)}%</span></Label>
            <p className="text-xs text-muted-foreground">Controls color/gradient opacity only. Background image is unaffected.</p>
            <Slider
              min={0}
              max={100}
              step={1}
              value={[Math.round((section.styles?.backgroundOpacity || 1) * 100)]}
              onValueChange={(v) => handleStyleUpdate('backgroundOpacity', v[0] / 100)}
            />
          </div>

          <BoxShadowPicker
            value={section.styles?.boxShadow || 'none'}
            onChange={(shadow) => handleStyleUpdate('boxShadow', shadow)}
            label="Box Shadow"
          />
        </div>
      </CollapsibleGroup>

      <CollapsibleGroup
        title="Spacing"
        isOpen={openCards.spacing}
        onToggle={(isOpen) => setOpenCards(prev => ({ ...prev, spacing: isOpen }))}
      >
        <ResponsiveSpacingSliders
          marginByDevice={getCurrentSpacingByDevice().marginByDevice}
          paddingByDevice={getCurrentSpacingByDevice().paddingByDevice}
          onMarginChange={handleMarginChange}
          onPaddingChange={handlePaddingChange}
        />
      </CollapsibleGroup>

      {/* Border */}
      <CollapsibleGroup
        title="Border"
        isOpen={openCards.border}
        onToggle={() => setOpenCards(prev => ({ ...prev, border: !prev.border }))}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-sm">Width</Label>
              <Input
                value={section.styles?.borderWidth || ''}
                onChange={(e) => handleStyleUpdate('borderWidth', e.target.value)}
                placeholder="0px"
                className="h-8"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Style</Label>
              <Select
                value={section.styles?.borderStyle || 'solid'}
                onValueChange={(value) => handleStyleUpdate('borderStyle', value)}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="solid">Solid</SelectItem>
                  <SelectItem value="dashed">Dashed</SelectItem>
                  <SelectItem value="dotted">Dotted</SelectItem>
                  <SelectItem value="double">Double</SelectItem>
                  <SelectItem value="groove">Groove</SelectItem>
                  <SelectItem value="ridge">Ridge</SelectItem>
                  <SelectItem value="inset">Inset</SelectItem>
                  <SelectItem value="outset">Outset</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm">Color</Label>
            <ColorPicker
              color={section.styles?.borderColor || '#000000'}
              onChange={(color) => handleStyleUpdate('borderColor', color)}
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm">Radius</Label>
            <Input
              value={section.styles?.borderRadius || ''}
              onChange={(e) => handleStyleUpdate('borderRadius', e.target.value)}
              placeholder="0px"
              className="h-8"
            />
          </div>
        </div>
      </CollapsibleGroup>

      <CollapsibleGroup
        title="Sticky Position"
        isOpen={openCards.sticky}
        onToggle={(isOpen) => setOpenCards(prev => ({ ...prev, sticky: isOpen }))}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Switch 
                checked={section.styles?.stickyPosition !== 'none' && section.styles?.stickyPosition !== undefined}
                onCheckedChange={(checked) => {
                  if (checked) {
                    handleStyleUpdate('stickyPosition', 'top');
                    handleStyleUpdate('stickyOffset', '0px');
                  } else {
                    handleStyleUpdate('stickyPosition', 'none');
                    handleStyleUpdate('stickyOffset', undefined);
                  }
                }}
              />
              <Label className="text-sm">Enable Sticky Positioning</Label>
            </div>
          </div>
          
          {section.styles?.stickyPosition !== 'none' && section.styles?.stickyPosition !== undefined && (
            <>
              <div className="space-y-2">
                <Label className="text-sm">Position</Label>
                <Select
                  value={section.styles?.stickyPosition || 'top'}
                  onValueChange={(value: 'top' | 'bottom') => handleStyleUpdate('stickyPosition', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="top">Top of Page</SelectItem>
                    <SelectItem value="bottom">Bottom of Page</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm">Offset from Edge</Label>
                <Input
                  value={section.styles?.stickyOffset || '0px'}
                  onChange={(e) => handleStyleUpdate('stickyOffset', e.target.value)}
                  placeholder="0px"
                  className="h-8"
                />
                <p className="text-xs text-muted-foreground">
                  Distance from the edge of the viewport (e.g., "0px", "20px", "10vh")
                </p>
              </div>
            </>
          )}
        </div>
      </CollapsibleGroup>
    </div>
  );
};

// Row Settings Panel
interface RowSettingsProps {
  row: PageBuilderRow;
  onUpdate: (updates: Partial<PageBuilderRow>) => void;
}

export const RowSettings: React.FC<RowSettingsProps> = ({ row, onUpdate }) => {
  const { setDeviceType } = useDevicePreview();
  const [customWidthMode, setCustomWidthMode] = useState(!!row.customWidth);
  const [openCards, setOpenCards] = useState({
    anchor: false,
    layout: false,
    background: false,
    border: false,
    spacing: false
  });

  // Helper functions for device-aware spacing conversion
  const parsePixelValue = (value: string | undefined): number => {
    if (!value) return 0;
    return parseInt(value.replace('px', '')) || 0;
  };

  const getCurrentSpacingByDevice = () => {
    const marginByDevice = row.styles?.marginByDevice || {
      desktop: { top: 0, right: 0, bottom: 0, left: 0 },
      tablet: { top: 0, right: 0, bottom: 0, left: 0 },
      mobile: { top: 0, right: 0, bottom: 0, left: 0 }
    };
    
    const paddingByDevice = row.styles?.paddingByDevice || {
      desktop: { top: 0, right: 0, bottom: 0, left: 0 },
      tablet: { top: 0, right: 0, bottom: 0, left: 0 },
      mobile: { top: 0, right: 0, bottom: 0, left: 0 }
    };

    // Convert legacy spacing to device-aware if needed
    if (!row.styles?.marginByDevice && (row.styles?.marginTop || row.styles?.marginRight || row.styles?.marginBottom || row.styles?.marginLeft)) {
      marginByDevice.desktop = {
        top: parsePixelValue(row.styles?.marginTop),
        right: parsePixelValue(row.styles?.marginRight),
        bottom: parsePixelValue(row.styles?.marginBottom),
        left: parsePixelValue(row.styles?.marginLeft)
      };
    }

    if (!row.styles?.paddingByDevice && (row.styles?.paddingTop || row.styles?.paddingRight || row.styles?.paddingBottom || row.styles?.paddingLeft)) {
      paddingByDevice.desktop = {
        top: parsePixelValue(row.styles?.paddingTop),
        right: parsePixelValue(row.styles?.paddingRight),
        bottom: parsePixelValue(row.styles?.paddingBottom),
        left: parsePixelValue(row.styles?.paddingLeft)
      };
    }

    return { marginByDevice, paddingByDevice };
  };

  const handleMarginChange = (device: 'desktop' | 'tablet' | 'mobile', property: 'top' | 'right' | 'bottom' | 'left', value: number) => {
    const { marginByDevice } = getCurrentSpacingByDevice();
    const updated = { ...marginByDevice };
    updated[device] = { ...updated[device], [property]: value };
    onUpdate({ styles: { ...row.styles, marginByDevice: updated } });
  };

  const handlePaddingChange = (device: 'desktop' | 'tablet' | 'mobile', property: 'top' | 'right' | 'bottom' | 'left', value: number) => {
    const { paddingByDevice } = getCurrentSpacingByDevice();
    const updated = { ...paddingByDevice };
    updated[device] = { ...updated[device], [property]: value };
    onUpdate({ styles: { ...row.styles, paddingByDevice: updated } });
  };

  // Helper functions for responsive width handling specific to rows
  const getRowEffectiveWidth = (deviceType: 'desktop' | 'tablet' | 'mobile'): string => {
    const responsiveStyles = row.styles?.responsive;
    if (!responsiveStyles) return '100%';

    const currentValue = responsiveStyles[deviceType]?.width;
    if (currentValue !== undefined && currentValue !== null && currentValue !== '') {
      return currentValue;
    }

    if (deviceType === 'mobile') {
      const tabletValue = responsiveStyles.tablet?.width;
      if (tabletValue !== undefined && tabletValue !== null && tabletValue !== '') {
        return tabletValue;
      }
    }
    
    if (deviceType === 'mobile' || deviceType === 'tablet') {
      const desktopValue = responsiveStyles.desktop?.width;
      if (desktopValue !== undefined && desktopValue !== null && desktopValue !== '') {
        return desktopValue;
      }
    }

    return row.styles?.width || '100%';
  };

  const hasRowWidthOverride = (deviceType: 'desktop' | 'tablet' | 'mobile'): boolean => {
    const responsiveStyles = row.styles?.responsive;
    if (!responsiveStyles) return false;
    const value = responsiveStyles[deviceType]?.width;
    return value !== undefined && value !== null && value !== '';
  };

  const getRowInheritanceLabel = (deviceType: 'desktop' | 'tablet' | 'mobile'): string => {
    const responsiveStyles = row.styles?.responsive;
    if (!responsiveStyles) {
      return row.styles?.width ? 'Base Style' : '';
    }

    const currentValue = responsiveStyles[deviceType]?.width;
    if (currentValue !== undefined && currentValue !== null && currentValue !== '') {
      return '';
    }

    if (deviceType === 'mobile') {
      const tabletValue = responsiveStyles.tablet?.width;
      if (tabletValue !== undefined && tabletValue !== null && tabletValue !== '') {
        return 'Inherited from Tablet';
      }
    }
    
    if (deviceType === 'mobile' || deviceType === 'tablet') {
      const desktopValue = responsiveStyles.desktop?.width;
      if (desktopValue !== undefined && desktopValue !== null && desktopValue !== '') {
        return 'Inherited from Desktop';
      }
    }

    if (row.styles?.width) {
      return 'Base Style';
    }

    return '';
  };

  const handleStyleUpdate = (key: string, value: any) => {
    onUpdate({
      styles: {
        ...row.styles,
        [key]: value
      }
    });
  };

  const handleResponsiveStyleUpdate = (device: 'desktop' | 'tablet' | 'mobile', key: string, value: any) => {
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
      <CollapsibleGroup
        title="Anchor"
        isOpen={openCards.anchor}
        onToggle={(isOpen) => setOpenCards(prev => ({ ...prev, anchor: isOpen }))}
      >
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Input readOnly value={row.anchor || ''} />
            <Button size="sm" onClick={() => row.anchor && navigator.clipboard.writeText(row.anchor)}>Copy</Button>
          </div>
          <p className="text-xs text-muted-foreground">Use #{row.anchor} for in-page scrolling</p>
        </div>
      </CollapsibleGroup>

      <CollapsibleGroup
        title="Row Layout"
        isOpen={openCards.layout}
        onToggle={(isOpen) => setOpenCards(prev => ({ ...prev, layout: isOpen }))}
      >
        <div className="space-y-4">
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
            <Tabs defaultValue="desktop" className="w-full" onValueChange={(value) => setDeviceType(value as 'desktop' | 'tablet' | 'mobile')}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="desktop">Desktop</TabsTrigger>
                <TabsTrigger value="tablet">Tablet</TabsTrigger>
                <TabsTrigger value="mobile">Mobile</TabsTrigger>
              </TabsList>
              <TabsContent value="desktop" className="space-y-4">
                <div className="space-y-2">
                  {(() => {
                    const effectiveValue = getRowEffectiveWidth('desktop');
                    const hasOverride = hasRowWidthOverride('desktop');
                    const inheritanceLabel = getRowInheritanceLabel('desktop');
                    const widthValue = Math.min(100, Math.max(30, parseInt(String(effectiveValue).replace(/[^0-9]/g, '')) || 100));
                    
                    return (
                      <>
                        <div className="flex items-center justify-between">
                          <Label>Width (%): <span className="text-muted-foreground">{widthValue}%</span></Label>
                          {hasOverride && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleResponsiveStyleUpdate('desktop', 'width', '')}
                              className="h-6 w-6 p-0"
                            >
                              <RotateCcw className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        {inheritanceLabel && (
                          <p className="text-xs text-muted-foreground">{inheritanceLabel}</p>
                        )}
                        <Slider
                          min={30}
                          max={100}
                          step={1}
                          value={[widthValue]}
                          onValueChange={(v) => handleResponsiveStyleUpdate('desktop', 'width', `${v[0]}%`)}
                        />
                      </>
                    );
                  })()}
                </div>
              </TabsContent>
              <TabsContent value="tablet" className="space-y-4">
                <div className="space-y-2">
                  {(() => {
                    const effectiveValue = getRowEffectiveWidth('tablet');
                    const hasOverride = hasRowWidthOverride('tablet');
                    const inheritanceLabel = getRowInheritanceLabel('tablet');
                    const widthValue = Math.min(100, Math.max(30, parseInt(String(effectiveValue).replace(/[^0-9]/g, '')) || 100));
                    
                    return (
                      <>
                        <div className="flex items-center justify-between">
                          <Label>Width (%): <span className="text-muted-foreground">{widthValue}%</span></Label>
                          {hasOverride && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleResponsiveStyleUpdate('tablet', 'width', '')}
                              className="h-6 w-6 p-0"
                            >
                              <RotateCcw className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        {inheritanceLabel && (
                          <p className="text-xs text-muted-foreground">{inheritanceLabel}</p>
                        )}
                        <Slider
                          min={30}
                          max={100}
                          step={1}
                          value={[widthValue]}
                          onValueChange={(v) => handleResponsiveStyleUpdate('tablet', 'width', `${v[0]}%`)}
                        />
                      </>
                    );
                  })()}
                </div>
              </TabsContent>
              <TabsContent value="mobile" className="space-y-4">
                <div className="space-y-2">
                  {(() => {
                    const effectiveValue = getRowEffectiveWidth('mobile');
                    const hasOverride = hasRowWidthOverride('mobile');
                    const inheritanceLabel = getRowInheritanceLabel('mobile');
                    const widthValue = Math.min(100, Math.max(30, parseInt(String(effectiveValue).replace(/[^0-9]/g, '')) || 100));
                    
                    return (
                      <>
                        <div className="flex items-center justify-between">
                          <Label>Width (%): <span className="text-muted-foreground">{widthValue}%</span></Label>
                          {hasOverride && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleResponsiveStyleUpdate('mobile', 'width', '')}
                              className="h-6 w-6 p-0"
                            >
                              <RotateCcw className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        {inheritanceLabel && (
                          <p className="text-xs text-muted-foreground">{inheritanceLabel}</p>
                        )}
                        <Slider
                          min={30}
                          max={100}
                          step={1}
                          value={[widthValue]}
                          onValueChange={(v) => handleResponsiveStyleUpdate('mobile', 'width', `${v[0]}%`)}
                        />
                      </>
                    );
                  })()}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </CollapsibleGroup>

      <CollapsibleGroup
        title="Background"
        isOpen={openCards.background}
        onToggle={(isOpen) => setOpenCards(prev => ({ ...prev, background: isOpen }))}
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
            <Label>Overlay Opacity: <span className="text-muted-foreground">{Math.round((row.styles?.backgroundOpacity ?? 1) * 100)}%</span></Label>
            <p className="text-xs text-muted-foreground">Controls color/gradient opacity only. Background image is unaffected.</p>
            <Slider
              min={0}
              max={100}
              step={1}
              value={[Math.round((row.styles?.backgroundOpacity ?? 1) * 100)]}
              onValueChange={(v) => handleStyleUpdate('backgroundOpacity', v[0] / 100)}
            />
          </div>
          
          <BoxShadowPicker
            value={row.styles?.boxShadow || 'none'}
            onChange={(shadow) => handleStyleUpdate('boxShadow', shadow)}
            label="Box Shadow"
          />
        </div>
      </CollapsibleGroup>

      <CollapsibleGroup
        title="Spacing"
        isOpen={openCards.spacing}
        onToggle={(isOpen) => setOpenCards(prev => ({ ...prev, spacing: isOpen }))}
      >
        <ResponsiveSpacingSliders
          marginByDevice={getCurrentSpacingByDevice().marginByDevice}
          paddingByDevice={getCurrentSpacingByDevice().paddingByDevice}
          onMarginChange={handleMarginChange}
          onPaddingChange={handlePaddingChange}
        />
      </CollapsibleGroup>

      {/* Border */}
      <CollapsibleGroup
        title="Border"
        isOpen={openCards.border}
        onToggle={() => setOpenCards(prev => ({ ...prev, border: !prev.border }))}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-sm">Width</Label>
              <Input
                value={row.styles?.borderWidth || ''}
                onChange={(e) => handleStyleUpdate('borderWidth', e.target.value)}
                placeholder="0px"
                className="h-8"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Style</Label>
              <Select
                value={row.styles?.borderStyle || 'solid'}
                onValueChange={(value) => handleStyleUpdate('borderStyle', value)}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="solid">Solid</SelectItem>
                  <SelectItem value="dashed">Dashed</SelectItem>
                  <SelectItem value="dotted">Dotted</SelectItem>
                  <SelectItem value="double">Double</SelectItem>
                  <SelectItem value="groove">Groove</SelectItem>
                  <SelectItem value="ridge">Ridge</SelectItem>
                  <SelectItem value="inset">Inset</SelectItem>
                  <SelectItem value="outset">Outset</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm">Color</Label>
            <ColorPicker
              color={row.styles?.borderColor || '#000000'}
              onChange={(color) => handleStyleUpdate('borderColor', color)}
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm">Radius</Label>
            <Input
              value={row.styles?.borderRadius || ''}
              onChange={(e) => handleStyleUpdate('borderRadius', e.target.value)}
              placeholder="0px"
              className="h-8"
            />
          </div>
        </div>
      </CollapsibleGroup>
    </div>
  );
};

// Column Settings Panel
interface ColumnSettingsProps {
  column: PageBuilderColumn;
  onUpdate: (updates: Partial<PageBuilderColumn>) => void;
}

export const ColumnSettings: React.FC<ColumnSettingsProps> = ({ column, onUpdate }) => {
  const { setDeviceType } = useDevicePreview();
  const [customWidthMode, setCustomWidthMode] = useState(!!column.customWidth);
  const [openCards, setOpenCards] = useState({
    anchor: false,
    layout: false,
    background: false,
    border: false,
    spacing: false,
    content: false
  });

  // Helper functions for device-aware spacing conversion
  const parsePixelValue = (value: string | undefined): number => {
    if (!value) return 0;
    return parseInt(value.replace('px', '')) || 0;
  };

  const getCurrentSpacingByDevice = () => {
    const marginByDevice = column.styles?.marginByDevice || {
      desktop: { top: 0, right: 0, bottom: 0, left: 0 },
      tablet: { top: 0, right: 0, bottom: 0, left: 0 },
      mobile: { top: 0, right: 0, bottom: 0, left: 0 }
    };
    
    const paddingByDevice = column.styles?.paddingByDevice || {
      desktop: { top: 0, right: 0, bottom: 0, left: 0 },
      tablet: { top: 0, right: 0, bottom: 0, left: 0 },
      mobile: { top: 0, right: 0, bottom: 0, left: 0 }
    };

    // Convert legacy spacing to device-aware if needed
    if (!column.styles?.marginByDevice && (column.styles?.marginTop || column.styles?.marginRight || column.styles?.marginBottom || column.styles?.marginLeft)) {
      marginByDevice.desktop = {
        top: parsePixelValue(column.styles?.marginTop),
        right: parsePixelValue(column.styles?.marginRight),
        bottom: parsePixelValue(column.styles?.marginBottom),
        left: parsePixelValue(column.styles?.marginLeft)
      };
    }

    if (!column.styles?.paddingByDevice && (column.styles?.paddingTop || column.styles?.paddingRight || column.styles?.paddingBottom || column.styles?.paddingLeft)) {
      paddingByDevice.desktop = {
        top: parsePixelValue(column.styles?.paddingTop),
        right: parsePixelValue(column.styles?.paddingRight),
        bottom: parsePixelValue(column.styles?.paddingBottom),
        left: parsePixelValue(column.styles?.paddingLeft)
      };
    }

    return { marginByDevice, paddingByDevice };
  };

  const handleMarginChange = (device: 'desktop' | 'tablet' | 'mobile', property: 'top' | 'right' | 'bottom' | 'left', value: number) => {
    const { marginByDevice } = getCurrentSpacingByDevice();
    const updated = { ...marginByDevice };
    updated[device] = { ...updated[device], [property]: value };
    onUpdate({ styles: { ...column.styles, marginByDevice: updated } });
  };

  const handlePaddingChange = (device: 'desktop' | 'tablet' | 'mobile', property: 'top' | 'right' | 'bottom' | 'left', value: number) => {
    const { paddingByDevice } = getCurrentSpacingByDevice();
    const updated = { ...paddingByDevice };
    updated[device] = { ...updated[device], [property]: value };
    onUpdate({ styles: { ...column.styles, paddingByDevice: updated } });
  };

  // Helper functions for responsive width handling specific to columns
  const getColumnEffectiveWidth = (deviceType: 'desktop' | 'tablet' | 'mobile'): string => {
    const responsiveStyles = column.styles?.responsive;
    if (!responsiveStyles) return '100%';

    const currentValue = responsiveStyles[deviceType]?.width;
    if (currentValue !== undefined && currentValue !== null && currentValue !== '') {
      return currentValue;
    }

    if (deviceType === 'mobile') {
      const tabletValue = responsiveStyles.tablet?.width;
      if (tabletValue !== undefined && tabletValue !== null && tabletValue !== '') {
        return tabletValue;
      }
    }
    
    if (deviceType === 'mobile' || deviceType === 'tablet') {
      const desktopValue = responsiveStyles.desktop?.width;
      if (desktopValue !== undefined && desktopValue !== null && desktopValue !== '') {
        return desktopValue;
      }
    }

    return column.styles?.width || '100%';
  };

  const hasColumnWidthOverride = (deviceType: 'desktop' | 'tablet' | 'mobile'): boolean => {
    const responsiveStyles = column.styles?.responsive;
    if (!responsiveStyles) return false;
    const value = responsiveStyles[deviceType]?.width;
    return value !== undefined && value !== null && value !== '';
  };

  const getColumnInheritanceLabel = (deviceType: 'desktop' | 'tablet' | 'mobile'): string => {
    const responsiveStyles = column.styles?.responsive;
    if (!responsiveStyles) {
      return column.styles?.width ? 'Base Style' : '';
    }

    const currentValue = responsiveStyles[deviceType]?.width;
    if (currentValue !== undefined && currentValue !== null && currentValue !== '') {
      return '';
    }

    if (deviceType === 'mobile') {
      const tabletValue = responsiveStyles.tablet?.width;
      if (tabletValue !== undefined && tabletValue !== null && tabletValue !== '') {
        return 'Inherited from Tablet';
      }
    }
    
    if (deviceType === 'mobile' || deviceType === 'tablet') {
      const desktopValue = responsiveStyles.desktop?.width;
      if (desktopValue !== undefined && desktopValue !== null && desktopValue !== '') {
        return 'Inherited from Desktop';
      }
    }

    if (column.styles?.width) {
      return 'Base Style';
    }

    return '';
  };

  const handleStyleUpdate = (key: string, value: any) => {
    onUpdate({
      styles: {
        ...column.styles,
        [key]: value
      }
    });
  };

  const handleResponsiveStyleUpdate = (device: 'desktop' | 'tablet' | 'mobile', key: string, value: any) => {
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
      <CollapsibleGroup
        title="Anchor"
        isOpen={openCards.anchor}
        onToggle={(isOpen) => setOpenCards(prev => ({ ...prev, anchor: isOpen }))}
      >
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Input readOnly value={column.anchor || ''} />
            <Button size="sm" onClick={() => column.anchor && navigator.clipboard.writeText(column.anchor)}>Copy</Button>
          </div>
          <p className="text-xs text-muted-foreground">Use #{column.anchor} for in-page scrolling</p>
        </div>
      </CollapsibleGroup>

      <CollapsibleGroup
        title="Column Layout"
        isOpen={openCards.layout}
        onToggle={(isOpen) => setOpenCards(prev => ({ ...prev, layout: isOpen }))}
      >
        <div className="space-y-4">
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
            <Tabs defaultValue="desktop" className="w-full" onValueChange={(value) => setDeviceType(value as 'desktop' | 'tablet' | 'mobile')}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="desktop">Desktop</TabsTrigger>
                <TabsTrigger value="tablet">Tablet</TabsTrigger>
                <TabsTrigger value="mobile">Mobile</TabsTrigger>
              </TabsList>
              <TabsContent value="desktop" className="space-y-4">
                <div className="space-y-2">
                  {(() => {
                    const effectiveValue = getColumnEffectiveWidth('desktop');
                    const hasOverride = hasColumnWidthOverride('desktop');
                    const inheritanceLabel = getColumnInheritanceLabel('desktop');
                    const widthValue = Math.min(100, Math.max(30, parseInt(String(effectiveValue).replace(/[^0-9]/g, '')) || 100));
                    
                    return (
                      <>
                        <div className="flex items-center justify-between">
                          <Label>Width (%): <span className="text-muted-foreground">{widthValue}%</span></Label>
                          {hasOverride && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleResponsiveStyleUpdate('desktop', 'width', '')}
                              className="h-6 w-6 p-0"
                            >
                              <RotateCcw className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        {inheritanceLabel && (
                          <p className="text-xs text-muted-foreground">{inheritanceLabel}</p>
                        )}
                        <Slider
                          min={30}
                          max={100}
                          step={1}
                          value={[widthValue]}
                          onValueChange={(v) => handleResponsiveStyleUpdate('desktop', 'width', `${v[0]}%`)}
                        />
                      </>
                    );
                  })()}
                </div>
              </TabsContent>
              <TabsContent value="tablet" className="space-y-4">
                <div className="space-y-2">
                  {(() => {
                    const effectiveValue = getColumnEffectiveWidth('tablet');
                    const hasOverride = hasColumnWidthOverride('tablet');
                    const inheritanceLabel = getColumnInheritanceLabel('tablet');
                    const widthValue = Math.min(100, Math.max(30, parseInt(String(effectiveValue).replace(/[^0-9]/g, '')) || 100));
                    
                    return (
                      <>
                        <div className="flex items-center justify-between">
                          <Label>Width (%): <span className="text-muted-foreground">{widthValue}%</span></Label>
                          {hasOverride && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleResponsiveStyleUpdate('tablet', 'width', '')}
                              className="h-6 w-6 p-0"
                            >
                              <RotateCcw className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        {inheritanceLabel && (
                          <p className="text-xs text-muted-foreground">{inheritanceLabel}</p>
                        )}
                        <Slider
                          min={30}
                          max={100}
                          step={1}
                          value={[widthValue]}
                          onValueChange={(v) => handleResponsiveStyleUpdate('tablet', 'width', `${v[0]}%`)}
                        />
                      </>
                    );
                  })()}
                </div>
              </TabsContent>
              <TabsContent value="mobile" className="space-y-4">
                <div className="space-y-2">
                  {(() => {
                    const effectiveValue = getColumnEffectiveWidth('mobile');
                    const hasOverride = hasColumnWidthOverride('mobile');
                    const inheritanceLabel = getColumnInheritanceLabel('mobile');
                    const widthValue = Math.min(100, Math.max(30, parseInt(String(effectiveValue).replace(/[^0-9]/g, '')) || 100));
                    
                    return (
                      <>
                        <div className="flex items-center justify-between">
                          <Label>Width (%): <span className="text-muted-foreground">{widthValue}%</span></Label>
                          {hasOverride && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleResponsiveStyleUpdate('mobile', 'width', '')}
                              className="h-6 w-6 p-0"
                            >
                              <RotateCcw className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        {inheritanceLabel && (
                          <p className="text-xs text-muted-foreground">{inheritanceLabel}</p>
                        )}
                        <Slider
                          min={30}
                          max={100}
                          step={1}
                          value={[widthValue]}
                          onValueChange={(v) => handleResponsiveStyleUpdate('mobile', 'width', `${v[0]}%`)}
                        />
                      </>
                    );
                  })()}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </CollapsibleGroup>

      <CollapsibleGroup
        title="Background"
        isOpen={openCards.background}
        onToggle={(isOpen) => setOpenCards(prev => ({ ...prev, background: isOpen }))}
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
            <Label>Overlay Opacity: <span className="text-muted-foreground">{Math.round((column.styles?.backgroundOpacity ?? 1) * 100)}%</span></Label>
            <p className="text-xs text-muted-foreground">Controls color/gradient opacity only. Background image is unaffected.</p>
            <Slider
              min={0}
              max={100}
              step={1}
              value={[Math.round((column.styles?.backgroundOpacity ?? 1) * 100)]}
              onValueChange={(v) => handleStyleUpdate('backgroundOpacity', v[0] / 100)}
            />
          </div>
          
          <BoxShadowPicker
            value={column.styles?.boxShadow || 'none'}
            onChange={(shadow) => handleStyleUpdate('boxShadow', shadow)}
            label="Box Shadow"
          />
        </div>
      </CollapsibleGroup>

      <CollapsibleGroup
        title="Spacing"
        isOpen={openCards.spacing}
        onToggle={(isOpen) => setOpenCards(prev => ({ ...prev, spacing: isOpen }))}
      >
        <ResponsiveSpacingSliders
          marginByDevice={getCurrentSpacingByDevice().marginByDevice}
          paddingByDevice={getCurrentSpacingByDevice().paddingByDevice}
          onMarginChange={handleMarginChange}
          onPaddingChange={handlePaddingChange}
        />
      </CollapsibleGroup>

      {/* Border */}
      <CollapsibleGroup
        title="Border"
        isOpen={openCards.border}
        onToggle={() => setOpenCards(prev => ({ ...prev, border: !prev.border }))}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-sm">Width</Label>
              <Input
                value={column.styles?.borderWidth || ''}
                onChange={(e) => handleStyleUpdate('borderWidth', e.target.value)}
                placeholder="0px"
                className="h-8"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Style</Label>
              <Select
                value={column.styles?.borderStyle || 'solid'}
                onValueChange={(value) => handleStyleUpdate('borderStyle', value)}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="solid">Solid</SelectItem>
                  <SelectItem value="dashed">Dashed</SelectItem>
                  <SelectItem value="dotted">Dotted</SelectItem>
                  <SelectItem value="double">Double</SelectItem>
                  <SelectItem value="groove">Groove</SelectItem>
                  <SelectItem value="ridge">Ridge</SelectItem>
                  <SelectItem value="inset">Inset</SelectItem>
                  <SelectItem value="outset">Outset</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm">Color</Label>
            <ColorPicker
              color={column.styles?.borderColor || '#000000'}
              onChange={(color) => handleStyleUpdate('borderColor', color)}
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm">Radius</Label>
            <Input
              value={column.styles?.borderRadius || ''}
              onChange={(e) => handleStyleUpdate('borderRadius', e.target.value)}
              placeholder="0px"
              className="h-8"
            />
          </div>
        </div>
      </CollapsibleGroup>

      <CollapsibleGroup
        title="Content Layout"
        isOpen={openCards.content}
        onToggle={(isOpen) => setOpenCards(prev => ({ ...prev, content: isOpen }))}
      >
        <div className="space-y-4">
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
        </div>
      </CollapsibleGroup>
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
