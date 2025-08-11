import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { DragDropPageBuilder } from '@/components/page-builder/DragDropPageBuilder';
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
      <DialogContent className="p-0 max-w-[95vw] w-[95vw] h-[95vh]" onOpenAutoFocus={(e) => e.preventDefault()}>
        <div className="w-full h-full">
          <DragDropPageBuilder
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
