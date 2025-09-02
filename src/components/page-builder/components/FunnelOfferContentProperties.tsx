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

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="show-product-name"
            checked={element.content.showProductName !== false}
            onChange={(e) => onUpdate('showProductName', e.target.checked)}
            className="rounded"
          />
          <Label htmlFor="show-product-name" className="text-xs">Show Product Name</Label>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="show-price"
            checked={element.content.showPrice !== false}
            onChange={(e) => onUpdate('showPrice', e.target.checked)}
            className="rounded"
          />
          <Label htmlFor="show-price" className="text-xs">Show Price</Label>
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