import React, { useState } from 'react';
import { Plus, Type, Image, ShoppingBag, Layout } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface InlineAddButtonProps {
  onAddElement: (elementType: string) => void;
  className?: string;
  size?: 'sm' | 'default' | 'lg' | 'icon';
  showQuickElements?: boolean;
}

const QUICK_ELEMENTS = [
  { id: 'heading', name: 'Heading', icon: Type },
  { id: 'text', name: 'Text', icon: Type },
  { id: 'button', name: 'Button', icon: Layout },
  { id: 'image', name: 'Image', icon: Image },
];

export const InlineAddButton: React.FC<InlineAddButtonProps> = ({
  onAddElement,
  className,
  size = 'sm',
  showQuickElements = true
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleQuickAdd = (elementType: string) => {
    onAddElement(elementType);
    setIsOpen(false);
  };

  if (!showQuickElements) {
    return (
      <Button
        variant="ghost"
        size={size}
        onClick={() => onAddElement('text')}
        className={cn(
          'bg-background/80 border border-dashed border-muted-foreground/30',
          'hover:bg-primary/5 hover:border-primary/50',
          className
        )}
      >
        <Plus className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <div className="flex items-center space-x-1">
      {/* Quick add buttons for common elements */}
      {QUICK_ELEMENTS.map((element) => {
        const Icon = element.icon;
        return (
          <Button
            key={element.id}
            variant="ghost"
            size="sm"
            onClick={() => handleQuickAdd(element.id)}
            className={cn(
              'opacity-0 group-hover:opacity-100 transition-opacity duration-200',
              'bg-background/80 border border-dashed border-muted-foreground/30',
              'hover:bg-primary/5 hover:border-primary/50',
              'p-2 h-8 w-8'
            )}
            title={`Add ${element.name}`}
          >
            <Icon className="h-3 w-3" />
          </Button>
        );
      })}
      
      {/* More elements button */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'opacity-0 group-hover:opacity-100 transition-opacity duration-200',
              'bg-background/80 border border-dashed border-muted-foreground/30',
              'hover:bg-primary/5 hover:border-primary/50',
              'p-2 h-8 w-8'
            )}
            title="More elements"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-2" align="center">
          <div className="space-y-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleQuickAdd('contact-form')}
              className="w-full justify-start"
            >
              Contact Form
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleQuickAdd('product-grid')}
              className="w-full justify-start"
            >
              Product Grid
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleQuickAdd('testimonial')}
              className="w-full justify-start"
            >
              Testimonial
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleQuickAdd('spacer')}
              className="w-full justify-start"
            >
              Spacer
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};