import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Monitor, Smartphone } from 'lucide-react';
import { PageBuilderElement } from '../../types';
import { Button } from '@/components/ui/button';

interface CheckoutElementStylesProps {
  element: PageBuilderElement;
  onStyleUpdate: (property: string, value: any) => void;
}

export const CheckoutElementStyles: React.FC<CheckoutElementStylesProps> = ({ element, onStyleUpdate }) => {
  const [tab, setTab] = useState<'desktop' | 'mobile'>('desktop');
  const styles = ((element.styles as any)?.checkoutButton) || { responsive: { desktop: {}, mobile: {} } } as any;
  const current = styles.responsive?.[tab] || {} as any;

  // Section header styles
  const headerStyles = ((element.styles as any)?.checkoutSectionHeader) || { responsive: { desktop: {}, mobile: {} } } as any;
  const currentHeader = headerStyles.responsive?.[tab] || {} as any;

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
      <div>
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Primary Button</h4>
        <p className="text-xs text-muted-foreground">Customize the Place Order button styles</p>
      </div>

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
              <Slider value={[parseInt(current.fontSize?.replace(/\D/g, '') || '16')]} onValueChange={(val) => updateResponsive('fontSize', `${val[0]}px`)} min={12} max={28} step={1} className="flex-1" />
              <span className="text-xs text-muted-foreground w-12">{current.fontSize || '16px'}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Text Color</Label>
              <Input type="color" value={current.color || '#ffffff'} onChange={(e) => updateResponsive('color', e.target.value)} className="h-10" />
            </div>
            <div>
              <Label className="text-xs">Background</Label>
              <Input type="color" value={current.backgroundColor || '#10B981'} onChange={(e) => updateResponsive('backgroundColor', e.target.value)} className="h-10" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Hover Text</Label>
              <Input type="color" value={current.hoverColor || current.color || '#ffffff'} onChange={(e) => updateResponsive('hoverColor', e.target.value)} className="h-10" />
            </div>
            <div>
              <Label className="text-xs">Hover Background</Label>
              <Input type="color" value={current.hoverBackgroundColor || current.backgroundColor || '#0f766e'} onChange={(e) => updateResponsive('hoverBackgroundColor', e.target.value)} className="h-10" />
            </div>
          </div>
          <div>
            <Label className="text-xs">Border Radius</Label>
            <Slider value={[parseInt(current.borderRadius?.replace(/\D/g, '') || '6')]} onValueChange={(val) => updateResponsive('borderRadius', `${val[0]}px`)} min={0} max={24} step={1} />
          </div>
          <div>
            <Label className="text-xs">Padding</Label>
            <Input value={current.padding || '12px 16px'} onChange={(e) => updateResponsive('padding', e.target.value)} placeholder="e.g., 12px 16px" />
          </div>
        </TabsContent>
        <TabsContent value="mobile" className="space-y-3 mt-3">
          <div>
            <Label className="text-xs">Font Size</Label>
            <div className="flex items-center gap-2">
              <Slider value={[parseInt(current.fontSize?.replace(/\D/g, '') || '16')]} onValueChange={(val) => updateResponsive('fontSize', `${val[0]}px`)} min={12} max={24} step={1} className="flex-1" />
              <span className="text-xs text-muted-foreground w-12">{current.fontSize || '16px'}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Text Color</Label>
              <Input type="color" value={current.color || '#ffffff'} onChange={(e) => updateResponsive('color', e.target.value)} className="h-10" />
            </div>
            <div>
              <Label className="text-xs">Background</Label>
              <Input type="color" value={current.backgroundColor || '#10B981'} onChange={(e) => updateResponsive('backgroundColor', e.target.value)} className="h-10" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Hover Text</Label>
              <Input type="color" value={current.hoverColor || current.color || '#ffffff'} onChange={(e) => updateResponsive('hoverColor', e.target.value)} className="h-10" />
            </div>
            <div>
              <Label className="text-xs">Hover Background</Label>
              <Input type="color" value={current.hoverBackgroundColor || current.backgroundColor || '#0f766e'} onChange={(e) => updateResponsive('hoverBackgroundColor', e.target.value)} className="h-10" />
            </div>
          </div>
          <div>
            <Label className="text-xs">Border Radius</Label>
            <Slider value={[parseInt(current.borderRadius?.replace(/\D/g, '') || '6')]} onValueChange={(val) => updateResponsive('borderRadius', `${val[0]}px`)} min={0} max={24} step={1} />
          </div>
          <div>
            <Label className="text-xs">Padding</Label>
            <Input value={current.padding || '12px 16px'} onChange={(e) => updateResponsive('padding', e.target.value)} placeholder="e.g., 12px 16px" />
          </div>
        </TabsContent>
      </Tabs>

      <Separator />

      <div>
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Section Header</h4>
        <p className="text-xs text-muted-foreground">Adjust section title font size per device.</p>
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="desktop" className="flex items-center gap-2"><Monitor className="h-3 w-3" />Desktop</TabsTrigger>
            <TabsTrigger value="mobile" className="flex items-center gap-2"><Smartphone className="h-3 w-3" />Mobile</TabsTrigger>
          </TabsList>
          <TabsContent value="desktop" className="space-y-3 mt-3">
            <div>
              <Label className="text-xs">Font Size</Label>
              <div className="flex items-center gap-2">
                <Slider value={[parseInt(currentHeader.fontSize?.replace(/\D/g, '') || '16')]} onValueChange={(val) => updateHeaderResponsive('fontSize', `${val[0]}px`)} min={12} max={28} step={1} className="flex-1" />
                <span className="text-xs text-muted-foreground w-12">{currentHeader.fontSize || '16px'}</span>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="mobile" className="space-y-3 mt-3">
            <div>
              <Label className="text-xs">Font Size</Label>
              <div className="flex items-center gap-2">
                <Slider value={[parseInt(currentHeader.fontSize?.replace(/\D/g, '') || '16')]} onValueChange={(val) => updateHeaderResponsive('fontSize', `${val[0]}px`)} min={12} max={24} step={1} className="flex-1" />
                <span className="text-xs text-muted-foreground w-12">{currentHeader.fontSize || '16px'}</span>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Separator />

      <div className="space-y-3">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Backgrounds & Borders</h4>
        <p className="text-xs text-muted-foreground">Customize container, form area, and summary area. Colors are stacked vertically for clarity.</p>

        {/* Container Background */}
        <div className="space-y-2">
          <Label className="text-xs">Outer Container Background</Label>
          <div className="flex items-center gap-2">
            <Input type="color" value={backgrounds.containerBg || '#ffffff'} onChange={(e) => updateBackgrounds('containerBg', e.target.value)} className="h-10 w-14 p-0" />
            <Button variant="ghost" size="sm" onClick={() => updateBackgrounds('containerBg', undefined)}>Reset</Button>
            <Button variant="ghost" size="sm" onClick={() => updateBackgrounds('containerBg', 'transparent')}>Transparent</Button>
          </div>
        </div>

        <Separator />

        {/* Form Area */}
        <div className="space-y-2">
          <h5 className="text-xs font-medium">Form Area</h5>
          <Label className="text-xs">Background</Label>
          <div className="flex items-center gap-2">
            <Input type="color" value={backgrounds.formBg || '#ffffff'} onChange={(e) => updateBackgrounds('formBg', e.target.value)} className="h-10 w-14 p-0" />
            <Button variant="ghost" size="sm" onClick={() => updateBackgrounds('formBg', undefined)}>Reset</Button>
            <Button variant="ghost" size="sm" onClick={() => updateBackgrounds('formBg', 'transparent')}>Transparent</Button>
          </div>
          <Label className="text-xs">Border Color</Label>
          <div className="flex items-center gap-2">
            <Input type="color" value={backgrounds.formBorderColor || '#e2e8f0'} onChange={(e) => updateBackgrounds('formBorderColor', e.target.value)} className="h-10 w-14 p-0" />
            <Button variant="ghost" size="sm" onClick={() => updateBackgrounds('formBorderColor', undefined)}>Reset</Button>
          </div>
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
          <Label className="text-xs">Background</Label>
          <div className="flex items-center gap-2">
            <Input type="color" value={backgrounds.summaryBg || '#ffffff'} onChange={(e) => updateBackgrounds('summaryBg', e.target.value)} className="h-10 w-14 p-0" />
            <Button variant="ghost" size="sm" onClick={() => updateBackgrounds('summaryBg', undefined)}>Reset</Button>
            <Button variant="ghost" size="sm" onClick={() => updateBackgrounds('summaryBg', 'transparent')}>Transparent</Button>
          </div>
          <Label className="text-xs">Border Color</Label>
          <div className="flex items-center gap-2">
            <Input type="color" value={backgrounds.summaryBorderColor || '#e2e8f0'} onChange={(e) => updateBackgrounds('summaryBorderColor', e.target.value)} className="h-10 w-14 p-0" />
            <Button variant="ghost" size="sm" onClick={() => updateBackgrounds('summaryBorderColor', undefined)}>Reset</Button>
          </div>
          <div>
            <Label className="text-xs">Border Width</Label>
            <div className="flex items-center gap-2">
              <Slider value={[Number(backgrounds.summaryBorderWidth || 0)]} onValueChange={(val) => updateBackgrounds('summaryBorderWidth', val[0])} min={0} max={8} step={1} className="flex-1" />
              <span className="text-xs text-muted-foreground w-10 text-right">{Number(backgrounds.summaryBorderWidth || 0)}px</span>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Card Styles</h4>
        <p className="text-xs text-muted-foreground">Use the generic Form styles to customize form colors, borders and spacing.</p>
      </div>
    </div>
  );
};
