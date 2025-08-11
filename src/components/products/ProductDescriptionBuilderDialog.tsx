import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ElementorPageBuilder } from '@/components/page-builder/ElementorPageBuilder';
import { PageBuilderData } from '@/components/page-builder/types';

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 m-0 w-screen h-screen max-w-none left-0 top-0 translate-x-0 translate-y-0 rounded-none" onOpenAutoFocus={(e) => e.preventDefault()}>
        <div className="w-full h-full">
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
      </DialogContent>
    </Dialog>
  );
};

export default ProductDescriptionBuilderDialog;
