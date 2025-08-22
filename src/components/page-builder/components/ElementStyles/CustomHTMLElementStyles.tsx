import React from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { CollapsibleGroup } from './_shared/CollapsibleGroup';
import { SpacingSliders } from './_shared/SpacingSliders';

interface CustomHTMLElementStylesProps {
  styles: any;
  onStyleUpdate: (property: string, value: any) => void;
  deviceType: 'desktop' | 'tablet' | 'mobile';
}

export const CustomHTMLElementStyles: React.FC<CustomHTMLElementStylesProps> = ({
  styles,
  onStyleUpdate,
  deviceType
}) => {
  const currentStyles = styles?.[deviceType] || {};
  const [spacingOpen, setSpacingOpen] = React.useState(true);

  const handleSpacingChange = (property: string, value: number) => {
    onStyleUpdate(deviceType, {
      ...currentStyles,
      [property]: `${value}px`
    });
  };

  const parsePixelValue = (value: string | undefined): number => {
    if (!value) return 0;
    return parseInt(value.replace('px', '')) || 0;
  };

  return (
    <div className="space-y-4">
      <CollapsibleGroup title="Spacing" isOpen={spacingOpen} onToggle={setSpacingOpen}>
        <SpacingSliders
          marginTop={currentStyles.marginTop}
          marginRight={currentStyles.marginRight}
          marginBottom={currentStyles.marginBottom}
          marginLeft={currentStyles.marginLeft}
          paddingTop={currentStyles.paddingTop}
          paddingRight={currentStyles.paddingRight}
          paddingBottom={currentStyles.paddingBottom}
          paddingLeft={currentStyles.paddingLeft}
          onMarginChange={(property, value) => handleSpacingChange(property, parsePixelValue(value))}
          onPaddingChange={(property, value) => handleSpacingChange(property, parsePixelValue(value))}
        />
      </CollapsibleGroup>
    </div>
  );
};