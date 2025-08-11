import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ElementorPageBuilder } from '@/components/page-builder/ElementorPageBuilder';
import { PageBuilderData } from '@/components/page-builder/types';
import { Button } from '@/components/ui/button';
import { Save, X } from 'lucide-react';

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
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }, [data, onSave, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 m-0 w-screen h-screen max-w-none left-0 top-0 translate-x-0 translate-y-0 rounded-none" onOpenAutoFocus={(e) => e.preventDefault()}>
        <div className="w-full h-full flex flex-col">
          <header className="flex items-center justify-between border-b bg-background px-4 py-2">
            <h1 className="text-lg font-semibold text-foreground">Product Description Builder</h1>
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                <X className="h-4 w-4 mr-2" /> Close
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" /> {saving ? 'Saving...' : 'Save & Close'}
              </Button>
            </div>
          </header>
          <div className="flex-1 min-h-0">
            <ElementorPageBuilder
              initialData={data}
              onChange={(d) => setData(d)}
              onSave={async () => {
                setSaving(true);
                try {
                  onSave(data);
                  onOpenChange(false);
                } finally {
                  setSaving(false);
                }
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
