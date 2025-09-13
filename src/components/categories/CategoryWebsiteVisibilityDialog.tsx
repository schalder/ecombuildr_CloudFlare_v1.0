import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useStoreWebsitesForSelection } from '@/hooks/useWebsiteVisibility';

interface CategoryWebsiteVisibilityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: any | null;
  storeId: string;
  onUpdateVisibility: (categoryId: string, websiteIds: string[]) => void;
  isLoading?: boolean;
}

export const CategoryWebsiteVisibilityDialog = ({
  open,
  onOpenChange,
  category,
  storeId,
  onUpdateVisibility,
  isLoading = false
}: CategoryWebsiteVisibilityDialogProps) => {
  const { websites } = useStoreWebsitesForSelection(storeId);
  const [selectedWebsites, setSelectedWebsites] = useState<string[]>([]);

  useEffect(() => {
    if (category) {
      const raw = (category as any).category_website_visibility;
      const list = Array.isArray(raw) ? raw : [];
      const visibleWebsiteIds = list.map((v: any) => v.website_id);
      setSelectedWebsites(visibleWebsiteIds);
    } else {
      setSelectedWebsites([]);
    }
  }, [category]);

  const handleWebsiteToggle = (websiteId: string, checked: boolean) => {
    if (checked) {
      setSelectedWebsites(prev => [...prev, websiteId]);
    } else {
      setSelectedWebsites(prev => prev.filter(id => id !== websiteId));
    }
  };

  const handleSave = () => {
    if (category) {
      onUpdateVisibility(category.id, selectedWebsites);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage Website Visibility</DialogTitle>
          <DialogDescription>
            Choose which websites this category "{category?.name}" should be visible on.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {websites.length > 0 ? (
            websites.map((website) => (
              <div key={website.id} className="flex items-center justify-between">
                <Label htmlFor={`website-${website.id}`} className="flex-1">
                  {website.name}
                  <span className="text-muted-foreground text-sm ml-2">({website.slug})</span>
                </Label>
                <Switch
                  id={`website-${website.id}`}
                  checked={selectedWebsites.includes(website.id)}
                  onCheckedChange={(checked) => handleWebsiteToggle(website.id, checked)}
                  disabled={isLoading}
                />
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-center py-4">
              No websites found. Create a website first to manage category visibility.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isLoading || websites.length === 0}
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};