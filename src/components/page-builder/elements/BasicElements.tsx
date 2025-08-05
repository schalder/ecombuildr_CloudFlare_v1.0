import React, { useState } from 'react';
import { Type, Heading1, Heading2, Heading3, Image, List, Quote, Minus, Play } from 'lucide-react';
import { PageBuilderElement, ElementType } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { elementRegistry } from './ElementRegistry';
import { InlineEditor } from '../components/InlineEditor';

// Heading Element
const HeadingElement: React.FC<{
  element: PageBuilderElement;
  isEditing?: boolean;
  onUpdate?: (updates: Partial<PageBuilderElement>) => void;
}> = ({ element, isEditing, onUpdate }) => {
  const level = element.content.level || 2;
  const text = element.content.text || 'Heading';
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;

  const handleTextChange = (newText: string) => {
    onUpdate?.({
      content: { ...element.content, text: newText }
    });
  };

  const styles = {
    textAlign: element.styles?.textAlign || 'left',
    color: element.styles?.color || 'inherit',
    fontSize: element.styles?.fontSize || `${3.5 - level * 0.5}rem`,
    lineHeight: element.styles?.lineHeight || '1.2',
    backgroundColor: element.styles?.backgroundColor || 'transparent',
    margin: element.styles?.margin || '0',
    padding: element.styles?.padding || '0',
  };

  return (
    <div style={{ backgroundColor: element.styles?.backgroundColor || 'transparent' }} className="rounded">
      <Tag style={styles as any} className="outline-none font-bold block">
        <InlineEditor
          value={text}
          onChange={handleTextChange}
          placeholder="Enter heading text..."
          disabled={!isEditing}
          multiline={true}
          className="font-inherit text-inherit leading-tight"
        />
      </Tag>
    </div>
  );
};

// Paragraph Element  
const ParagraphElement: React.FC<{
  element: PageBuilderElement;
  isEditing?: boolean;
  onUpdate?: (updates: Partial<PageBuilderElement>) => void;
}> = ({ element, isEditing, onUpdate }) => {
  const text = element.content.text || 'Your text content goes here...';

  const handleTextChange = (newText: string) => {
    onUpdate?.({
      content: { ...element.content, text: newText }
    });
  };

  const styles = {
    textAlign: element.styles?.textAlign || 'left',
    color: element.styles?.color || 'inherit',
    fontSize: element.styles?.fontSize || '1rem',
    lineHeight: element.styles?.lineHeight || '1.6',
    backgroundColor: element.styles?.backgroundColor || 'transparent',
    margin: element.styles?.margin || '0',
    padding: element.styles?.padding || '0',
  };

  return (
    <div style={{ backgroundColor: element.styles?.backgroundColor || 'transparent' }} className="rounded">
      <p style={styles as any} className="outline-none">
        <InlineEditor
          value={text}
          onChange={handleTextChange}
          placeholder="Enter your text content..."
          disabled={!isEditing}
          multiline={true}
          className="text-inherit leading-inherit"
        />
      </p>
    </div>
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
  const text = element.content.text || 'Button';
  const variant = element.content.variant || 'default';
  const size = element.content.size || 'default';
  const url = element.content.url || '#';

  const handleTextChange = (newText: string) => {
    onUpdate?.({
      content: { ...element.content, text: newText }
    });
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isEditing) {
      e.preventDefault();
    } else if (url && url !== '#') {
      window.open(url, '_blank');
    }
  };

  const alignment = element.styles?.textAlign || 'left';
  const containerClass = 
    alignment === 'center' ? 'flex justify-center' :
    alignment === 'right' ? 'flex justify-end' : 
    'flex justify-start';

  return (
    <div className={containerClass}>
      <Button 
        variant={variant as any} 
        size={size as any}
        className="outline-none cursor-pointer"
        onClick={handleClick}
        style={{
          backgroundColor: element.styles?.backgroundColor,
          color: element.styles?.color,
        }}
      >
        <InlineEditor
          value={text}
          onChange={handleTextChange}
          placeholder="Button text..."
          disabled={!isEditing}
          className="text-inherit font-inherit"
        />
      </Button>
    </div>
  );
};

// Spacer Element
const SpacerElement: React.FC<{
  element: PageBuilderElement;
  isEditing?: boolean;
  onUpdate?: (updates: Partial<PageBuilderElement>) => void;
}> = ({ element, isEditing, onUpdate }) => {
  const height = element.content.height || '50px';

  const handleHeightChange = (newHeight: string) => {
    onUpdate?.({
      content: { ...element.content, height: newHeight }
    });
  };

  if (isEditing) {
    return (
      <div className="border border-dashed border-muted-foreground/30 rounded p-4 text-center bg-muted/10">
        <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
          <span>Spacer:</span>
          <InlineEditor
            value={height}
            onChange={handleHeightChange}
            placeholder="50px"
            disabled={false}
            className="w-16 text-center"
          />
        </div>
      </div>
    );
  }

  return (
    <div style={{ height }} className="w-full" />
  );
};

