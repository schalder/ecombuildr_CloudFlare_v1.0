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

  // Section header responsive styles
  const header = ((element.styles as any)?.checkoutSectionHeader) || { responsive: { desktop: {}, mobile: {} } } as any;
  const currentHeader = header.responsive?.[tab] || {} as any;
  const updateHeader = (key: string, value: any) => {
    const next = {
      responsive: {
        desktop: { ...(header.responsive?.desktop || {}) },
        mobile: { ...(header.responsive?.mobile || {}) },
      }
    } as any;
    next.responsive[tab] = { ...next.responsive[tab], [key]: value };
    onStyleUpdate('checkoutSectionHeader', next);
  };

  // Background colors
  const bgs = ((element.styles as any)?.checkoutBackgrounds) || { containerBg: '', formBg: '', summaryBg: '' } as any;


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
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Section Header</h4>
        <p className="text-xs text-muted-foreground">Adjust the section title font size per device</p>
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
              <Slider value={[parseInt(currentHeader.fontSize?.replace(/\D/g, '') || '18')]} onValueChange={(val) => updateHeader('fontSize', `${val[0]}px`)} min={14} max={32} step={1} className="flex-1" />
              <span className="text-xs text-muted-foreground w-12">{currentHeader.fontSize || '18px'}</span>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="mobile" className="space-y-3 mt-3">
          <div>
            <Label className="text-xs">Font Size</Label>
            <div className="flex items-center gap-2">
              <Slider value={[parseInt(currentHeader.fontSize?.replace(/\D/g, '') || '16')]} onValueChange={(val) => updateHeader('fontSize', `${val[0]}px`)} min={12} max={28} step={1} className="flex-1" />
              <span className="text-xs text-muted-foreground w-12">{currentHeader.fontSize || '16px'}</span>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Separator />

      <div className="space-y-2">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Backgrounds</h4>
        <p className="text-xs text-muted-foreground">Customize background colors for the checkout layout</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <Label className="text-xs">Outer Background</Label>
          <Input type="color" value={bgs.containerBg || '#ffffff'} onChange={(e) => onStyleUpdate('checkoutBackgrounds', { ...bgs, containerBg: e.target.value })} className="h-10" />
        </div>
        <div>
          <Label className="text-xs">Form Background</Label>
          <Input type="color" value={bgs.formBg || '#ffffff'} onChange={(e) => onStyleUpdate('checkoutBackgrounds', { ...bgs, formBg: e.target.value })} className="h-10" />
        </div>
        <div>
          <Label className="text-xs">Summary Background</Label>
          <Input type="color" value={bgs.summaryBg || '#ffffff'} onChange={(e) => onStyleUpdate('checkoutBackgrounds', { ...bgs, summaryBg: e.target.value })} className="h-10" />
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
