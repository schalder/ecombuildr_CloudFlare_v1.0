import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { PageBuilderElement } from '../../types';
import { CollapsibleGroup } from './_shared/CollapsibleGroup';
import { SpacingSliders } from './_shared/SpacingSliders';

interface FormElementStylesProps {
  element: PageBuilderElement;
  onStyleUpdate: (property: string, value: any) => void;
}

export const FormElementStyles: React.FC<FormElementStylesProps> = ({
  element,
  onStyleUpdate,
}) => {
  const [typographyOpen, setTypographyOpen] = React.useState(true);
  const [backgroundOpen, setBackgroundOpen] = React.useState(false);
  const [borderOpen, setBorderOpen] = React.useState(false);
  const [spacingOpen, setSpacingOpen] = React.useState(false);

  const parseMarginPadding = (value: string) => {
    const parts = (value || '0px').split(' ');
    return {
      top: parts[0] || '0px',
      right: parts[1] || parts[0] || '0px',
      bottom: parts[2] || parts[0] || '0px',
      left: parts[3] || parts[1] || parts[0] || '0px'
    };
  };

  const formatMarginPadding = (top: string, right: string, bottom: string, left: string) => {
    return `${top} ${right} ${bottom} ${left}`;
  };

  const margin = parseMarginPadding(element.styles?.margin as string);
  const padding = parseMarginPadding(element.styles?.padding as string);

  return (
    <div className="space-y-4">
      {/* Typography */}
      <CollapsibleGroup title="Typography" isOpen={typographyOpen} onToggle={setTypographyOpen}>
        <div>
          <Label className="text-xs">Font Size</Label>
          <div className="flex items-center space-x-2">
            <Slider
              value={[parseInt(element.styles?.fontSize?.replace(/\D/g, '') || '16')]}
              onValueChange={(value) => onStyleUpdate('fontSize', `${value[0]}px`)}
              max={24}
              min={12}
              step={1}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground w-12">
              {element.styles?.fontSize || '16px'}
            </span>
          </div>
        </div>

        <div>
          <Label className="text-xs">Text Color</Label>
          <Input
            type="color"
            value={element.styles?.color || '#000000'}
            onChange={(e) => onStyleUpdate('color', e.target.value)}
            className="w-full h-10"
          />
        </div>
      </CollapsibleGroup>

      {/* Background */}
      <CollapsibleGroup title="Background" isOpen={backgroundOpen} onToggle={setBackgroundOpen}>
        <div>
          <Label className="text-xs">Background Color</Label>
          <Input
            type="color"
            value={element.styles?.backgroundColor || '#ffffff'}
            onChange={(e) => onStyleUpdate('backgroundColor', e.target.value)}
            className="w-full h-10"
          />
        </div>
      </CollapsibleGroup>

      {/* Border */}
      <CollapsibleGroup title="Border" isOpen={borderOpen} onToggle={setBorderOpen}>
        <div>
          <Label className="text-xs">Border Width</Label>
          <Input
            value={element.styles?.borderWidth || ''}
            onChange={(e) => onStyleUpdate('borderWidth', e.target.value)}
            placeholder="e.g., 1px"
          />
        </div>

        <div>
          <Label className="text-xs">Border Color</Label>
          <Input
            type="color"
            value={element.styles?.borderColor || '#e5e7eb'}
            onChange={(e) => onStyleUpdate('borderColor', e.target.value)}
            className="w-full h-10"
          />
        </div>

        <div>
          <Label className="text-xs">Border Radius</Label>
          <Input
            value={element.styles?.borderRadius || ''}
            onChange={(e) => onStyleUpdate('borderRadius', e.target.value)}
            placeholder="e.g., 4px"
          />
        </div>
      </CollapsibleGroup>

      {/* Spacing */}
      <CollapsibleGroup title="Spacing" isOpen={spacingOpen} onToggle={setSpacingOpen}>
        <SpacingSliders
          marginTop={margin.top}
          marginRight={margin.right}
          marginBottom={margin.bottom}
          marginLeft={margin.left}
          paddingTop={padding.top}
          paddingRight={padding.right}
          paddingBottom={padding.bottom}
          paddingLeft={padding.left}
          onMarginChange={(property, value) => {
            const current = parseMarginPadding(element.styles?.margin as string);
            const key = property.replace('margin', '').toLowerCase();
            const updated = { ...current, [key]: value };
            onStyleUpdate('margin', formatMarginPadding(updated.top, updated.right, updated.bottom, updated.left));
          }}
          onPaddingChange={(property, value) => {
            const current = parseMarginPadding(element.styles?.padding as string);
            const key = property.replace('padding', '').toLowerCase();
            const updated = { ...current, [key]: value };
            onStyleUpdate('padding', formatMarginPadding(updated.top, updated.right, updated.bottom, updated.left));
          }}
        />
      </CollapsibleGroup>
    </div>
  );
};