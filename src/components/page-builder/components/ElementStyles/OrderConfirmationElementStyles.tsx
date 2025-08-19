import React from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { ColorPicker } from '@/components/ui/color-picker';
import { Monitor, Smartphone } from 'lucide-react';
import type { PageBuilderElement } from '../../types';

interface Props {
  element: PageBuilderElement;
  onStyleUpdate: (property: string, value: any) => void;
}

export const OrderConfirmationElementStyles: React.FC<Props> = ({ element, onStyleUpdate }) => {
  const [tab, setTab] = React.useState<'desktop' | 'mobile'>('desktop');
  const styles = ((element.styles as any)?.orderConfirmation) || {};

  const getGroup = (group: string) => styles[group] || { responsive: { desktop: {}, mobile: {} } };
  const current = (group: string) => (getGroup(group).responsive?.[tab] || {});

  const updateGroup = (group: string, prop: string, value: any) => {
    const updated = {
      ...styles,
      [group]: {
        responsive: {
          ...(getGroup(group).responsive || {}),
          [tab]: {
            ...current(group),
            [prop]: value,
          },
        },
      },
    };
    onStyleUpdate('orderConfirmation', updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Device</h4>
        <div className="flex gap-2">
          <Button size="sm" variant={tab==='desktop'?'default':'outline'} onClick={() => setTab('desktop')}>
            <Monitor className="h-4 w-4 mr-1"/> Desktop
          </Button>
          <Button size="sm" variant={tab==='mobile'?'default':'outline'} onClick={() => setTab('mobile')}>
            <Smartphone className="h-4 w-4 mr-1"/> Mobile
          </Button>
        </div>
      </div>

      <Separator />

      {/* Title */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Title</h4>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Font Size: {current('title').fontSize || '32px'}</Label>
            <Slider
              value={[parseInt(current('title').fontSize) || 32]}
              onValueChange={([value]) => updateGroup('title', 'fontSize', `${value}px`)}
              max={72}
              min={12}
              step={1}
              className="mt-2"
            />
          </div>
          <div>
            <Label className="text-xs">Color</Label>
            <ColorPicker
              color={current('title').color || '#111827'}
              onChange={(color) => updateGroup('title', 'color', color)}
              compact
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Subtitle */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Subtitle</h4>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Font Size: {current('subtitle').fontSize || '16px'}</Label>
            <Slider
              value={[parseInt(current('subtitle').fontSize) || 16]}
              onValueChange={([value]) => updateGroup('subtitle', 'fontSize', `${value}px`)}
              max={48}
              min={10}
              step={1}
              className="mt-2"
            />
          </div>
          <div>
            <Label className="text-xs">Color</Label>
            <ColorPicker
              color={current('subtitle').color || '#6B7280'}
              onChange={(color) => updateGroup('subtitle', 'color', color)}
              compact
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Section Title */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Section Title</h4>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Font Size: {current('sectionTitle').fontSize || '16px'}</Label>
            <Slider
              value={[parseInt(current('sectionTitle').fontSize) || 16]}
              onValueChange={([value]) => updateGroup('sectionTitle', 'fontSize', `${value}px`)}
              max={32}
              min={10}
              step={1}
              className="mt-2"
            />
          </div>
          <div>
            <Label className="text-xs">Color</Label>
            <ColorPicker
              color={current('sectionTitle').color || '#111827'}
              onChange={(color) => updateGroup('sectionTitle', 'color', color)}
              compact
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Success Icon */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Success Icon</h4>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Icon Color</Label>
            <ColorPicker
              color={current('successIcon').color || '#059669'}
              onChange={(color) => updateGroup('successIcon', 'color', color)}
              compact
            />
          </div>
          <div>
            <Label className="text-xs">Background</Label>
            <ColorPicker
              color={current('successIcon').backgroundColor || '#D1FAE5'}
              onChange={(color) => updateGroup('successIcon', 'backgroundColor', color)}
              compact
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Card */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Card</h4>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Background</Label>
            <ColorPicker
              color={current('card').backgroundColor || '#ffffff'}
              onChange={(color) => updateGroup('card', 'backgroundColor', color)}
              compact
            />
          </div>
          <div>
            <Label className="text-xs">Border Color</Label>
            <ColorPicker
              color={current('card').borderColor || '#E5E7EB'}
              onChange={(color) => updateGroup('card', 'borderColor', color)}
              compact
            />
          </div>
          <div>
            <Label className="text-xs">Border Radius: {current('card').borderRadius || '8px'}</Label>
            <Slider
              value={[parseInt(current('card').borderRadius) || 8]}
              onValueChange={([value]) => updateGroup('card', 'borderRadius', `${value}px`)}
              max={32}
              min={0}
              step={1}
              className="mt-2"
            />
          </div>
        </div>
      </div>
    </div>
  );
};