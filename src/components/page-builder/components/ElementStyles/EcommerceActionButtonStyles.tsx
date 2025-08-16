import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ColorPicker } from '@/components/ui/color-picker';
import { PageBuilderElement } from '../../types';

interface EcommerceActionButtonStylesProps {
  element: PageBuilderElement;
  onStyleUpdate: (property: string, value: any) => void;
}

function ensureResponsive(base: any) {
  const next = { ...(base || {}) };
  if (!next.responsive) next.responsive = { desktop: {}, mobile: {} };
  if (!next.responsive.desktop) next.responsive.desktop = {};
  if (!next.responsive.mobile) next.responsive.mobile = {};
  return next;
}

function sizeToStyles(size: 'sm' | 'md' | 'lg') {
  switch (size) {
    case 'sm':
      return { fontSize: '0.875rem', padding: '0.5rem 0.75rem' };
    case 'lg':
      return { fontSize: '1.125rem', padding: '0.75rem 1.25rem' };
    case 'md':
    default:
      return { fontSize: '1rem', padding: '0.625rem 1rem' };
  }
}

export const EcommerceActionButtonStyles: React.FC<EcommerceActionButtonStylesProps> = ({ element, onStyleUpdate }) => {
  const [activeDevice, setActiveDevice] = React.useState<'desktop' | 'mobile'>('desktop');
  const current = ensureResponsive((element as any).styles?.buttonStyles);
  const stylesForDevice = current.responsive[activeDevice] as any;

  const update = (patch: Record<string, any>) => {
    const next = ensureResponsive((element as any).styles?.buttonStyles);
    next.responsive[activeDevice] = {
      ...(next.responsive[activeDevice] || {}),
      ...patch,
    };
    onStyleUpdate('buttonStyles', next);
  };

  const clearProp = (prop: string) => {
    const next = ensureResponsive((element as any).styles?.buttonStyles);
    if (next.responsive[activeDevice]) {
      const { [prop]: _removed, ...rest } = next.responsive[activeDevice];
      next.responsive[activeDevice] = rest;
    }
    onStyleUpdate('buttonStyles', next);
  };

  const clearAll = () => {
    onStyleUpdate('buttonStyles', {});
  };

  const currentSize: 'sm' | 'md' | 'lg' = ((): any => {
    // Infer from padding/fontSize; default to md
    const fs = stylesForDevice?.fontSize as string | undefined;
    if (fs === '0.875rem') return 'sm';
    if (fs === '1.125rem') return 'lg';
    return 'md';
  })();

  return (
    <div className="space-y-4">
      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Button styles</h4>

      <Tabs value={activeDevice} onValueChange={(v) => setActiveDevice(v as any)}>
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="desktop">Desktop</TabsTrigger>
          <TabsTrigger value="mobile">Mobile</TabsTrigger>
        </TabsList>
        <TabsContent value="desktop" className="space-y-3" />
        <TabsContent value="mobile" className="space-y-3" />
      </Tabs>

      <div className="space-y-3">
        <div>
          <Label className="text-xs">Size</Label>
          <Select value={currentSize} onValueChange={(v) => update(sizeToStyles(v as any))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sm">Small</SelectItem>
              <SelectItem value="md">Medium</SelectItem>
              <SelectItem value="lg">Large</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <ColorPicker
            label="Text Color"
            color={(stylesForDevice?.color as string) || ''}
            onChange={(val) => update({ color: val })}
          />
          
          <ColorPicker
            label="Background Color"
            color={(stylesForDevice?.backgroundColor as string) || ''}
            onChange={(val) => update({ backgroundColor: val })}
          />
          
          <ColorPicker
            label="Hover Text Color"
            color={(stylesForDevice?.hoverColor as string) || ''}
            onChange={(val) => update({ hoverColor: val })}
          />
          
          <ColorPicker
            label="Hover Background Color"
            color={(stylesForDevice?.hoverBackgroundColor as string) || ''}
            onChange={(val) => update({ hoverBackgroundColor: val })}
          />
        </div>

        <div className="flex items-center gap-2">
          <Button variant="destructive" size="sm" onClick={clearAll}>Clear button styles</Button>
        </div>
      </div>
    </div>
  );
};
