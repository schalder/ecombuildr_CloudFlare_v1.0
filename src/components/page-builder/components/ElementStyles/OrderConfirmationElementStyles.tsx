import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
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
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">Font Size</Label>
            <Input value={current('title').fontSize || ''} onChange={(e) => updateGroup('title','fontSize', e.target.value)} placeholder="e.g., 32px" />
          </div>
          <div>
            <Label className="text-xs">Color</Label>
            <Input type="color" className="h-10" value={current('title').color || '#111827'} onChange={(e) => updateGroup('title','color', e.target.value)} />
          </div>
        </div>
      </div>

      <Separator />

      {/* Subtitle */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Subtitle</h4>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">Font Size</Label>
            <Input value={current('subtitle').fontSize || ''} onChange={(e) => updateGroup('subtitle','fontSize', e.target.value)} placeholder="e.g., 16px" />
          </div>
          <div>
            <Label className="text-xs">Color</Label>
            <Input type="color" className="h-10" value={current('subtitle').color || '#6B7280'} onChange={(e) => updateGroup('subtitle','color', e.target.value)} />
          </div>
        </div>
      </div>

      <Separator />

      {/* Section Title */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Section Title</h4>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">Font Size</Label>
            <Input value={current('sectionTitle').fontSize || ''} onChange={(e) => updateGroup('sectionTitle','fontSize', e.target.value)} placeholder="e.g., 16px" />
          </div>
          <div>
            <Label className="text-xs">Color</Label>
            <Input type="color" className="h-10" value={current('sectionTitle').color || '#111827'} onChange={(e) => updateGroup('sectionTitle','color', e.target.value)} />
          </div>
        </div>
      </div>

      <Separator />

      {/* Success Icon */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Success Icon</h4>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">Icon Color</Label>
            <Input type="color" className="h-10" value={current('successIcon').color || '#059669'} onChange={(e) => updateGroup('successIcon','color', e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Background</Label>
            <Input type="color" className="h-10" value={current('successIcon').backgroundColor || '#D1FAE5'} onChange={(e) => updateGroup('successIcon','backgroundColor', e.target.value)} />
          </div>
        </div>
      </div>

      <Separator />

      {/* Card */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Card</h4>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">Background</Label>
            <Input type="color" className="h-10" value={current('card').backgroundColor || '#ffffff'} onChange={(e) => updateGroup('card','backgroundColor', e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Border Color</Label>
            <Input type="color" className="h-10" value={current('card').borderColor || '#E5E7EB'} onChange={(e) => updateGroup('card','borderColor', e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Border Radius</Label>
            <Input value={current('card').borderRadius || ''} onChange={(e) => updateGroup('card','borderRadius', e.target.value)} placeholder="e.g., 8px" />
          </div>
        </div>
      </div>
    </div>
  );
};