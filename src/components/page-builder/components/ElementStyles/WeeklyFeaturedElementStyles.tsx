import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { ColorPicker } from '@/components/ui/color-picker';
import { PageBuilderElement } from '../../types';
import { WeeklyFeaturedTypographyStyles } from './WeeklyFeaturedTypographyStyles';

interface WeeklyFeaturedElementStylesProps {
  element: PageBuilderElement;
  onStyleUpdate: (property: string, value: any) => void;
  deviceType: 'desktop' | 'tablet' | 'mobile';
}

export const WeeklyFeaturedElementStyles: React.FC<WeeklyFeaturedElementStylesProps> = ({
  element,
  onStyleUpdate,
  deviceType,
}) => {
  const styles = element.styles || {};

  return (
    <div className="space-y-4">
      {/* Typography Styles */}
      <div>
        <Label className="text-xs font-medium">Typography</Label>
        <WeeklyFeaturedTypographyStyles
          element={element}
          onStyleUpdate={onStyleUpdate}
        />
      </div>

      {/* Card Styles */}
      <div className="space-y-3">
        <Label className="text-xs font-medium">Card Appearance</Label>
        
        <div>
          <Label className="text-xs">Background Color</Label>
          <ColorPicker
            color={(styles as any).cardBackground || '#ffffff'}
            onChange={(color) => onStyleUpdate('cardBackground', color)}
          />
        </div>

        <div>
          <Label className="text-xs">Border Radius</Label>
          <div className="space-y-2">
            <Slider
              value={[parseInt(styles.borderRadius) || 8]}
              onValueChange={(value) => onStyleUpdate('borderRadius', `${value[0]}px`)}
              max={50}
              min={0}
              step={1}
            />
            <span className="text-xs text-muted-foreground">
              {parseInt(styles.borderRadius) || 8}px
            </span>
          </div>
        </div>

        <div>
          <Label className="text-xs">Border Width</Label>
          <div className="space-y-2">
            <Slider
              value={[parseInt(styles.borderWidth) || 0]}
              onValueChange={(value) => onStyleUpdate('borderWidth', `${value[0]}px`)}
              max={10}
              min={0}
              step={1}
            />
            <span className="text-xs text-muted-foreground">
              {parseInt(styles.borderWidth) || 0}px
            </span>
          </div>
        </div>

        {(parseInt(styles.borderWidth) || 0) > 0 && (
          <div>
            <Label className="text-xs">Border Color</Label>
            <ColorPicker
              color={styles.borderColor || '#e5e7eb'}
              onChange={(color) => onStyleUpdate('borderColor', color)}
            />
          </div>
        )}
      </div>

      {/* Spacing */}
      <div className="space-y-3">
        <Label className="text-xs font-medium">Spacing</Label>
        
          <div>
            <Label className="text-xs">Card Padding</Label>
            <div className="space-y-2">
              <Slider
                value={[parseInt((styles as any).cardPadding) || 16]}
                onValueChange={(value) => onStyleUpdate('cardPadding', `${value[0]}px`)}
                max={50}
                min={0}
                step={2}
              />
              <span className="text-xs text-muted-foreground">
                {parseInt((styles as any).cardPadding) || 16}px
              </span>
            </div>
          </div>

          <div>
            <Label className="text-xs">Gap Between Cards</Label>
            <div className="space-y-2">
              <Slider
                value={[parseInt((styles as any).gap) || 16]}
                onValueChange={(value) => onStyleUpdate('gap', `${value[0]}px`)}
                max={50}
                min={0}
                step={2}
              />
              <span className="text-xs text-muted-foreground">
                {parseInt((styles as any).gap) || 16}px
              </span>
            </div>
          </div>
      </div>

      {/* Button Styles */}
      <div className="space-y-3">
        <Label className="text-xs font-medium">Button Styles</Label>
        
        <div>
          <Label className="text-xs">Button Style</Label>
          <Select
            value={(styles as any).buttonVariant || 'default'}
            onValueChange={(value) => onStyleUpdate('buttonVariant', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default</SelectItem>
              <SelectItem value="secondary">Secondary</SelectItem>
              <SelectItem value="outline">Outline</SelectItem>
              <SelectItem value="ghost">Ghost</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {(styles as any).buttonVariant === 'custom' && (
          <>
            <div>
              <Label className="text-xs">Button Background</Label>
              <ColorPicker
                color={(styles as any).buttonBackground || '#000000'}
                onChange={(color) => onStyleUpdate('buttonBackground', color)}
              />
            </div>
            <div>
              <Label className="text-xs">Button Text Color</Label>
              <ColorPicker
                color={(styles as any).buttonTextColor || '#ffffff'}
                onChange={(color) => onStyleUpdate('buttonTextColor', color)}
              />
            </div>
            <div>
              <Label className="text-xs">Button Hover Background</Label>
              <ColorPicker
                color={(styles as any).buttonHoverBackground || '#333333'}
                onChange={(color) => onStyleUpdate('buttonHoverBackground', color)}
              />
            </div>
          </>
        )}

        <div>
          <Label className="text-xs">Button Size</Label>
          <Select
            value={(styles as any).buttonSize || 'default'}
            onValueChange={(value) => onStyleUpdate('buttonSize', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sm">Small</SelectItem>
              <SelectItem value="default">Default</SelectItem>
              <SelectItem value="lg">Large</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs">Button Width</Label>
          <Select
            value={(styles as any).buttonWidth || 'auto'}
            onValueChange={(value) => onStyleUpdate('buttonWidth', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Auto</SelectItem>
              <SelectItem value="full">Full Width</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};