import React, { useState } from 'react';
import { Type, Heading1, Heading2, Heading3, Image, List, Quote } from 'lucide-react';
import { PageBuilderElement, ElementType } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { elementRegistry } from './ElementRegistry';

// Heading Element
const HeadingElement: React.FC<{
  element: PageBuilderElement;
  isEditing?: boolean;
  onUpdate?: (updates: Partial<PageBuilderElement>) => void;
}> = ({ element, isEditing, onUpdate }) => {
  const [isInlineEditing, setIsInlineEditing] = useState(false);
  const [tempText, setTempText] = useState(element.content.text || 'Enter heading text');

  const handleSave = () => {
    onUpdate?.({ 
      content: { 
        ...element.content, 
        text: tempText 
      } 
    });
    setIsInlineEditing(false);
  };

  const HeadingTag = (element.content.level === 1 ? 'h1' : 
                     element.content.level === 2 ? 'h2' : 'h3') as keyof JSX.IntrinsicElements;

  if (isInlineEditing && isEditing) {
    return (
      <div className="space-y-2">
        <Input
          value={tempText}
          onChange={(e) => setTempText(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          autoFocus
        />
      </div>
    );
  }

  return (
    <HeadingTag 
      className={`font-bold cursor-pointer ${
        element.content.level === 1 ? 'text-3xl' :
        element.content.level === 2 ? 'text-2xl' : 'text-xl'
      }`}
      onClick={() => isEditing && setIsInlineEditing(true)}
      style={{
        textAlign: element.styles?.textAlign || 'left',
        color: element.styles?.color,
      }}
    >
      {element.content.text || 'Enter heading text'}
    </HeadingTag>
  );
};

// Paragraph Element  
const ParagraphElement: React.FC<{
  element: PageBuilderElement;
  isEditing?: boolean;
  onUpdate?: (updates: Partial<PageBuilderElement>) => void;
}> = ({ element, isEditing, onUpdate }) => {
  const [isInlineEditing, setIsInlineEditing] = useState(false);
  const [tempText, setTempText] = useState(element.content.text || 'Enter paragraph text');

  const handleSave = () => {
    onUpdate?.({ 
      content: { 
        ...element.content, 
        text: tempText 
      } 
    });
    setIsInlineEditing(false);
  };

  if (isInlineEditing && isEditing) {
    return (
      <Textarea
        value={tempText}
        onChange={(e) => setTempText(e.target.value)}
        onBlur={handleSave}
        autoFocus
        rows={3}
      />
    );
  }

  return (
    <p 
      className="cursor-pointer"
      onClick={() => isEditing && setIsInlineEditing(true)}
      style={{
        textAlign: element.styles?.textAlign || 'left',
        color: element.styles?.color,
        fontSize: element.styles?.fontSize,
      }}
    >
      {element.content.text || 'Enter paragraph text'}
    </p>
  );
};

// Image Element
const ImageElement: React.FC<{
  element: PageBuilderElement;
  isEditing?: boolean;
  onUpdate?: (updates: Partial<PageBuilderElement>) => void;
}> = ({ element, isEditing, onUpdate }) => {
  const [isEditing_, setIsEditing_] = useState(false);

  if (!element.content.src) {
    return (
      <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
        <Image className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
        <p className="text-muted-foreground">Click to add image</p>
        {isEditing && (
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => setIsEditing_(true)}
          >
            Add Image URL
          </Button>
        )}
        {isEditing_ && (
          <div className="mt-2 space-y-2">
            <Input
              placeholder="Enter image URL"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const url = (e.target as HTMLInputElement).value;
                  onUpdate?.({
                    content: { ...element.content, src: url, alt: 'Image' }
                  });
                  setIsEditing_(false);
                }
              }}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="text-center">
      <img
        src={element.content.src}
        alt={element.content.alt || 'Image'}
        className="max-w-full h-auto rounded"
        style={{
          width: element.content.width || 'auto',
          height: element.content.height || 'auto'
        }}
      />
      {element.content.caption && (
        <p className="text-sm text-muted-foreground mt-2">{element.content.caption}</p>
      )}
    </div>
  );
};

// List Element
const ListElement: React.FC<{
  element: PageBuilderElement;
  isEditing?: boolean;
  onUpdate?: (updates: Partial<PageBuilderElement>) => void;
}> = ({ element, isEditing, onUpdate }) => {
  const items = element.content.items || ['List item 1', 'List item 2', 'List item 3'];
  const isOrdered = element.content.ordered || false;

  const ListTag = isOrdered ? 'ol' : 'ul';

  return (
    <ListTag className={isOrdered ? 'list-decimal list-inside' : 'list-disc list-inside'}>
      {items.map((item: string, index: number) => (
        <li key={index} className="mb-1">{item}</li>
      ))}
    </ListTag>
  );
};

// Button Element
const ButtonElement: React.FC<{
  element: PageBuilderElement;
  isEditing?: boolean;
  onUpdate?: (updates: Partial<PageBuilderElement>) => void;
}> = ({ element, isEditing, onUpdate }) => {
  return (
    <div className={`flex ${
      element.styles?.textAlign === 'center' ? 'justify-center' :
      element.styles?.textAlign === 'right' ? 'justify-end' : 'justify-start'
    }`}>
      <Button
        variant={element.content.variant || 'default'}
        size={element.content.size || 'default'}
        style={{
          backgroundColor: element.styles?.backgroundColor,
          color: element.styles?.color,
        }}
      >
        {element.content.text || 'Button Text'}
      </Button>
    </div>
  );
};

// Register all basic elements
export const registerBasicElements = () => {
  // Heading Elements
  elementRegistry.register({
    id: 'heading-h1',
    name: 'Heading 1',
    category: 'basic',
    icon: Heading1,
    component: HeadingElement,
    defaultContent: { text: 'Heading 1', level: 1 },
    description: 'Large heading text'
  });

  elementRegistry.register({
    id: 'heading-h2',
    name: 'Heading 2',
    category: 'basic',
    icon: Heading2,
    component: HeadingElement,
    defaultContent: { text: 'Heading 2', level: 2 },
    description: 'Medium heading text'
  });

  elementRegistry.register({
    id: 'heading-h3',
    name: 'Heading 3',
    category: 'basic',
    icon: Heading3,
    component: HeadingElement,
    defaultContent: { text: 'Heading 3', level: 3 },
    description: 'Small heading text'
  });

  // Paragraph
  elementRegistry.register({
    id: 'paragraph',
    name: 'Paragraph',
    category: 'basic',
    icon: Type,
    component: ParagraphElement,
    defaultContent: { text: 'This is a paragraph of text. You can edit this content by clicking on it.' },
    description: 'Regular paragraph text'
  });

  // Image
  elementRegistry.register({
    id: 'image',
    name: 'Image',
    category: 'media',
    icon: Image,
    component: ImageElement,
    defaultContent: { src: '', alt: '', caption: '' },
    description: 'Insert images'
  });

  // List
  elementRegistry.register({
    id: 'list',
    name: 'List',
    category: 'basic',
    icon: List,
    component: ListElement,
    defaultContent: { 
      items: ['List item 1', 'List item 2', 'List item 3'], 
      ordered: false 
    },
    description: 'Bullet or numbered lists'
  });

  // Button
  elementRegistry.register({
    id: 'button',
    name: 'Button',
    category: 'basic',
    icon: Quote,
    component: ButtonElement,
    defaultContent: { text: 'Click Me', variant: 'default', size: 'default' },
    description: 'Call-to-action button'
  });
};