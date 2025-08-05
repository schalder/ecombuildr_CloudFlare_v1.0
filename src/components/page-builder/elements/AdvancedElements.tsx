import React, { useState } from 'react';
import { MapPin, Code, Share2, Facebook, Twitter, Linkedin, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { PageBuilderElement } from '../types';
import { elementRegistry } from './ElementRegistry';

// Google Maps Element
const GoogleMapsElement: React.FC<{
  element: PageBuilderElement;
  isEditing?: boolean;
  onUpdate?: (updates: Partial<PageBuilderElement>) => void;
}> = ({ element, isEditing, onUpdate }) => {
  const location = element.content.location || 'New York, NY';
  const embedUrl = `https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=${encodeURIComponent(location)}`;

  return (
    <div className="max-w-4xl mx-auto" style={element.styles}>
      <h3 className="text-xl font-semibold mb-4">{element.content.title || 'Location'}</h3>
      <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <MapPin className="h-12 w-12 mx-auto mb-2 text-gray-500" />
          <p className="text-gray-600">Map Preview</p>
          <p className="text-sm text-gray-500">{location}</p>
          <p className="text-xs text-gray-400 mt-2">
            Note: Google Maps API key required for live maps
          </p>
        </div>
      </div>
    </div>
  );
};

// Custom HTML Element
const CustomHTMLElement: React.FC<{
  element: PageBuilderElement;
  isEditing?: boolean;
  onUpdate?: (updates: Partial<PageBuilderElement>) => void;
}> = ({ element, isEditing, onUpdate }) => {
  const [htmlContent, setHtmlContent] = useState(
    element.content.html || '<div><h3>Custom HTML</h3><p>Add your custom HTML here</p></div>'
  );

  const handleUpdate = () => {
    if (onUpdate) {
      onUpdate({
        content: {
          ...element.content,
          html: htmlContent
        }
      });
    }
  };

  if (isEditing) {
    return (
      <div className="max-w-4xl mx-auto p-4 border rounded-lg" style={element.styles}>
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold">Custom HTML Editor</h4>
          <Button onClick={handleUpdate} size="sm">
            Update
          </Button>
        </div>
        <Textarea
          value={htmlContent}
          onChange={(e) => setHtmlContent(e.target.value)}
          placeholder="Enter your HTML code here..."
          rows={10}
          className="font-mono text-sm"
        />
      </div>
    );
  }

  return (
    <div 
      className="max-w-4xl mx-auto" 
      style={element.styles}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
};

// Social Share Element
const SocialShareElement: React.FC<{
  element: PageBuilderElement;
  isEditing?: boolean;
  onUpdate?: (updates: Partial<PageBuilderElement>) => void;
}> = ({ element, isEditing, onUpdate }) => {
  const title = element.content.title || 'Share this page';
  const url = element.content.url || window.location.href;
  const text = element.content.text || 'Check out this amazing content!';

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
  };

  const handleShare = (platform: string) => {
    const link = shareLinks[platform as keyof typeof shareLinks];
    if (link) {
      window.open(link, '_blank', 'width=600,height=400');
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard!');
  };

  return (
    <div className="max-w-md mx-auto text-center" style={element.styles}>
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="flex justify-center space-x-3">
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleShare('facebook')}
          className="flex items-center space-x-2"
        >
          <Facebook className="h-4 w-4" />
          <span>Facebook</span>
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleShare('twitter')}
          className="flex items-center space-x-2"
        >
          <Twitter className="h-4 w-4" />
          <span>Twitter</span>
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleShare('linkedin')}
          className="flex items-center space-x-2"
        >
          <Linkedin className="h-4 w-4" />
          <span>LinkedIn</span>
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleCopyLink}
          className="flex items-center space-x-2"
        >
          <Link2 className="h-4 w-4" />
          <span>Copy</span>
        </Button>
      </div>
    </div>
  );
};

// Register Advanced Elements
export const registerAdvancedElements = () => {
  elementRegistry.register({
    id: 'google-maps',
    name: 'Google Maps',
    category: 'custom',
    icon: MapPin,
    component: GoogleMapsElement,
    defaultContent: {
      title: 'Location',
      location: 'New York, NY'
    },
    description: 'Interactive Google Maps embed'
  });

  elementRegistry.register({
    id: 'custom-html',
    name: 'Custom HTML',
    category: 'custom',
    icon: Code,
    component: CustomHTMLElement,
    defaultContent: {
      html: '<div><h3>Custom HTML</h3><p>Add your custom HTML here</p></div>'
    },
    description: 'Custom HTML code block'
  });

  elementRegistry.register({
    id: 'social-share',
    name: 'Social Share',
    category: 'marketing',
    icon: Share2,
    component: SocialShareElement,
    defaultContent: {
      title: 'Share this page',
      text: 'Check out this amazing content!',
      url: ''
    },
    description: 'Social media sharing buttons'
  });
};