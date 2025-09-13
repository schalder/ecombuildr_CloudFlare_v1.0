import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
  const [selectedWebsite, setSelectedWebsite] = useState<string>('');

  useEffect(() => {
    if (category) {
      const raw = (category as any).category_website_visibility;
      const list = Array.isArray(raw) ? raw : [];
      const visibleWebsiteIds = list.map((v: any) => v.website_id);
      setSelectedWebsite(visibleWebsiteIds[0] || '');
    } else {
      setSelectedWebsite('');
    }
  }, [category]);

  // Single selection; no toggle function needed

  const handleSave = () => {
    if (category) {
      const ids = selectedWebsite ? [selectedWebsite] : [];
      onUpdateVisibility(category.id, ids);
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
            <RadioGroup value={selectedWebsite} onValueChange={setSelectedWebsite} className="space-y-3">
              {websites.map((website) => (
                <div key={website.id} className="flex items-center justify-between">
                  <Label htmlFor={`website-${website.id}`} className="flex-1">
                    {website.name}
                    <span className="text-muted-foreground text-sm ml-2">({website.slug})</span>
                  </Label>
                  <RadioGroupItem
                    id={`website-${website.id}`}
                    value={website.id}
                    disabled={isLoading}
                  />
                </div>
              ))}
            </RadioGroup>
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
            disabled={isLoading || websites.length === 0 || !selectedWebsite}
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};