import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface CloneFunnelModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  funnelId: string;
  funnelName: string;
  onSuccess?: (clonedFunnelId: string) => void;
}

export const CloneFunnelModal: React.FC<CloneFunnelModalProps> = ({
  open,
  onOpenChange,
  funnelId,
  funnelName,
  onSuccess,
}) => {
  const { toast } = useToast();
  const [newName, setNewName] = useState(`${funnelName} - Copy`);
  const [isCloning, setIsCloning] = useState(false);

  const handleClone = async () => {
    if (!newName.trim()) {
      toast({
        title: 'Name required',
        description: 'Please enter a name for the cloned funnel.',
        variant: 'destructive',
      });
      return;
    }

    setIsCloning(true);
    try {
      const { data, error } = await supabase.functions.invoke('clone-funnel', {
        body: {
          source_funnel_id: funnelId,
          new_name: newName.trim(),
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: 'Funnel cloned successfully',
          description: `"${data.name}" has been created with ${data.steps_cloned || 0} step(s).`,
        });

        if (onSuccess) {
          onSuccess(data.funnel_id);
        }

        onOpenChange(false);
        setNewName(`${funnelName} - Copy`);
      } else {
        throw new Error(data?.error || 'Failed to clone funnel');
      }
    } catch (error: any) {
      console.error('Error cloning funnel:', error);
      toast({
        title: 'Error cloning funnel',
        description: error.message || 'An error occurred while cloning the funnel.',
        variant: 'destructive',
      });
    } finally {
      setIsCloning(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Clone Funnel</DialogTitle>
          <DialogDescription>
            Create a copy of "{funnelName}" with all its steps. The cloned funnel will be created as a draft.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="clone-name">New Funnel Name</Label>
            <Input
              id="clone-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Enter funnel name"
              disabled={isCloning}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isCloning) {
                  handleClone();
                }
              }}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isCloning}
            >
              Cancel
            </Button>
            <Button onClick={handleClone} disabled={isCloning}>
              {isCloning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Clone Funnel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

