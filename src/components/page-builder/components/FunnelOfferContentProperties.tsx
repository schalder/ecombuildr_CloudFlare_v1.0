import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageBuilderElement } from '../types';

interface FunnelOfferContentPropertiesProps {
  element: PageBuilderElement;
  onUpdate: (property: string, value: any) => void;
}

export const FunnelOfferContentProperties: React.FC<FunnelOfferContentPropertiesProps> = ({
  element,
  onUpdate
}) => {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="offer-title">Offer Title</Label>
        <Input
          id="offer-title"
          value={element.content.title || 'Special Offer'}
          onChange={(e) => onUpdate('title', e.target.value)}
          placeholder="Special Offer"
        />
      </div>

      <div>
        <Label htmlFor="offer-description">Description</Label>
        <Textarea
          id="offer-description"
          value={element.content.description || "Don't miss this exclusive offer!"}
          onChange={(e) => onUpdate('description', e.target.value)}
          placeholder="Don't miss this exclusive offer!"
          className="min-h-[60px]"
        />
      </div>

      <div>
        <Label htmlFor="accept-text">Accept Button Text</Label>
        <Input
          id="accept-text"
          value={element.content.acceptText || 'Yes, I Want This!'}
          onChange={(e) => onUpdate('acceptText', e.target.value)}
          placeholder="Yes, I Want This!"
        />
      </div>

      <div>
        <Label htmlFor="decline-text">Decline Link Text</Label>
        <Input
          id="decline-text"
          value={element.content.declineText || 'No Thanks'}
          onChange={(e) => onUpdate('declineText', e.target.value)}
          placeholder="No Thanks"
        />
      </div>

      <div className="text-xs text-muted-foreground p-3 bg-muted rounded-lg">
        <p className="font-medium mb-2">Dynamic Content</p>
        <p>The product name, original price, and offer price are automatically loaded from the funnel step configuration. Use the Step Settings panel to configure the offer product and pricing.</p>
      </div>
    </div>
  );
};