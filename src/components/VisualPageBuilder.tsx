import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { 
  Plus, 
  Trash2, 
  Type, 
  Image, 
  Mail, 
  ShoppingBag,
  GripVertical,
  Edit3
} from 'lucide-react';

interface PageSection {
  id: string;
  type: 'text' | 'image' | 'contact_form' | 'products_grid';
  content: any;
}

interface VisualPageBuilderProps {
  initialSections?: PageSection[];
  onChange: (sections: PageSection[]) => void;
}

const sectionTypes = [
  { type: 'text', label: 'Text Block', icon: Type },
  { type: 'image', label: 'Image', icon: Image },
  { type: 'contact_form', label: 'Contact Form', icon: Mail },
  { type: 'products_grid', label: 'Products Grid', icon: ShoppingBag },
];

export const VisualPageBuilder: React.FC<VisualPageBuilderProps> = ({ 
  initialSections = [], 
  onChange 
}) => {
  const [sections, setSections] = useState<PageSection[]>(
    initialSections.length > 0 
      ? initialSections 
      : [{ id: '1', type: 'text', content: { title: '', text: '' } }]
  );
  const [editingSection, setEditingSection] = useState<string | null>(null);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const newSections = Array.from(sections);
    const [reorderedItem] = newSections.splice(result.source.index, 1);
    newSections.splice(result.destination.index, 0, reorderedItem);

    setSections(newSections);
    onChange(newSections);
  };

  const addSection = (type: PageSection['type']) => {
    const newSection: PageSection = {
      id: Date.now().toString(),
      type,
      content: getDefaultContent(type),
    };
    
    const newSections = [...sections, newSection];
    setSections(newSections);
    onChange(newSections);
    setEditingSection(newSection.id);
  };

  const getDefaultContent = (type: PageSection['type']) => {
    switch (type) {
      case 'text':
        return { title: 'New Text Block', text: 'Enter your content here...' };
      case 'image':
        return { url: '', alt: '', caption: '' };
      case 'contact_form':
        return { 
          title: 'Contact Us', 
          text: 'Get in touch with us',
          email: '',
          phone: '',
          address: ''
        };
      case 'products_grid':
        return { title: 'Products', show_filters: true, limit: 12 };
      default:
        return {};
    }
  };

  const updateSection = (id: string, content: any) => {
    const newSections = sections.map(section =>
      section.id === id ? { ...section, content } : section
    );
    setSections(newSections);
    onChange(newSections);
  };

  const deleteSection = (id: string) => {
    const newSections = sections.filter(section => section.id !== id);
    setSections(newSections);
    onChange(newSections);
  };

  const renderSectionEditor = (section: PageSection) => {
    // Add null check to prevent undefined errors
    if (!section || !section.content) {
      return (
        <div className="p-4 border border-dashed border-border rounded-lg min-h-[100px] flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            Section data is missing
          </div>
        </div>
      );
    }

    if (editingSection !== section.id) {
      return (
        <div className="p-4 border border-dashed border-border rounded-lg min-h-[100px] flex items-center justify-center">
          <div className="text-center">
            <div className="text-sm font-medium mb-2">{section.content.title || `${section.type} Section`}</div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditingSection(section.id)}
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        </div>
      );
    }

    switch (section.type) {
      case 'text':
        return (
          <div className="space-y-4 p-4 border rounded-lg">
            <Input
              placeholder="Section Title"
              value={section.content.title || ''}
              onChange={(e) => updateSection(section.id, { ...section.content, title: e.target.value })}
            />
            <Textarea
              placeholder="Content text..."
              value={section.content.text || ''}
              onChange={(e) => updateSection(section.id, { ...section.content, text: e.target.value })}
              rows={4}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={() => setEditingSection(null)}>Done</Button>
            </div>
          </div>
        );

      case 'image':
        return (
          <div className="space-y-4 p-4 border rounded-lg">
            <Input
              placeholder="Image URL"
              value={section.content.url || ''}
              onChange={(e) => updateSection(section.id, { ...section.content, url: e.target.value })}
            />
            <Input
              placeholder="Alt text"
              value={section.content.alt || ''}
              onChange={(e) => updateSection(section.id, { ...section.content, alt: e.target.value })}
            />
            <Input
              placeholder="Caption (optional)"
              value={section.content.caption || ''}
              onChange={(e) => updateSection(section.id, { ...section.content, caption: e.target.value })}
            />
            {section.content.url && (
              <img 
                src={section.content.url} 
                alt={section.content.alt}
                className="max-h-48 w-auto rounded"
              />
            )}
            <div className="flex gap-2">
              <Button size="sm" onClick={() => setEditingSection(null)}>Done</Button>
            </div>
          </div>
        );

      case 'contact_form':
        return (
          <div className="space-y-4 p-4 border rounded-lg">
            <Input
              placeholder="Form Title"
              value={section.content.title || ''}
              onChange={(e) => updateSection(section.id, { ...section.content, title: e.target.value })}
            />
            <Textarea
              placeholder="Description text"
              value={section.content.text || ''}
              onChange={(e) => updateSection(section.id, { ...section.content, text: e.target.value })}
              rows={2}
            />
            <Input
              placeholder="Contact Email"
              value={section.content.email || ''}
              onChange={(e) => updateSection(section.id, { ...section.content, email: e.target.value })}
            />
            <Input
              placeholder="Phone Number"
              value={section.content.phone || ''}
              onChange={(e) => updateSection(section.id, { ...section.content, phone: e.target.value })}
            />
            <Input
              placeholder="Address"
              value={section.content.address || ''}
              onChange={(e) => updateSection(section.id, { ...section.content, address: e.target.value })}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={() => setEditingSection(null)}>Done</Button>
            </div>
          </div>
        );

      case 'products_grid':
        return (
          <div className="space-y-4 p-4 border rounded-lg">
            <Input
              placeholder="Section Title"
              value={section.content.title || ''}
              onChange={(e) => updateSection(section.id, { ...section.content, title: e.target.value })}
            />
            <Input
              type="number"
              placeholder="Number of products to show"
              value={section.content.limit || 12}
              onChange={(e) => updateSection(section.id, { ...section.content, limit: parseInt(e.target.value) })}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={() => setEditingSection(null)}>Done</Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Section Types Toolbar */}
      <Card>
        <CardHeader>
          <CardTitle>Add Sections</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {sectionTypes.map(({ type, label, icon: Icon }) => (
              <Button
                key={type}
                variant="outline"
                size="sm"
                onClick={() => addSection(type as PageSection['type'])}
              >
                <Icon className="h-4 w-4 mr-2" />
                {label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Drag and Drop Sections */}
      <Card>
        <CardHeader>
          <CardTitle>Page Content</CardTitle>
        </CardHeader>
        <CardContent>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="sections">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                  {sections.filter(section => section && section.id).map((section, index) => {
                    const sectionType = sectionTypes.find(t => t.type === section.type);
                    const Icon = sectionType?.icon || Type;
                    
                    return (
                      <Draggable key={section.id} draggableId={section.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`border rounded-lg ${
                              snapshot.isDragging ? 'shadow-lg' : ''
                            }`}
                          >
                            {/* Section Header */}
                            <div className="flex items-center justify-between p-3 border-b bg-muted/30">
                              <div className="flex items-center gap-2">
                                <div {...provided.dragHandleProps}>
                                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                                </div>
                                <Icon className="h-4 w-4" />
                                <Badge variant="secondary">{sectionType?.label}</Badge>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteSection(section.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>

                            {/* Section Content */}
                            <div className="p-0">
                              {renderSectionEditor(section)}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          {sections.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No sections added yet. Add your first section above.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};