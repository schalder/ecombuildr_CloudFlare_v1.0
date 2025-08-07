import React from 'react';
import { Plus, Trash2, Star, Upload, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ImageUpload } from '@/components/ui/image-upload';
import { PageBuilderElement } from '../types';

interface ContentPropertiesProps {
  element: PageBuilderElement;
  onUpdate: (property: string, value: any) => void;
}

// Testimonial Content Properties
export const TestimonialContentProperties: React.FC<ContentPropertiesProps> = ({
  element,
  onUpdate
}) => {
  const handleRatingChange = (rating: number) => {
    onUpdate('rating', rating);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-xs">Testimonial Text</Label>
        <Textarea
          value={element.content.testimonial || ''}
          onChange={(e) => onUpdate('testimonial', e.target.value)}
          placeholder="Enter testimonial text..."
          className="min-h-[80px]"
        />
      </div>

      <div>
        <Label className="text-xs">Rating</Label>
        <div className="flex items-center space-x-1 mt-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => handleRatingChange(star)}
              className="p-1 hover:scale-110 transition-transform"
            >
              <Star
                className={`h-5 w-5 ${
                  star <= (element.content.rating || 5)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300 hover:text-yellow-300'
                }`}
              />
            </button>
          ))}
          <span className="ml-2 text-xs text-muted-foreground">
            {element.content.rating || 5}/5
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Author Name</Label>
          <Input
            value={element.content.author || ''}
            onChange={(e) => onUpdate('author', e.target.value)}
            placeholder="John Doe"
          />
        </div>
        <div>
          <Label className="text-xs">Position</Label>
          <Input
            value={element.content.position || ''}
            onChange={(e) => onUpdate('position', e.target.value)}
            placeholder="CEO, Company"
          />
        </div>
      </div>

      <div>
        <Label className="text-xs">Avatar Image</Label>
        <ImageUpload
          value={element.content.avatar || ''}
          onChange={(url) => onUpdate('avatar', url)}
        />
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="showQuote"
          checked={element.content.showQuote !== false}
          onChange={(e) => onUpdate('showQuote', e.target.checked)}
        />
        <Label htmlFor="showQuote" className="text-xs">Show quote icon</Label>
      </div>
    </div>
  );
};

// FAQ Content Properties
export const FAQContentProperties: React.FC<ContentPropertiesProps> = ({
  element,
  onUpdate
}) => {
  const faqs = element.content.faqs || [];

  const addFAQ = () => {
    const newFAQs = [...faqs, { question: 'New question?', answer: 'Your answer here.' }];
    onUpdate('faqs', newFAQs);
  };

  const removeFAQ = (index: number) => {
    const newFAQs = faqs.filter((_: any, i: number) => i !== index);
    onUpdate('faqs', newFAQs);
  };

  const updateFAQ = (index: number, field: 'question' | 'answer', value: string) => {
    const newFAQs = [...faqs];
    newFAQs[index] = { ...newFAQs[index], [field]: value };
    onUpdate('faqs', newFAQs);
  };

  const moveFAQ = (index: number, direction: 'up' | 'down') => {
    const newFAQs = [...faqs];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex >= 0 && newIndex < newFAQs.length) {
      [newFAQs[index], newFAQs[newIndex]] = [newFAQs[newIndex], newFAQs[index]];
      onUpdate('faqs', newFAQs);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-xs">FAQ Title</Label>
        <Input
          value={element.content.title || ''}
          onChange={(e) => onUpdate('title', e.target.value)}
          placeholder="Frequently Asked Questions"
        />
      </div>

      <Separator />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs">FAQ Items</Label>
          <Button size="sm" onClick={addFAQ} className="h-7">
            <Plus className="h-3 w-3 mr-1" />
            Add FAQ
          </Button>
        </div>

        {faqs.map((faq: any, index: number) => (
          <div key={index} className="border rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="text-xs">
                FAQ {index + 1}
              </Badge>
              <div className="flex items-center space-x-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => moveFAQ(index, 'up')}
                  disabled={index === 0}
                  className="h-6 w-6 p-0"
                >
                  ↑
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => moveFAQ(index, 'down')}
                  disabled={index === faqs.length - 1}
                  className="h-6 w-6 p-0"
                >
                  ↓
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeFAQ(index)}
                  className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <div>
              <Label className="text-xs">Question</Label>
              <Input
                value={faq.question}
                onChange={(e) => updateFAQ(index, 'question', e.target.value)}
                placeholder="Enter question..."
              />
            </div>
            <div>
              <Label className="text-xs">Answer</Label>
              <Textarea
                value={faq.answer}
                onChange={(e) => updateFAQ(index, 'answer', e.target.value)}
                placeholder="Enter answer..."
                className="min-h-[60px]"
              />
            </div>
          </div>
        ))}

        {faqs.length === 0 && (
          <div className="text-center text-muted-foreground text-sm py-4">
            No FAQ items. Click "Add FAQ" to get started.
          </div>
        )}
      </div>
    </div>
  );
};