// Divider Element
const DividerElement: React.FC<{
  element: PageBuilderElement;
  isEditing?: boolean;
  onUpdate?: (updates: Partial<PageBuilderElement>) => void;
}> = ({ element, isEditing, onUpdate }) => {
  const style = element.content.style || 'solid';
  const color = element.content.color || '#e5e7eb';
  const width = element.content.width || '100%';

  const dividerStyle = {
    borderTop: `1px ${style} ${color}`,
    width,
    margin: element.styles?.margin || '20px 0',
  };

  if (isEditing) {
    return (
      <div className="border border-dashed border-muted-foreground/30 rounded p-2 bg-muted/10">
        <hr style={dividerStyle} />
        <div className="text-xs text-muted-foreground text-center mt-2">
          Divider
        </div>
      </div>
    );
  }

  return <hr style={dividerStyle} className="border-none" />;
};

// Video Element
const VideoElement: React.FC<{
  element: PageBuilderElement;
  isEditing?: boolean;
  onUpdate?: (updates: Partial<PageBuilderElement>) => void;
}> = ({ element, isEditing, onUpdate }) => {
  const [isEditing2, setIsEditing2] = useState(false);
  const src = element.content.src || '';
  const controls = element.content.controls !== false;
  const autoplay = element.content.autoplay || false;

  const handleSrcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate?.({
      content: { ...element.content, src: e.target.value }
    });
  };

  if (!src) {
    return (
      <div 
        className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center bg-muted/10 cursor-pointer hover:bg-muted/20 transition-colors"
        onClick={() => isEditing && setIsEditing2(true)}
      >
        <Play className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-4">Click to add video</p>
        {(isEditing && isEditing2) && (
          <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
            <Input
              placeholder="Enter video URL..."
              onChange={handleSrcChange}
              className="max-w-xs mx-auto"
              autoFocus
              onBlur={() => setIsEditing2(false)}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative group">
      <video 
        src={src} 
        controls={controls}
        autoPlay={autoplay}
        className="w-full h-auto outline-none"
        style={{
          margin: element.styles?.margin || '0',
          padding: element.styles?.padding || '0',
        }}
      />
      {isEditing && (
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsEditing2(true)}
          >
            Edit Video
          </Button>
        </div>
      )}
      {isEditing && isEditing2 && (
        <div className="absolute top-full left-0 right-0 bg-background border border-border rounded-md p-4 shadow-lg z-10 space-y-2">
          <Input
            placeholder="Video URL..."
            value={src}
            onChange={handleSrcChange}
            className="w-full"
          />
          <Button size="sm" onClick={() => setIsEditing2(false)}>
            Done
          </Button>
        </div>
      )}
    </div>
  );
};

// Register all basic elements
export const registerBasicElements = () => {
  // Heading Elements
  elementRegistry.register({
    id: 'heading',
    name: 'Heading',
    category: 'basic',
    icon: Type,
    component: HeadingElement,
    defaultContent: { text: 'Your heading text', level: 2 },
    description: 'Add a title or heading'
  });

  // Paragraph
  elementRegistry.register({
    id: 'text',
    name: 'Text Editor',
    category: 'basic',
    icon: Type,
    component: ParagraphElement,
    defaultContent: { text: 'Your text content goes here...' },
    description: 'Rich text content'
  });

  // Button
  elementRegistry.register({
    id: 'button',
    name: 'Button',
    category: 'basic',
    icon: Quote,
    component: ButtonElement,
    defaultContent: { text: 'Click Me', variant: 'default', size: 'default', url: '#' },
    description: 'Call to action button'
  });

  // Image
  elementRegistry.register({
    id: 'image',
    name: 'Image',
    category: 'basic',
    icon: Image,
    component: ImageElement,
    defaultContent: { src: '', alt: 'Image', width: '100%', height: 'auto' },
    description: 'Single image element'
  });

  // Video
  elementRegistry.register({
    id: 'video',
    name: 'Video',
    category: 'basic',
    icon: Play,
    component: VideoElement,
    defaultContent: { src: '', controls: true, autoplay: false },
    description: 'Video player'
  });

  // Spacer
  elementRegistry.register({
    id: 'spacer',
    name: 'Spacer',
    category: 'basic',
    icon: Minus,
    component: SpacerElement,
    defaultContent: { height: '50px' },
    description: 'Add space between elements'
  });

  // Divider
  elementRegistry.register({
    id: 'divider',
    name: 'Divider',
    category: 'basic',
    icon: Minus,
    component: DividerElement,
    defaultContent: { style: 'solid', width: '100%', color: '#e5e7eb' },
    description: 'Visual separator line'
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
};