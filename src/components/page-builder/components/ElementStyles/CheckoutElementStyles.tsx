import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Monitor, Smartphone } from 'lucide-react';
import { PageBuilderElement } from '../../types';

interface CheckoutElementStylesProps {
  element: PageBuilderElement;
  onStyleUpdate: (property: string, value: any) => void;
}

export const CheckoutElementStyles: React.FC<CheckoutElementStylesProps> = ({ element, onStyleUpdate }) => {
  const [tab, setTab] = useState<'desktop' | 'mobile'>('desktop');
  const styles = ((element.styles as any)?.checkoutButton) || { responsive: { desktop: {}, mobile: {} } } as any;
  const current = styles.responsive?.[tab] || {} as any;

  // Section header responsive styles
  const headerStyles = ((element.styles as any)?.checkoutSectionHeader) || { responsive: { desktop: {}, mobile: {} } } as any;
  const headerCurrent = headerStyles.responsive?.[tab] || {} as any;

  // Background color controls
  const backgrounds = (element.styles as any)?.checkoutBackgrounds || { formContainer: '', summaryCard: '', container: '' } as any;

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


  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Primary Button</h4>
        <p className="text-xs text-muted-foreground">Customize the Place Order button styles</p>
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

<div className="space-y-2">
  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Section Headers</h4>
  <p className="text-xs text-muted-foreground">Adjust section title font sizes</p>
</div>

<Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
  <TabsList className="grid w-full grid-cols-2">
    <TabsTrigger value="desktop" className="flex items-center gap-2"><Monitor className="h-3 w-3" />Desktop</TabsTrigger>
    <TabsTrigger value="mobile" className="flex items-center gap-2"><Smartphone className="h-3 w-3" />Mobile</TabsTrigger>
  </TabsList>
  <TabsContent value="desktop" className="space-y-3 mt-3">
    <div>
      <Label className="text-xs">Title Font Size</Label>
      <div className="flex items-center gap-2">
        <Slider value={[parseInt(headerCurrent.fontSize?.replace(/\D/g, '') || '18')]} onValueChange={(val) => updateHeaderResponsive('fontSize', `${val[0]}px`)} min={14} max={32} step={1} className="flex-1" />
        <span className="text-xs text-muted-foreground w-12">{headerCurrent.fontSize || '18px'}</span>
      </div>
    </div>
  </TabsContent>
  <TabsContent value="mobile" className="space-y-3 mt-3">
    <div>
      <Label className="text-xs">Title Font Size</Label>
      <div className="flex items-center gap-2">
        <Slider value={[parseInt(headerCurrent.fontSize?.replace(/\D/g, '') || '16')]} onValueChange={(val) => updateHeaderResponsive('fontSize', `${val[0]}px`)} min={12} max={28} step={1} className="flex-1" />
        <span className="text-xs text-muted-foreground w-12">{headerCurrent.fontSize || '16px'}</span>
      </div>
    </div>
  </TabsContent>
</Tabs>

<Separator />

<div className="space-y-2">
  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Backgrounds</h4>
  <p className="text-xs text-muted-foreground">Set background colors for checkout areas</p>
</div>
<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
  <div>
    <Label className="text-xs">Form Area Background</Label>
    <Input type="color" value={backgrounds.formContainer || '#ffffff'} onChange={(e) => onStyleUpdate('checkoutBackgrounds', { ...backgrounds, formContainer: e.target.value })} className="h-10" />
  </div>
  <div>
    <Label className="text-xs">Summary Card Background</Label>
    <Input type="color" value={backgrounds.summaryCard || '#ffffff'} onChange={(e) => onStyleUpdate('checkoutBackgrounds', { ...backgrounds, summaryCard: e.target.value })} className="h-10" />
  </div>
  <div>
    <Label className="text-xs">Outer Container Background</Label>
    <Input type="color" value={backgrounds.container || '#ffffff'} onChange={(e) => onStyleUpdate('checkoutBackgrounds', { ...backgrounds, container: e.target.value })} className="h-10" />
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
