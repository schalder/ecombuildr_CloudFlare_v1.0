import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Monitor, Smartphone } from 'lucide-react';
import { PageBuilderElement } from '../../types';
import { ColorPicker } from '@/components/ui/color-picker';
import { CollapsibleGroup } from './_shared/CollapsibleGroup';
import { SpacingControl } from './_shared/SpacingControl';

interface CheckoutElementStylesProps {
  element: PageBuilderElement;
  onStyleUpdate: (property: string, value: any) => void;
}

export const CheckoutElementStyles: React.FC<CheckoutElementStylesProps> = ({ element, onStyleUpdate }) => {
  const [tab, setTab] = useState<'desktop' | 'mobile'>('desktop');
  const [buttonOpen, setButtonOpen] = useState(true);
  const [headerOpen, setHeaderOpen] = useState(false);
  const [backgroundsOpen, setBackgroundsOpen] = useState(false);
  const [spacingOpen, setSpacingOpen] = useState(false);
  
  const styles = ((element.styles as any)?.checkoutButton) || { responsive: { desktop: {}, mobile: {} } } as any;
  
  // Get effective values with proper inheritance (mobile inherits from desktop)
  const getEffectiveValue = (responsiveStyles: any, property: string, fallback: string) => {
    if (tab === 'mobile') {
      return responsiveStyles.responsive?.mobile?.[property] || 
             responsiveStyles.responsive?.desktop?.[property] || 
             fallback;
    }
    return responsiveStyles.responsive?.desktop?.[property] || fallback;
  };

  // Section header styles
  const headerStyles = ((element.styles as any)?.checkoutSectionHeader) || { responsive: { desktop: {}, mobile: {} } } as any;

  // Background colors
  const backgrounds = ((element.styles as any)?.checkoutBackgrounds) || {} as any;

  const updateResponsive = (key: string, value: any) => {
    const next = {
      responsive: {
        desktop: { ...(styles.responsive?.desktop || {}) },
        mobile: { ...(styles.responsive?.mobile || {}) },
      }
    } as any;
    next.responsive[tab] = { ...next.responsive[tab], [key]: value };
    onStyleUpdate('checkoutButton', next);
  };

  // Update subtext styling to use the same structure as main button styling
  const updateSubtextResponsive = (key: string, value: any) => {
    const next = {
      responsive: {
        desktop: { ...(styles.responsive?.desktop || {}) },
        mobile: { ...(styles.responsive?.mobile || {}) },
      }
    } as any;
    next.responsive[tab] = { ...next.responsive[tab], [key]: value };
    onStyleUpdate('checkoutButton', next);
  };

  const updateHeaderResponsive = (key: string, value: any) => {
    const next = {
      responsive: {
        desktop: { ...(headerStyles.responsive?.desktop || {}) },
        mobile: { ...(headerStyles.responsive?.mobile || {}) },
      }
    } as any;
    next.responsive[tab] = { ...next.responsive[tab], [key]: value };
    onStyleUpdate('checkoutSectionHeader', next);
  };

  const updateBackgrounds = (key: 'containerBg' | 'formBg' | 'summaryBg' | 'formBorderColor' | 'formBorderWidth' | 'summaryBorderColor' | 'summaryBorderWidth', value: any) => {
    onStyleUpdate('checkoutBackgrounds', { ...backgrounds, [key]: value });
  };

  return (
    <div className="space-y-4">
      <CollapsibleGroup title="Button Main Text Styling" isOpen={buttonOpen} onToggle={setButtonOpen}>
        <p className="text-xs text-muted-foreground mb-3">Customize the Place Order button main text styles</p>

      {/* Button size preset */}
      <div className="grid grid-cols-1 gap-2">
        <Label className="text-xs">Size Preset</Label>
        <Select value={(element.styles as any)?.checkoutButtonSize || 'default'} onValueChange={(v) => onStyleUpdate('checkoutButtonSize', v)}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Choose size" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sm">Small</SelectItem>
            <SelectItem value="default">Medium</SelectItem>
            <SelectItem value="lg">Large</SelectItem>
            <SelectItem value="xl">Extra Large</SelectItem>
          </SelectContent>
        </Select>
      </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="desktop" className="flex items-center gap-2"><Monitor className="h-3 w-3" />Desktop</TabsTrigger>
            <TabsTrigger value="mobile" className="flex items-center gap-2"><Smartphone className="h-3 w-3" />Mobile</TabsTrigger>
          </TabsList>
          <TabsContent value="desktop" className="space-y-3 mt-3">
            <div>
              <Label className="text-xs">Font Size</Label>
              <div className="flex items-center gap-2">
                <Slider value={[parseInt(getEffectiveValue(styles, 'fontSize', '16').replace(/\D/g, ''))]} onValueChange={(val) => updateResponsive('fontSize', `${val[0]}px`)} min={12} max={50} step={1} className="flex-1" />
                <span className="text-xs text-muted-foreground w-12">{getEffectiveValue(styles, 'fontSize', '16px')}</span>
              </div>
            </div>
            <div>
              <Label className="text-xs">Font Weight</Label>
              <Select 
                value={getEffectiveValue(styles, 'fontWeight', '400')} 
                onValueChange={(val) => updateResponsive('fontWeight', val)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="300">Light (300)</SelectItem>
                  <SelectItem value="400">Normal (400)</SelectItem>
                  <SelectItem value="500">Medium (500)</SelectItem>
                  <SelectItem value="600">Semi Bold (600)</SelectItem>
                  <SelectItem value="700">Bold (700)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <div>
                <ColorPicker 
                  label="Text Color"
                  color={getEffectiveValue(styles, 'color', '#ffffff')}
                  onChange={(val) => updateResponsive('color', val)}
                />
              </div>
              <div>
                <ColorPicker 
                  label="Background"
                  color={getEffectiveValue(styles, 'backgroundColor', '#10B981')}
                  onChange={(val) => updateResponsive('backgroundColor', val)}
                />
              </div>
              <div>
                <ColorPicker 
                  label="Hover Text"
                  color={getEffectiveValue(styles, 'hoverColor', getEffectiveValue(styles, 'color', '#ffffff'))}
                  onChange={(val) => updateResponsive('hoverColor', val)}
                />
              </div>
              <div>
                <ColorPicker 
                  label="Hover Background"
                  color={getEffectiveValue(styles, 'hoverBackgroundColor', getEffectiveValue(styles, 'backgroundColor', '#0f766e'))}
                  onChange={(val) => updateResponsive('hoverBackgroundColor', val)}
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Border Radius</Label>
              <Slider value={[parseInt(getEffectiveValue(styles, 'borderRadius', '6').replace(/\D/g, ''))]} onValueChange={(val) => updateResponsive('borderRadius', `${val[0]}px`)} min={0} max={24} step={1} />
            </div>
            <div>
              <Label className="text-xs">Padding</Label>
              <Input value={getEffectiveValue(styles, 'padding', '12px 16px')} onChange={(e) => updateResponsive('padding', e.target.value)} placeholder="e.g., 12px 16px" />
            </div>
          </TabsContent>
          <TabsContent value="mobile" className="space-y-3 mt-3">
            <div>
              <Label className="text-xs">Font Size</Label>
              <div className="flex items-center gap-2">
                <Slider value={[parseInt(getEffectiveValue(styles, 'fontSize', '16').replace(/\D/g, ''))]} onValueChange={(val) => updateResponsive('fontSize', `${val[0]}px`)} min={12} max={50} step={1} className="flex-1" />
                <span className="text-xs text-muted-foreground w-12">{getEffectiveValue(styles, 'fontSize', '16px')}</span>
              </div>
            </div>
            <div>
              <Label className="text-xs">Font Weight</Label>
              <Select 
                value={getEffectiveValue(styles, 'fontWeight', '400')} 
                onValueChange={(val) => updateResponsive('fontWeight', val)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="300">Light (300)</SelectItem>
                  <SelectItem value="400">Normal (400)</SelectItem>
                  <SelectItem value="500">Medium (500)</SelectItem>
                  <SelectItem value="600">Semi Bold (600)</SelectItem>
                  <SelectItem value="700">Bold (700)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <div>
                <ColorPicker 
                  label="Text Color"
                  color={getEffectiveValue(styles, 'color', '#ffffff')}
                  onChange={(val) => updateResponsive('color', val)}
                />
              </div>
              <div>
                <ColorPicker 
                  label="Background"
                  color={getEffectiveValue(styles, 'backgroundColor', '#10B981')}
                  onChange={(val) => updateResponsive('backgroundColor', val)}
                />
              </div>
              <div>
                <ColorPicker 
                  label="Hover Text"
                  color={getEffectiveValue(styles, 'hoverColor', getEffectiveValue(styles, 'color', '#ffffff'))}
                  onChange={(val) => updateResponsive('hoverColor', val)}
                />
              </div>
              <div>
                <ColorPicker 
                  label="Hover Background"
                  color={getEffectiveValue(styles, 'hoverBackgroundColor', getEffectiveValue(styles, 'backgroundColor', '#0f766e'))}
                  onChange={(val) => updateResponsive('hoverBackgroundColor', val)}
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Border Radius</Label>
              <Slider value={[parseInt(getEffectiveValue(styles, 'borderRadius', '6').replace(/\D/g, ''))]} onValueChange={(val) => updateResponsive('borderRadius', `${val[0]}px`)} min={0} max={24} step={1} />
            </div>
            <div>
              <Label className="text-xs">Padding</Label>
              <Input value={getEffectiveValue(styles, 'padding', '12px 16px')} onChange={(e) => updateResponsive('padding', e.target.value)} placeholder="e.g., 12px 16px" />
            </div>
          </TabsContent>
        </Tabs>

        {/* Subtext Styling - only show if subtext exists */}
        {element.content?.placeOrderSubtext && (
          <>
            <Separator className="my-4" />
            <div className="space-y-3">
              <h5 className="text-xs font-medium">Subtext Styling</h5>
              <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="desktop" className="flex items-center gap-2"><Monitor className="h-3 w-3" />Desktop</TabsTrigger>
                  <TabsTrigger value="mobile" className="flex items-center gap-2"><Smartphone className="h-3 w-3" />Mobile</TabsTrigger>
                </TabsList>
                <TabsContent value="desktop" className="space-y-3 mt-3">
                  <div>
                    <Label className="text-xs">Font Size</Label>
                    <div className="flex items-center gap-2">
                      <Slider 
                        value={[parseInt(getEffectiveValue(styles, 'subtextFontSize', '12').replace(/\D/g, ''))]} 
                        onValueChange={(val) => updateSubtextResponsive('subtextFontSize', `${val[0]}px`)} 
                        min={8} 
                        max={32} 
                        step={1} 
                        className="flex-1" 
                      />
                      <span className="text-xs text-muted-foreground w-12">{getEffectiveValue(styles, 'subtextFontSize', '12px')}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <ColorPicker 
                        label="Text Color"
                        color={getEffectiveValue(styles, 'subtextColor', '#ffffff')}
                        onChange={(val) => updateSubtextResponsive('subtextColor', val)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Font Weight</Label>
                      <Select 
                        value={getEffectiveValue(styles, 'subtextFontWeight', '400')} 
                        onValueChange={(val) => updateSubtextResponsive('subtextFontWeight', val)}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="300">Light (300)</SelectItem>
                          <SelectItem value="400">Normal (400)</SelectItem>
                          <SelectItem value="500">Medium (500)</SelectItem>
                          <SelectItem value="600">Semi Bold (600)</SelectItem>
                          <SelectItem value="700">Bold (700)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="mobile" className="space-y-3 mt-3">
                  <div>
                    <Label className="text-xs">Font Size</Label>
                    <div className="flex items-center gap-2">
                      <Slider 
                        value={[parseInt(getEffectiveValue(styles, 'subtextFontSize', '12').replace(/\D/g, ''))]} 
                        onValueChange={(val) => updateSubtextResponsive('subtextFontSize', `${val[0]}px`)} 
                        min={8} 
                        max={28} 
                        step={1} 
                        className="flex-1" 
                      />
                      <span className="text-xs text-muted-foreground w-12">{getEffectiveValue(styles, 'subtextFontSize', '12px')}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <ColorPicker 
                        label="Text Color"
                        color={getEffectiveValue(styles, 'subtextColor', '#ffffff')}
                        onChange={(val) => updateSubtextResponsive('subtextColor', val)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Font Weight</Label>
                      <Select 
                        value={getEffectiveValue(styles, 'subtextFontWeight', '400')} 
                        onValueChange={(val) => updateSubtextResponsive('subtextFontWeight', val)}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="300">Light (300)</SelectItem>
                          <SelectItem value="400">Normal (400)</SelectItem>
                          <SelectItem value="500">Medium (500)</SelectItem>
                          <SelectItem value="600">Semi Bold (600)</SelectItem>
                          <SelectItem value="700">Bold (700)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </>
        )}
      </CollapsibleGroup>

      <CollapsibleGroup title="Section Header" isOpen={headerOpen} onToggle={setHeaderOpen}>
        <p className="text-xs text-muted-foreground mb-3">Adjust section title font size per device.</p>
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="desktop" className="flex items-center gap-2"><Monitor className="h-3 w-3" />Desktop</TabsTrigger>
            <TabsTrigger value="mobile" className="flex items-center gap-2"><Smartphone className="h-3 w-3" />Mobile</TabsTrigger>
          </TabsList>
          <TabsContent value="desktop" className="space-y-3 mt-3">
            <div>
              <Label className="text-xs">Font Size</Label>
              <div className="flex items-center gap-2">
                <Slider value={[parseInt(getEffectiveValue(headerStyles, 'fontSize', '16').replace(/\D/g, ''))]} onValueChange={(val) => updateHeaderResponsive('fontSize', `${val[0]}px`)} min={12} max={28} step={1} className="flex-1" />
                <span className="text-xs text-muted-foreground w-12">{getEffectiveValue(headerStyles, 'fontSize', '16px')}</span>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="mobile" className="space-y-3 mt-3">
            <div>
              <Label className="text-xs">Font Size</Label>
              <div className="flex items-center gap-2">
                <Slider value={[parseInt(getEffectiveValue(headerStyles, 'fontSize', '16').replace(/\D/g, ''))]} onValueChange={(val) => updateHeaderResponsive('fontSize', `${val[0]}px`)} min={12} max={24} step={1} className="flex-1" />
                <span className="text-xs text-muted-foreground w-12">{getEffectiveValue(headerStyles, 'fontSize', '16px')}</span>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CollapsibleGroup>

      <CollapsibleGroup title="Backgrounds & Borders" isOpen={backgroundsOpen} onToggle={setBackgroundsOpen}>
        <p className="text-xs text-muted-foreground mb-3">Customize container, form area, and summary area. Colors are stacked vertically for clarity.</p>

        {/* Container Background */}
        <div className="space-y-2">
          <ColorPicker 
            label="Outer Container Background"
            color={backgrounds.containerBg || '#ffffff'}
            onChange={(val) => updateBackgrounds('containerBg', val)}
          />
        </div>

        <Separator />

        {/* Form Area */}
        <div className="space-y-2">
          <h5 className="text-xs font-medium">Form Area</h5>
          <ColorPicker 
            label="Background"
            color={backgrounds.formBg || '#ffffff'}
            onChange={(val) => updateBackgrounds('formBg', val)}
          />
          <ColorPicker 
            label="Border Color"
            color={backgrounds.formBorderColor || '#e2e8f0'}
            onChange={(val) => updateBackgrounds('formBorderColor', val)}
          />
          <div>
            <Label className="text-xs">Border Width</Label>
            <div className="flex items-center gap-2">
              <Slider value={[Number(backgrounds.formBorderWidth || 0)]} onValueChange={(val) => updateBackgrounds('formBorderWidth', val[0])} min={0} max={8} step={1} className="flex-1" />
              <span className="text-xs text-muted-foreground w-10 text-right">{Number(backgrounds.formBorderWidth || 0)}px</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Summary Area */}
        <div className="space-y-2">
          <h5 className="text-xs font-medium">Summary Area</h5>
          <ColorPicker 
            label="Background"
            color={backgrounds.summaryBg || '#ffffff'}
            onChange={(val) => updateBackgrounds('summaryBg', val)}
          />
          <ColorPicker 
            label="Border Color"
            color={backgrounds.summaryBorderColor || '#e2e8f0'}
            onChange={(val) => updateBackgrounds('summaryBorderColor', val)}
          />
          <div>
            <Label className="text-xs">Border Width</Label>
            <div className="flex items-center gap-2">
              <Slider value={[Number(backgrounds.summaryBorderWidth || 0)]} onValueChange={(val) => updateBackgrounds('summaryBorderWidth', val[0])} min={0} max={8} step={1} className="flex-1" />
              <span className="text-xs text-muted-foreground w-10 text-right">{Number(backgrounds.summaryBorderWidth || 0)}px</span>
            </div>
          </div>
        </div>
      </CollapsibleGroup>

      <CollapsibleGroup title="Spacing" isOpen={spacingOpen} onToggle={setSpacingOpen}>
        <p className="text-xs text-muted-foreground mb-3">Adjust margin and padding spacing around the checkout element.</p>
        
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="desktop" className="flex items-center gap-2"><Monitor className="h-3 w-3" />Desktop</TabsTrigger>
            <TabsTrigger value="mobile" className="flex items-center gap-2"><Smartphone className="h-3 w-3" />Mobile</TabsTrigger>
          </TabsList>
          
          <TabsContent value="desktop" className="space-y-4 mt-3">
            <div className="space-y-3">
              <h5 className="text-xs font-medium">Margin</h5>
              <SpacingControl
                element={element}
                property="marginTop"
                label="Top"
                deviceType="desktop"
                onStyleUpdate={onStyleUpdate}
              />
              <SpacingControl
                element={element}
                property="marginRight"
                label="Right"
                deviceType="desktop"
                onStyleUpdate={onStyleUpdate}
              />
              <SpacingControl
                element={element}
                property="marginBottom"
                label="Bottom"
                deviceType="desktop"
                onStyleUpdate={onStyleUpdate}
              />
              <SpacingControl
                element={element}
                property="marginLeft"
                label="Left"
                deviceType="desktop"
                onStyleUpdate={onStyleUpdate}
              />
            </div>
            
            <div className="space-y-3">
              <h5 className="text-xs font-medium">Padding</h5>
              <SpacingControl
                element={element}
                property="paddingTop"
                label="Top"
                deviceType="desktop"
                onStyleUpdate={onStyleUpdate}
              />
              <SpacingControl
                element={element}
                property="paddingRight"
                label="Right"
                deviceType="desktop"
                onStyleUpdate={onStyleUpdate}
              />
              <SpacingControl
                element={element}
                property="paddingBottom"
                label="Bottom"
                deviceType="desktop"
                onStyleUpdate={onStyleUpdate}
              />
              <SpacingControl
                element={element}
                property="paddingLeft"
                label="Left"
                deviceType="desktop"
                onStyleUpdate={onStyleUpdate}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="mobile" className="space-y-4 mt-3">
            <div className="space-y-3">
              <h5 className="text-xs font-medium">Margin</h5>
              <SpacingControl
                element={element}
                property="marginTop"
                label="Top"
                deviceType="mobile"
                onStyleUpdate={onStyleUpdate}
              />
              <SpacingControl
                element={element}
                property="marginRight"
                label="Right"
                deviceType="mobile"
                onStyleUpdate={onStyleUpdate}
              />
              <SpacingControl
                element={element}
                property="marginBottom"
                label="Bottom"
                deviceType="mobile"
                onStyleUpdate={onStyleUpdate}
              />
              <SpacingControl
                element={element}
                property="marginLeft"
                label="Left"
                deviceType="mobile"
                onStyleUpdate={onStyleUpdate}
              />
            </div>
            
            <div className="space-y-3">
              <h5 className="text-xs font-medium">Padding</h5>
              <SpacingControl
                element={element}
                property="paddingTop"
                label="Top"
                deviceType="mobile"
                onStyleUpdate={onStyleUpdate}
              />
              <SpacingControl
                element={element}
                property="paddingRight"
                label="Right"
                deviceType="mobile"
                onStyleUpdate={onStyleUpdate}
              />
              <SpacingControl
                element={element}
                property="paddingBottom"
                label="Bottom"
                deviceType="mobile"
                onStyleUpdate={onStyleUpdate}
              />
              <SpacingControl
                element={element}
                property="paddingLeft"
                label="Left"
                deviceType="mobile"
                onStyleUpdate={onStyleUpdate}
              />
            </div>
          </TabsContent>
        </Tabs>
      </CollapsibleGroup>

      <Separator />

      <div className="space-y-2">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Card Styles</h4>
        <p className="text-xs text-muted-foreground">Use the generic Form styles to customize form colors, borders and spacing.</p>
      </div>
    </div>
  );
};
