import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { PageBuilderElement } from '@/components/page-builder/types';
import { MediaSelector } from './MediaSelector';

interface CheckoutContentPropertiesProps {
  element: PageBuilderElement;
  onUpdate: (property: string, value: any) => void;
}

const defaultFields = {
  fullName: { enabled: true, required: true, placeholder: 'Full Name' },
  phone: { enabled: true, required: true, placeholder: 'Phone Number' },
  email: { enabled: true, required: false, placeholder: 'Email Address' },
  address: { enabled: true, required: true, placeholder: 'Street address' },
  city: { enabled: true, required: true, placeholder: 'City' },
  area: { enabled: true, required: false, placeholder: 'Area' },
  country: { enabled: true, required: false, placeholder: 'Country' },
  state: { enabled: true, required: false, placeholder: 'State/Province' },
  postalCode: { enabled: true, required: false, placeholder: 'ZIP / Postal code' },
};

export const CheckoutContentProperties: React.FC<CheckoutContentPropertiesProps> = ({ element, onUpdate }) => {
  const fields = element.content?.fields || defaultFields;
  const customFields = element.content?.customFields || [];
  const terms = element.content?.terms || { enabled: false, required: true, label: 'I agree to the Terms & Conditions', url: '/terms' };
  const trust = element.content?.trustBadge || { enabled: false, imageUrl: '', alt: 'Secure checkout' };
  const buttonLabel = element.content?.placeOrderLabel || 'Place Order';
  const showItemImages = element.content?.showItemImages ?? true;

  const updateField = (key: string, updates: any) => {
    onUpdate('fields', { ...fields, [key]: { ...(fields as any)[key], ...updates } });
  };

  const addCustomField = () => {
    const next = [...customFields, { id: `cf_${Date.now()}`, label: 'Custom Field', placeholder: '', type: 'text', required: false, enabled: true }];
    onUpdate('customFields', next);
  };

  const updateCustomField = (idx: number, updates: any) => {
    const next = [...customFields];
    next[idx] = { ...next[idx], ...updates };
    onUpdate('customFields', next);
  };

  const removeCustomField = (idx: number) => {
    const next = customFields.filter((_: any, i: number) => i !== idx);
    onUpdate('customFields', next);
  };

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-sm">Place Order Button Text</Label>
        <Input value={buttonLabel} onChange={(e) => onUpdate('placeOrderLabel', e.target.value)} placeholder="Place Order" />
      </div>

      <div>
        <Label className="text-sm">Button Subtext (Optional)</Label>
        <Input 
          value={element.content?.placeOrderSubtext || ''} 
          onChange={(e) => onUpdate('placeOrderSubtext', e.target.value)} 
          placeholder="Add subtext below button..." 
        />
      </div>

      {element.content?.placeOrderSubtext && (
        <div>
          <Label className="text-sm">Subtext Position</Label>
          <Select
            value={element.content?.placeOrderSubtextPosition || 'below'}
            onValueChange={(value) => onUpdate('placeOrderSubtextPosition', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="below">Below Main Text</SelectItem>
              <SelectItem value="above">Above Main Text</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <Separator />

      <Accordion type="multiple" className="w-full">
        <AccordionItem value="headings">
          <AccordionTrigger className="text-sm">Section Headings</AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <Label className="text-sm">Customer Information</Label>
                <Input value={(element.content?.headings?.info ?? 'Customer Information')} onChange={(e) => onUpdate('headings', { ...(element.content?.headings || {}), info: e.target.value })} />
              </div>
              <div>
                <Label className="text-sm">Shipping</Label>
                <Input value={(element.content?.headings?.shipping ?? 'Shipping')} onChange={(e) => onUpdate('headings', { ...(element.content?.headings || {}), shipping: e.target.value })} />
              </div>
              <div>
                <Label className="text-sm">Payment</Label>
                <Input value={(element.content?.headings?.payment ?? 'Payment')} onChange={(e) => onUpdate('headings', { ...(element.content?.headings || {}), payment: e.target.value })} />
              </div>
              <div>
                <Label className="text-sm">Order Summary</Label>
                <Input value={(element.content?.headings?.summary ?? 'Order Summary')} onChange={(e) => onUpdate('headings', { ...(element.content?.headings || {}), summary: e.target.value })} />
              </div>
              <div>
                <Label className="text-sm">Custom Fields</Label>
                <Input value={(element.content?.headings?.customFields ?? 'Additional Information')} onChange={(e) => onUpdate('headings', { ...(element.content?.headings || {}), customFields: e.target.value })} />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="info">
          <AccordionTrigger className="text-sm">Your Information</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              {/* Full Name */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={!!fields.fullName.enabled} onChange={(e) => updateField('fullName', { enabled: e.target.checked })} />
                  <Label className="text-sm">Full Name</Label>
                  <input type="checkbox" className="ml-4" checked={!!fields.fullName.required} onChange={(e) => updateField('fullName', { required: e.target.checked })} />
                  <Label className="text-sm">Required</Label>
                </div>
                <Input value={fields.fullName.placeholder} onChange={(e) => updateField('fullName', { placeholder: e.target.value })} placeholder="Placeholder" />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={!!fields.phone.enabled} onChange={(e) => updateField('phone', { enabled: e.target.checked })} />
                  <Label className="text-sm">Phone</Label>
                  <input type="checkbox" className="ml-4" checked={!!fields.phone.required} onChange={(e) => updateField('phone', { required: e.target.checked })} />
                  <Label className="text-sm">Required</Label>
                </div>
                <Input value={fields.phone.placeholder} onChange={(e) => updateField('phone', { placeholder: e.target.value })} placeholder="Placeholder" />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={!!fields.email.enabled} onChange={(e) => updateField('email', { enabled: e.target.checked })} />
                  <Label className="text-sm">Email</Label>
                  <input type="checkbox" className="ml-4" checked={!!fields.email.required} onChange={(e) => updateField('email', { required: e.target.checked })} />
                  <Label className="text-sm">Required</Label>
                </div>
                <Input value={fields.email.placeholder} onChange={(e) => updateField('email', { placeholder: e.target.value })} placeholder="Placeholder" />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="shipping">
          <AccordionTrigger className="text-sm">Shipping Address</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={!!fields.address.enabled} onChange={(e) => updateField('address', { enabled: e.target.checked })} />
                  <Label className="text-sm">Address</Label>
                  <input type="checkbox" className="ml-4" checked={!!fields.address.required} onChange={(e) => updateField('address', { required: e.target.checked })} />
                  <Label className="text-sm">Required</Label>
                </div>
                <Input value={fields.address.placeholder} onChange={(e) => updateField('address', { placeholder: e.target.value })} placeholder="Placeholder" />
              </div>
              <div className="space-y-3">
                {/* City */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={!!fields.city.enabled} onChange={(e) => updateField('city', { enabled: e.target.checked })} />
                    <Label className="text-sm">City</Label>
                    <input type="checkbox" className="ml-4" checked={!!fields.city.required} onChange={(e) => updateField('city', { required: e.target.checked })} />
                    <Label className="text-sm">Required</Label>
                  </div>
                  <Input value={fields.city.placeholder} onChange={(e) => updateField('city', { placeholder: e.target.value })} placeholder="Placeholder" />
                </div>

                {/* Area */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={!!fields.area.enabled} onChange={(e) => updateField('area', { enabled: e.target.checked })} />
                    <Label className="text-sm">Area</Label>
                    <input type="checkbox" className="ml-4" checked={!!fields.area.required} onChange={(e) => updateField('area', { required: e.target.checked })} />
                    <Label className="text-sm">Required</Label>
                  </div>
                  <Input value={fields.area.placeholder} onChange={(e) => updateField('area', { placeholder: e.target.value })} placeholder="Placeholder" />
                </div>

                {/* Country */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={!!fields.country.enabled} onChange={(e) => updateField('country', { enabled: e.target.checked })} />
                    <Label className="text-sm">Country</Label>
                    <input type="checkbox" className="ml-4" checked={!!fields.country.required} onChange={(e) => updateField('country', { required: e.target.checked })} />
                    <Label className="text-sm">Required</Label>
                  </div>
                  <Input value={fields.country.placeholder} onChange={(e) => updateField('country', { placeholder: e.target.value })} placeholder="Placeholder" />
                </div>

                {/* State */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={!!fields.state.enabled} onChange={(e) => updateField('state', { enabled: e.target.checked })} />
                    <Label className="text-sm">State/Province</Label>
                    <input type="checkbox" className="ml-4" checked={!!fields.state.required} onChange={(e) => updateField('state', { required: e.target.checked })} />
                    <Label className="text-sm">Required</Label>
                  </div>
                  <Input value={fields.state.placeholder} onChange={(e) => updateField('state', { placeholder: e.target.value })} placeholder="Placeholder" />
                </div>

                {/* Postal Code */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={!!fields.postalCode.enabled} onChange={(e) => updateField('postalCode', { enabled: e.target.checked })} />
                    <Label className="text-sm">ZIP / Postal code</Label>
                    <input type="checkbox" className="ml-4" checked={!!fields.postalCode.required} onChange={(e) => updateField('postalCode', { required: e.target.checked })} />
                    <Label className="text-sm">Required</Label>
                  </div>
                  <Input value={fields.postalCode.placeholder} onChange={(e) => updateField('postalCode', { placeholder: e.target.value })} placeholder="Placeholder" />
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="summary">
          <AccordionTrigger className="text-sm">Product Summary</AccordionTrigger>
          <AccordionContent>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={!!showItemImages} onChange={(e) => onUpdate('showItemImages', e.target.checked)} />
              <Label className="text-sm">Show item images</Label>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="trust">
          <AccordionTrigger className="text-sm">Trust Badge</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={!!trust.enabled} onChange={(e) => onUpdate('trustBadge', { ...trust, enabled: e.target.checked })} />
                <Label className="text-sm">Show trust badge</Label>
              </div>
              {trust.enabled && (
                  <div className="space-y-3">
                    <MediaSelector value={trust.imageUrl} onChange={(url) => onUpdate('trustBadge', { ...trust, imageUrl: url })} label="Badge image" />
                    <div>
                      <Label className="text-sm">Alt text</Label>
                      <Input value={trust.alt} onChange={(e) => onUpdate('trustBadge', { ...trust, alt: e.target.value })} placeholder="Secure checkout" />
                    </div>
                  </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="terms">
          <AccordionTrigger className="text-sm">Terms & Conditions</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={!!terms.enabled} onChange={(e) => onUpdate('terms', { ...terms, enabled: e.target.checked })} />
                <Label className="text-sm">Show terms checkbox</Label>
              </div>
              {terms.enabled && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={!!terms.required} onChange={(e) => onUpdate('terms', { ...terms, required: e.target.checked })} />
                    <Label className="text-sm">Require acceptance</Label>
                  </div>
                  <div>
                    <Label className="text-sm">Label</Label>
                    <Input value={terms.label} onChange={(e) => onUpdate('terms', { ...terms, label: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-sm">Terms page URL</Label>
                    <Input value={terms.url} onChange={(e) => onUpdate('terms', { ...terms, url: e.target.value })} placeholder="/terms" />
                  </div>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="custom">
          <AccordionTrigger className="text-sm">Custom Fields</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Manage fields</span>
                <Button size="sm" className="h-7" onClick={addCustomField}>Add Field</Button>
              </div>
              <div className="space-y-2">
                {customFields.map((cf: any, idx: number) => (
                  <div key={cf.id} className="border rounded-md p-3 space-y-3">
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm">Label</Label>
                        <Input value={cf.label} onChange={(e) => updateCustomField(idx, { label: e.target.value })} />
                      </div>
                      <div>
                        <Label className="text-sm">Placeholder</Label>
                        <Input value={cf.placeholder || ''} onChange={(e) => updateCustomField(idx, { placeholder: e.target.value })} />
                      </div>
                      <div>
                        <Label className="text-sm">Type</Label>
                        <Select value={cf.type || 'text'} onValueChange={(v) => updateCustomField(idx, { type: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Text</SelectItem>
                            <SelectItem value="textarea">Textarea</SelectItem>
                            <SelectItem value="number">Number</SelectItem>
                            <SelectItem value="email">Email</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-6">
                        <label className="flex items-center gap-2">
                          <input type="checkbox" checked={!!cf.required} onChange={(e) => updateCustomField(idx, { required: e.target.checked })} />
                          <span className="text-sm">Required</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input type="checkbox" checked={!!cf.enabled} onChange={(e) => updateCustomField(idx, { enabled: e.target.checked })} />
                          <span className="text-sm">Enabled</span>
                        </label>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button size="sm" variant="ghost" className="h-8 text-destructive hover:text-destructive" onClick={() => removeCustomField(idx)}>
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
                {customFields.length === 0 && (
                  <div className="text-center text-muted-foreground text-sm py-2">No custom fields. Click Add Field to create one.</div>
                )}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

    </div>
  );
};
