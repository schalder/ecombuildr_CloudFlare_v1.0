import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FunnelStepSettingsPanel } from '@/components/page-builder/components/FunnelStepSettingsPanel';

interface FunnelStepSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stepId: string;
  funnelId: string;
}

export const FunnelStepSettingsModal: React.FC<FunnelStepSettingsModalProps> = ({
  isOpen,
  onClose,
  stepId,
  funnelId,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Funnel Step Settings</DialogTitle>
        </DialogHeader>
        
        <FunnelStepSettingsPanel
          stepId={stepId}
          funnelId={funnelId}
          onClose={onClose}
        />
      </DialogContent>
    </Dialog>
  );
};