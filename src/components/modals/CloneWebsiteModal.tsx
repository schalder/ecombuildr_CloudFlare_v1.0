import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface CloneWebsiteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  websiteId: string;
  websiteName: string;
  onSuccess?: (clonedWebsiteId: string) => void;
}

export const CloneWebsiteModal: React.FC<CloneWebsiteModalProps> = ({
  open,
  onOpenChange,
  websiteId,
  websiteName,
  onSuccess,
}) => {
  const { toast } = useToast();
  const [newName, setNewName] = useState(`${websiteName} - Copy`);
  const [isCloning, setIsCloning] = useState(false);

  const handleClone = async () => {
    if (!newName.trim()) {
      toast({
        title: 'Name required',
        description: 'Please enter a name for the cloned website.',
        variant: 'destructive',
      });
      return;
    }

    setIsCloning(true);
    try {
      const { data, error } = await supabase.functions.invoke('clone-website', {
        body: {
          source_website_id: websiteId,
          new_name: newName.trim(),
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: 'Website cloned successfully',
          description: `"${data.name}" has been created with ${data.pages_cloned || 0} page(s).`,
        });

        if (onSuccess) {
          onSuccess(data.website_id);
        }

        onOpenChange(false);
        setNewName(`${websiteName} - Copy`);
      } else {
        throw new Error(data?.error || 'Failed to clone website');
      }
    } catch (error: any) {
      console.error('Error cloning website:', error);
      toast({
        title: 'Error cloning website',
        description: error.message || 'An error occurred while cloning the website.',
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
          <DialogTitle>Clone Website</DialogTitle>
          <DialogDescription>
            Create a copy of "{websiteName}" with all its pages. The cloned website will be created as a draft.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="clone-name">New Website Name</Label>
            <Input
              id="clone-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Enter website name"
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
              Clone Website
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

