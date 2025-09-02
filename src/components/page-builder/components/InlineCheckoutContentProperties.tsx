import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { PageBuilderElement } from '@/components/page-builder/types';
import { useStoreProducts } from '@/hooks/useStoreData';
import { CheckoutContentProperties } from './CheckoutContentProperties';
import { useResolvedWebsiteId } from '@/hooks/useResolvedWebsiteId';

interface InlineCheckoutContentPropertiesProps {
  element: PageBuilderElement;
  onUpdate: (property: string, value: any) => void;
}

export const InlineCheckoutContentProperties: React.FC<InlineCheckoutContentPropertiesProps> = ({ element, onUpdate }) => {
  const cfg: any = element.content || {};
  const selectedIds: string[] = Array.isArray(cfg.productIds) ? cfg.productIds : [];
  const defaultProductId: string = cfg.defaultProductId || '';
  const allowSwitching: boolean = cfg.allowSwitching !== false; // default true
  const showQuantity: boolean = cfg.showQuantity !== false; // default true
  const orderBump = cfg.orderBump || { enabled: false, productId: '', label: 'Add this to my order', description: '', prechecked: false };
  const chargeShippingForBump: boolean = cfg.chargeShippingForBump !== false; // default true
  const bumpShippingFee: number = cfg.bumpShippingFee || 0;

  // Resolve websiteId for filtering
  const resolvedWebsiteId = useResolvedWebsiteId(element);
  
  const { products, loading } = useStoreProducts({ websiteId: resolvedWebsiteId });

  const toggleProduct = (id: string, checked: boolean) => {
    const next = checked ? Array.from(new Set([...(selectedIds || []), id])) : (selectedIds || []).filter((pid) => pid !== id);
    onUpdate('productIds', next);
    // Keep defaultProductId valid
    if (next.length > 0) {
      if (!next.includes(defaultProductId)) {
        onUpdate('defaultProductId', next[0]);
      }
    } else {
      onUpdate('defaultProductId', '');
    }
  };

  const handleDefaultChange = (id: string) => {
    onUpdate('defaultProductId', id);
    if (!selectedIds.includes(id)) {
      onUpdate('productIds', Array.from(new Set([...(selectedIds || []), id])));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-medium">Inline Checkout Products</h4>
        <p className="text-xs text-muted-foreground">Select products to show on this checkout form and choose the default one.</p>
      </div>

      <div className="space-y-3">
        <Label className="text-sm">Available Products</Label>
        <div className="border rounded-md p-3 max-h-60 overflow-auto space-y-2">
          {loading && <div className="text-xs text-muted-foreground">Loading products…</div>}
          {!loading && products.length === 0 && (
            <div className="text-xs text-muted-foreground">No products found for this store.</div>
          )}
          {!loading && products.map((p) => {
            const checked = (selectedIds || []).includes(p.id);
            return (
              <label key={p.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={checked} onChange={(e) => toggleProduct(p.id, e.target.checked)} />
                <span className="truncate">{p.name}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2">
        <Label className="text-sm">Default Product</Label>
        <Select value={defaultProductId || (selectedIds[0] || '')} onValueChange={handleDefaultChange}>
          <SelectTrigger>
            <SelectValue placeholder={selectedIds.length ? 'Select default product' : 'No products selected'} />
          </SelectTrigger>
          <SelectContent>
            {(selectedIds.length ? products.filter((p) => selectedIds.includes(p.id)) : products).map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" checked={!!allowSwitching} onChange={(e) => onUpdate('allowSwitching', e.target.checked)} />
        <Label className="text-sm">Allow switching between products</Label>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" checked={!!showQuantity} onChange={(e) => onUpdate('showQuantity', e.target.checked)} />
        <Label className="text-sm">Show quantity selector</Label>
      </div>

      <Separator />

      <div className="space-y-3">
        <h4 className="text-sm font-medium">Order Bump (Optional)</h4>
        <div className="flex items-center gap-2">
          <input type="checkbox" checked={!!orderBump.enabled} onChange={(e) => onUpdate('orderBump', { ...orderBump, enabled: e.target.checked })} />
          <Label className="text-sm">Enable order bump</Label>
        </div>
        {orderBump.enabled && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-2">
              <Label className="text-sm">Bump Product</Label>
              <Select value={orderBump.productId || ''} onValueChange={(v) => onUpdate('orderBump', { ...orderBump, productId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select bump product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">Bump Label</Label>
              <Input value={orderBump.label || ''} onChange={(e) => onUpdate('orderBump', { ...orderBump, label: e.target.value })} placeholder="Add this to my order" />
            </div>
            <div>
              <Label className="text-sm">Bump Description</Label>
              <Textarea value={orderBump.description || ''} onChange={(e) => onUpdate('orderBump', { ...orderBump, description: e.target.value })} placeholder="Brief description shown under the label" rows={3} />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={!!orderBump.prechecked} onChange={(e) => onUpdate('orderBump', { ...orderBump, prechecked: e.target.checked })} />
              <Label className="text-sm">Pre-check by default</Label>
            </div>
            
            <Separator />
            
            <div className="space-y-3">
              <h5 className="text-sm font-medium">Order Bump Shipping</h5>
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={!!chargeShippingForBump} 
                  onChange={(e) => onUpdate('chargeShippingForBump', e.target.checked)} 
                />
                <Label className="text-sm">Charge shipping for order bump</Label>
              </div>
              {chargeShippingForBump && (
                <div>
                  <Label className="text-sm">Bump Shipping Fee</Label>
                  <Input 
                    type="number" 
                    step="0.01" 
                    min="0" 
                    value={bumpShippingFee} 
                    onChange={(e) => onUpdate('bumpShippingFee', parseFloat(e.target.value) || 0)} 
                    placeholder="0.00" 
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <Separator />

      {/* Reuse existing checkout content controls (fields, trust badge, terms, custom fields) */}
      <CheckoutContentProperties element={element} onUpdate={onUpdate} />
    </div>
  );
};
