import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ElementorPageBuilder } from '@/components/page-builder/ElementorPageBuilder';
import { PageBuilderData } from '@/components/page-builder/types';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ProductDescriptionBuilderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: PageBuilderData;
  onSave: (data: PageBuilderData) => void;
}

const ProductDescriptionBuilderDialog: React.FC<ProductDescriptionBuilderDialogProps> = ({
  open,
  onOpenChange,
  initialData,
  onSave,
}) => {
  const [data, setData] = React.useState<PageBuilderData>(initialData || { sections: [] });
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    setData(initialData || { sections: [] });
  }, [initialData]);

  const handleSave = React.useCallback(async () => {
    setSaving(true);
    try {
      onSave(data);
      toast({ title: 'Saved', description: 'Description saved successfully.' });
    } finally {
      setSaving(false);
    }
  }, [data, onSave]);

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleSave]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 m-0 w-screen h-screen max-w-none left-0 top-0 translate-x-0 translate-y-0 rounded-none" onOpenAutoFocus={(e) => e.preventDefault()}>
        <div className="w-full h-full flex flex-col">
          <header className="flex items-center justify-between border-b bg-background px-4 py-2">
            <h1 className="text-lg font-semibold text-foreground">Product Description Builder</h1>
            <div className="flex items-center gap-2">
              <Button onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" /> {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </header>
          <div className="flex-1 min-h-0">
            <ElementorPageBuilder
              initialData={data}
              onChange={(d) => setData(d)}
              onSave={async () => {
                await handleSave();
              }}
              isSaving={saving}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDescriptionBuilderDialog;
