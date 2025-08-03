import React from 'react';
import { 
  Type, 
  Image, 
  Video, 
  ShoppingBag, 
  Mail, 
  Star,
  Grid3X3,
  Layout,
  Quote,
  MessageSquare,
  MapPin,
  Code,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface ElementLibraryProps {
  searchTerm: string;
  onAddElement: (elementType: string, targetPath: string) => void;
}

const elementCategories = [
  {
    name: 'Basic',
    elements: [
      { id: 'heading', name: 'Heading', icon: Type, description: 'Add a title or heading' },
      { id: 'text', name: 'Text Editor', icon: Type, description: 'Rich text content' },
      { id: 'button', name: 'Button', icon: Layout, description: 'Call to action button' },
      { id: 'image', name: 'Image', icon: Image, description: 'Single image element' },
      { id: 'video', name: 'Video', icon: Video, description: 'Video player' },
      { id: 'spacer', name: 'Spacer', icon: Layout, description: 'Add space between elements' },
      { id: 'divider', name: 'Divider', icon: Layout, description: 'Visual separator line' }
    ]
  },
  {
    name: 'eCommerce',
    elements: [
      { id: 'product-grid', name: 'Product Grid', icon: Grid3X3, description: 'Display products in grid' },
      { id: 'featured-products', name: 'Featured Products', icon: Star, description: 'Highlight featured products' },
      { id: 'product-categories', name: 'Product Categories', icon: ShoppingBag, description: 'Show product categories' },
      { id: 'add-to-cart', name: 'Add to Cart', icon: ShoppingBag, description: 'Add to cart button' },
      { id: 'price', name: 'Price', icon: ShoppingBag, description: 'Product price display' }
    ]
  },
  {
    name: 'Forms',
    elements: [
      { id: 'contact-form', name: 'Contact Form', icon: Mail, description: 'Contact form with fields' },
      { id: 'newsletter', name: 'Newsletter', icon: Mail, description: 'Email subscription form' },
      { id: 'form-field', name: 'Form Field', icon: Layout, description: 'Single form input field' }
    ]
  },
  {
    name: 'Content',
    elements: [
      { id: 'testimonial', name: 'Testimonial', icon: Quote, description: 'Customer testimonial' },
      { id: 'faq', name: 'FAQ', icon: MessageSquare, description: 'Frequently asked questions' },
      { id: 'accordion', name: 'Accordion', icon: Layout, description: 'Collapsible content sections' },
      { id: 'tabs', name: 'Tabs', icon: Layout, description: 'Tabbed content area' }
    ]
  },
  {
    name: 'Media',
    elements: [
      { id: 'image-gallery', name: 'Image Gallery', icon: Image, description: 'Multiple images in gallery' },
      { id: 'image-carousel', name: 'Image Carousel', icon: Image, description: 'Sliding image carousel' },
      { id: 'video-playlist', name: 'Video Playlist', icon: Video, description: 'Multiple videos' }
    ]
  },
  {
    name: 'Advanced',
    elements: [
      { id: 'google-maps', name: 'Google Maps', icon: MapPin, description: 'Interactive map' },
      { id: 'custom-html', name: 'HTML', icon: Code, description: 'Custom HTML code' },
      { id: 'social-share', name: 'Social Share', icon: Layout, description: 'Social media sharing buttons' }
    ]
  }
];

export const ElementLibrary: React.FC<ElementLibraryProps> = ({
  searchTerm,
  onAddElement
}) => {
  const filteredCategories = elementCategories.map(category => ({
    ...category,
    elements: category.elements.filter(element =>
      element.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      element.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.elements.length > 0);

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