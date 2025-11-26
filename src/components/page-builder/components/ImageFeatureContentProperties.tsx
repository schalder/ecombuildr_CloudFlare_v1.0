import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Monitor, Tablet, Smartphone } from 'lucide-react';
import { MediaSelector } from './MediaSelector';
import { PageBuilderElement, ElementVisibility } from '../types';
import { VisibilityControl } from './VisibilityControl';
import { useDevicePreview } from '../contexts/DevicePreviewContext';
import { 
  getEffectiveResponsiveValue
} from '../utils/responsiveHelpers';

interface ImageFeatureContentPropertiesProps {
  element: PageBuilderElement;
  onUpdate: (property: string, value: any) => void;
}

export const ImageFeatureContentProperties: React.FC<ImageFeatureContentPropertiesProps> = ({
  element,
  onUpdate
}) => {
  const { deviceType: responsiveTab, setDeviceType: setResponsiveTab } = useDevicePreview();
  const headline = element.content.headline || 'Feature Headline';
  const description = element.content.description || 'Feature description goes here...';
  const imageUrl = element.content.imageUrl || '';
  const altText = element.content.altText || '';
  // Get image position from responsive styles, fallback to content for backward compatibility
  const legacyImagePosition = element.content.imagePosition || 'left';
  const imagePosition = getEffectiveResponsiveValue(element, 'imagePosition', responsiveTab, legacyImagePosition);
  const imageWidth = element.content.imageWidth || 25;
  
  // Default visibility settings
  const defaultVisibility: ElementVisibility = {
    desktop: true,
    tablet: true,
    mobile: true
  };

  const currentVisibility = element.visibility || defaultVisibility;

  const handleVisibilityChange = (visibility: ElementVisibility) => {
    onUpdate('visibility', visibility);
  };

  // Handle responsive image position update
  const handleImagePositionChange = (value: string) => {
    const currentStyles = element.styles || {};
    const currentResponsive = currentStyles.responsive || { desktop: {}, tablet: {}, mobile: {} };
    
    // Update the responsive styles for the current device
    const updatedResponsive = {
      ...currentResponsive,
      [responsiveTab]: {
        ...currentResponsive[responsiveTab],
        imagePosition: value
      }
    };
    
    onUpdate('styles', {
      ...currentStyles,
      responsive: updatedResponsive
    });
  };

  return (
    <div className="space-y-4">
      <VisibilityControl
        visibility={currentVisibility}
        onVisibilityChange={handleVisibilityChange}
      />
      <div>
        <Label htmlFor="headline">Feature Headline</Label>
        <Input
          id="headline"
          value={headline}
          onChange={(e) => onUpdate('headline', e.target.value)}
          placeholder="Enter headline..."
        />
      </div>

      <div>
        <Label htmlFor="description">Feature Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => onUpdate('description', e.target.value)}
          placeholder="Enter description..."
          rows={3}
        />
      </div>

      <div>
        <Label>Feature Image</Label>
        <MediaSelector
          value={imageUrl}
          onChange={(url) => onUpdate('imageUrl', url)}
          label="Select Feature Image"
        />
      </div>

      <div>
        <Label htmlFor="alt-text">Alt Text</Label>
        <Input
          id="alt-text"
          value={altText}
          onChange={(e) => onUpdate('altText', e.target.value)}
          placeholder="Describe the image..."
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Image Position</Label>
          <div className="flex space-x-1">
            <Button 
              size="sm" 
              variant={responsiveTab === 'desktop' ? 'default' : 'outline'} 
              onClick={() => setResponsiveTab('desktop')}
            >
              <Monitor className="h-3 w-3" />
            </Button>
            <Button 
              size="sm" 
              variant={responsiveTab === 'tablet' ? 'default' : 'outline'} 
              onClick={() => setResponsiveTab('tablet')}
            >
              <Tablet className="h-3 w-3" />
            </Button>
            <Button 
              size="sm" 
              variant={responsiveTab === 'mobile' ? 'default' : 'outline'} 
              onClick={() => setResponsiveTab('mobile')}
            >
              <Smartphone className="h-3 w-3" />
            </Button>
          </div>
        </div>
        <Select value={imagePosition} onValueChange={handleImagePositionChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select position" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="left">Left</SelectItem>
            <SelectItem value="right">Right</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Image Width (%)</Label>
        <div className="flex items-center space-x-2">
          <Slider
            value={[imageWidth]}
            onValueChange={(value) => onUpdate('imageWidth', value[0])}
            max={80}
            min={20}
            step={5}
            className="flex-1"
          />
          <span className="text-xs text-muted-foreground w-12">
            {imageWidth}%
          </span>
        </div>
      </div>
    </div>
  );
};