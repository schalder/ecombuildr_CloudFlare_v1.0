import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { FunnelStepSettingsModal } from '@/components/modals/FunnelStepSettingsModal';

interface FunnelStepToolbarProps {
  stepId: string;
  funnelId: string;
}

export const FunnelStepToolbar: React.FC<FunnelStepToolbarProps> = ({
  stepId,
  funnelId,
}) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsSettingsOpen(true)}
        className="flex items-center gap-2"
      >
        <Settings className="h-4 w-4" />
        Step Settings
      </Button>

      <FunnelStepSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        stepId={stepId}
        funnelId={funnelId}
      />
    </>
  );
};