// Accordion Content Properties
export const AccordionContentProperties: React.FC<ContentPropertiesProps> = ({
  element,
  onUpdate
}) => {
  const items = element.content.items || [];

  const addItem = () => {
    const newItems = [...items, { title: 'New Section', content: 'Section content here.' }];
    onUpdate('items', newItems);
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_: any, i: number) => i !== index);
    onUpdate('items', newItems);
  };

  const updateItem = (index: number, field: 'title' | 'content', value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    onUpdate('items', newItems);
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newItems = [...items];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex >= 0 && newIndex < newItems.length) {
      [newItems[index], newItems[newIndex]] = [newItems[newIndex], newItems[index]];
      onUpdate('items', newItems);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-xs">Accordion Sections</Label>
        <Button size="sm" onClick={addItem} className="h-7">
          <Plus className="h-3 w-3 mr-1" />
          Add Section
        </Button>
      </div>

      <div className="space-y-3">
        {items.map((item: any, index: number) => (
          <div key={index} className="border rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="text-xs">
                Section {index + 1}
              </Badge>
              <div className="flex items-center space-x-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => moveItem(index, 'up')}
                  disabled={index === 0}
                  className="h-6 w-6 p-0"
                >
                  ↑
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => moveItem(index, 'down')}
                  disabled={index === items.length - 1}
                  className="h-6 w-6 p-0"
                >
                  ↓
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeItem(index)}
                  className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <div>
              <Label className="text-xs">Section Title</Label>
              <Input
                value={item.title}
                onChange={(e) => updateItem(index, 'title', e.target.value)}
                placeholder="Enter section title..."
              />
            </div>
            <div>
              <Label className="text-xs">Section Content</Label>
              <Textarea
                value={item.content}
                onChange={(e) => updateItem(index, 'content', e.target.value)}
                placeholder="Enter section content..."
                className="min-h-[60px]"
              />
            </div>
          </div>
        ))}

        {items.length === 0 && (
          <div className="text-center text-muted-foreground text-sm py-4">
            No sections. Click "Add Section" to get started.
          </div>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="allowMultiple"
          checked={element.content.allowMultiple || false}
          onChange={(e) => onUpdate('allowMultiple', e.target.checked)}
        />
        <Label htmlFor="allowMultiple" className="text-xs">Allow multiple sections open</Label>
      </div>
    </div>
  );
};

// Tabs Content Properties
export const TabsContentProperties: React.FC<ContentPropertiesProps> = ({
  element,
  onUpdate
}) => {
  const tabs = element.content.tabs || [];

  const addTab = () => {
    const newTabs = [...tabs, { 
      id: `tab${Date.now()}`, 
      label: `Tab ${tabs.length + 1}`, 
      content: 'Tab content here.' 
    }];
    onUpdate('tabs', newTabs);
  };

  const removeTab = (index: number) => {
    const newTabs = tabs.filter((_: any, i: number) => i !== index);
    onUpdate('tabs', newTabs);
  };

  const updateTab = (index: number, field: 'label' | 'content', value: string) => {
    const newTabs = [...tabs];
    newTabs[index] = { ...newTabs[index], [field]: value };
    onUpdate('tabs', newTabs);
  };

  const moveTab = (index: number, direction: 'up' | 'down') => {
    const newTabs = [...tabs];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex >= 0 && newIndex < newTabs.length) {
      [newTabs[index], newTabs[newIndex]] = [newTabs[newIndex], newTabs[index]];
      onUpdate('tabs', newTabs);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-xs">Tab Management</Label>
        <Button size="sm" onClick={addTab} className="h-7">
          <Plus className="h-3 w-3 mr-1" />
          Add Tab
        </Button>
      </div>

      <div className="space-y-3">
        {tabs.map((tab: any, index: number) => (
          <div key={tab.id} className="border rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="text-xs">
                {tab.label}
              </Badge>
              <div className="flex items-center space-x-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => moveTab(index, 'up')}
                  disabled={index === 0}
                  className="h-6 w-6 p-0"
                >
                  ↑
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => moveTab(index, 'down')}
                  disabled={index === tabs.length - 1}
                  className="h-6 w-6 p-0"
                >
                  ↓
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeTab(index)}
                  className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <div>
              <Label className="text-xs">Tab Label</Label>
              <Input
                value={tab.label}
                onChange={(e) => updateTab(index, 'label', e.target.value)}
                placeholder="Enter tab label..."
              />
            </div>
            <div>
              <Label className="text-xs">Tab Content</Label>
              <Textarea
                value={tab.content}
                onChange={(e) => updateTab(index, 'content', e.target.value)}
                placeholder="Enter tab content..."
                className="min-h-[60px]"
              />
            </div>
          </div>
        ))}

        {tabs.length === 0 && (
          <div className="text-center text-muted-foreground text-sm py-4">
            No tabs. Click "Add Tab" to get started.
          </div>
        )}
      </div>

      <div>
        <Label className="text-xs">Default Active Tab</Label>
        <Select
          value={element.content.defaultTab || tabs[0]?.id}
          onValueChange={(value) => onUpdate('defaultTab', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select default tab" />
          </SelectTrigger>
          <SelectContent>
            {tabs.map((tab: any) => (
              <SelectItem key={tab.id} value={tab.id}>
                {tab.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};