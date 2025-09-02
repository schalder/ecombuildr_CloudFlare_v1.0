import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { PageBuilderElement } from '../types';
import { useFunnelStepContext } from '@/contexts/FunnelStepContext';
import { FunnelStepSettingsModal } from '@/components/modals/FunnelStepSettingsModal';

interface FunnelOfferContentPropertiesProps {
  element: PageBuilderElement;
  onUpdate: (property: string, value: any) => void;
}

export const FunnelOfferContentProperties: React.FC<FunnelOfferContentPropertiesProps> = ({
  element,
  onUpdate
}) => {
  const { stepId, funnelId } = useFunnelStepContext();
  const [showStepSettings, setShowStepSettings] = React.useState(false);

  return (
    <div className="space-y-6">
      {/* Basic Content */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium">Offer Content</h3>
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
      </div>

      {/* Product & Redirect Configuration */}
      <div className="space-y-4 border-t pt-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Product & Redirect Settings</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowStepSettings(true)}
            disabled={!stepId || !funnelId}
          >
            <Settings className="h-4 w-4 mr-1" />
            Configure
          </Button>
        </div>
        
        <div className="text-xs text-muted-foreground p-3 bg-muted rounded-lg">
          <p className="font-medium mb-1">Offer Configuration</p>
          <p>
            Configure which product to offer and where to redirect users after they accept or decline.
            These settings are managed at the funnel step level.
          </p>
        </div>
      </div>

      {showStepSettings && stepId && funnelId && (
        <FunnelStepSettingsModal
          isOpen={showStepSettings}
          onClose={() => setShowStepSettings(false)}
          stepId={stepId}
          funnelId={funnelId}
        />
      )}
    </div>
  );
};