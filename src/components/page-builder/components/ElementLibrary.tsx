import React from 'react';
import { Layout } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { elementRegistry } from '../elements';

interface ElementLibraryProps {
  searchTerm: string;
  onAddElement: (elementType: string, targetPath: string) => void;
}

export const ElementLibrary: React.FC<ElementLibraryProps> = ({
  searchTerm,
  onAddElement
}) => {
  // Get all available elements from registry and group by category
  const allElements = elementRegistry.getAll();
  
  // Group elements by category
  const elementsByCategory = allElements.reduce((acc, element) => {
    const category = element.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(element);
    return acc;
  }, {} as Record<string, typeof allElements>);

  // Filter based on search term
  const filteredCategories = Object.entries(elementsByCategory)
    .map(([categoryName, elements]) => ({
      name: categoryName.charAt(0).toUpperCase() + categoryName.slice(1),
      elements: elements.filter(element =>
        element.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (element.description || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    }))
    .filter(category => category.elements.length > 0);

  const handleElementClick = (elementId: string) => {
    onAddElement(elementId, 'element');
  };

  return (
    <div className="p-4 space-y-6">
      {filteredCategories.map((category) => (
        <div key={category.name}>
          <h3 className="font-medium text-sm text-muted-foreground mb-3 uppercase tracking-wide">
            {category.name}
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {category.elements.map((element) => (
              <Button
                key={element.id}
                variant="outline"
                size="sm"
                className="h-auto p-3 flex flex-col items-center space-y-2 hover:bg-primary/5 hover:border-primary/20"
                onClick={() => handleElementClick(element.id)}
              >
                <element.icon className="h-5 w-5 text-muted-foreground" />
                <span className="text-xs font-medium text-center leading-tight">
                  {element.name}
                </span>
              </Button>
            ))}
          </div>
          {category !== filteredCategories[filteredCategories.length - 1] && (
            <Separator className="mt-6" />
          )}
        </div>
      ))}
      
      {filteredCategories.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Layout className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-sm">No elements found</p>
          <p className="text-xs mt-1">Try adjusting your search terms</p>
        </div>
      )}
    </div>
  );
};