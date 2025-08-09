import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import type { PageBuilderElement } from '../types';

interface Props {
  element: PageBuilderElement;
  onUpdate: (property: string, value: any) => void;
}

export const OrderConfirmationContentProperties: React.FC<Props> = ({ element, onUpdate }) => {
  const content: any = element.content || {};
  const texts = content.texts || {
    title: 'Order Confirmed!',
    subtitle: 'Thank you for your order.',
    customerTitle: 'Customer',
    shippingTitle: 'Shipping',
    itemsTitle: 'Items',
  };
  const show = content.show || { email: true, phone: true, notes: true };

  const updateTexts = (key: keyof typeof texts, value: string) => {
    onUpdate('texts', { ...texts, [key]: value });
  };
  const updateShow = (key: keyof typeof show, value: boolean) => {
    onUpdate('show', { ...show, [key]: value });
  };

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Headings</h4>
        <div className="space-y-2 mt-2">
          <div>
            <Label className="text-xs">Main Title</Label>
            <Input value={texts.title} onChange={(e) => updateTexts('title', e.target.value)} placeholder="Order Confirmed!" />
          </div>
          <div>
            <Label className="text-xs">Subtitle</Label>
            <Input value={texts.subtitle} onChange={(e) => updateTexts('subtitle', e.target.value)} placeholder="Thank you for your order." />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Customer Section Title</Label>
              <Input value={texts.customerTitle} onChange={(e) => updateTexts('customerTitle', e.target.value)} placeholder="Customer" />
            </div>
            <div>
              <Label className="text-xs">Shipping Section Title</Label>
              <Input value={texts.shippingTitle} onChange={(e) => updateTexts('shippingTitle', e.target.value)} placeholder="Shipping" />
            </div>
          </div>
          <div>
            <Label className="text-xs">Items Section Title</Label>
            <Input value={texts.itemsTitle} onChange={(e) => updateTexts('itemsTitle', e.target.value)} placeholder="Items" />
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Visibility</h4>
        <div className="flex items-center justify-between mt-2">
          <Label className="text-xs">Show Phone</Label>
          <Switch checked={!!show.phone} onCheckedChange={(v) => updateShow('phone', !!v)} />
        </div>
        <div className="flex items-center justify-between mt-2">
          <Label className="text-xs">Show Email</Label>
          <Switch checked={!!show.email} onCheckedChange={(v) => updateShow('email', !!v)} />
        </div>
      </div>
    </div>
  );
};
