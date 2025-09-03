import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlignLeft, AlignCenter, AlignRight, Monitor, Tablet, Smartphone, Search, X } from 'lucide-react';
import { ColorPicker } from '@/components/ui/color-picker';
import { PageBuilderElement } from '../../types';
import { CollapsibleGroup } from './_shared/CollapsibleGroup';
import { SpacingSliders } from './_shared/SpacingSliders';
import { IconPicker } from '@/components/ui/icon-picker';
import { ResponsiveStyleControl, ResponsiveTabs } from './_shared/ResponsiveStyleControl';

interface ButtonElementStylesProps {
  element: PageBuilderElement;
  onStyleUpdate: (property: string, value: any) => void;
  onContentUpdate: (property: string, value: any) => void;
}


export const ButtonElementStyles: React.FC<ButtonElementStylesProps> = ({
  element,
  onStyleUpdate,
  onContentUpdate
}) => {
  const [responsiveTab, setResponsiveTab] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [dimensionsOpen, setDimensionsOpen] = useState(false);
  const [typographyOpen, setTypographyOpen] = useState(false);
  const [colorsOpen, setColorsOpen] = useState(false);
  const [bordersOpen, setBordersOpen] = useState(false);
  const [spacingOpen, setSpacingOpen] = useState(false);
  const [iconOpen, setIconOpen] = useState(false);

  // Handle icon changes
  const handleIconChange = (iconName: string | null) => {
    onStyleUpdate('content', {
      ...element.content,
      icon: iconName
    });
  };

  return (
    <div className="space-y-4">
      {/* Device Toggle */}
      <ResponsiveTabs activeTab={responsiveTab} onTabChange={setResponsiveTab} />

      {/* Button Icon */}
      <CollapsibleGroup title="Button Icon" isOpen={iconOpen} onToggle={setIconOpen}>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Icon</Label>
            {element.content.icon && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleIconChange(null)}
                className="h-6 px-2"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
          
          <IconPicker
            value={element.content.icon || ''}
            onChange={(value) => onContentUpdate('icon', value)}
          />
          
          <p className="text-xs text-muted-foreground">
            Icon will automatically scale with font size and match text color.
          </p>
        </div>
      </CollapsibleGroup>

      {/* Dimensions */}
      <CollapsibleGroup title="Dimensions" isOpen={dimensionsOpen} onToggle={setDimensionsOpen}>
        <ResponsiveStyleControl
          element={element}
          property="width"
          label="Full Width"
          deviceType={responsiveTab}
          fallback="auto"
          onStyleUpdate={onStyleUpdate}
        >
          {(value, onChange) => (
            <Switch
              checked={value === '100%'}
              onCheckedChange={(checked) => onChange(checked ? '100%' : 'auto')}
            />
          )}
        </ResponsiveStyleControl>

        <ResponsiveStyleControl
          element={element}
          property="minWidth"
          label="Min Width"
          deviceType={responsiveTab}
          fallback=""
          onStyleUpdate={onStyleUpdate}
        >
          {(value, onChange) => (
            <Input
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="e.g., 120px, 20%"
            />
          )}
        </ResponsiveStyleControl>

        <ResponsiveStyleControl
          element={element}
          property="maxWidth"
          label="Max Width"
          deviceType={responsiveTab}
          fallback=""
          onStyleUpdate={onStyleUpdate}
        >
          {(value, onChange) => (
            <Input
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="e.g., 300px, 80%"
            />
          )}
        </ResponsiveStyleControl>
      </CollapsibleGroup>

      {/* Typography */}
      <CollapsibleGroup title="Typography" isOpen={typographyOpen} onToggle={setTypographyOpen}>
        <ResponsiveStyleControl
          element={element}
          property="fontSize"
          label="Font Size"
          deviceType={responsiveTab}
          fallback="16px"
          onStyleUpdate={onStyleUpdate}
        >
          {(value, onChange) => (
            <div className="flex items-center space-x-2">
              <Slider
                value={[parseInt(value.toString().replace(/\D/g, ''))]}
                onValueChange={(val) => onChange(`${val[0]}px`)}
                max={100}
                min={8}
                step={1}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground w-12">
                {value}
              </span>
            </div>
          )}
        </ResponsiveStyleControl>

        <ResponsiveStyleControl
          element={element}
          property="fontWeight"
          label="Font Weight"
          deviceType={responsiveTab}
          fallback="normal"
          onStyleUpdate={onStyleUpdate}
        >
          {(value, onChange) => (
            <div className="flex space-x-1">
              <Button
                size="sm"
                variant={value === 'normal' ? 'default' : 'outline'}
                onClick={() => onChange('normal')}
              >
                Normal
              </Button>
              <Button
                size="sm"
                variant={value === 'bold' ? 'default' : 'outline'}
                onClick={() => onChange('bold')}
              >
                Bold
              </Button>
            </div>
          )}
        </ResponsiveStyleControl>

        <ResponsiveStyleControl
          element={element}
          property="textAlign"
          label="Text Align"
          deviceType={responsiveTab}
          fallback="left"
          onStyleUpdate={onStyleUpdate}
        >
          {(value, onChange) => (
            <div className="flex space-x-1">
              <Button
                size="sm"
                variant={value === 'left' ? 'default' : 'outline'}
                onClick={() => onChange('left')}
              >
                <AlignLeft className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant={value === 'center' ? 'default' : 'outline'}
                onClick={() => onChange('center')}
              >
                <AlignCenter className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant={value === 'right' ? 'default' : 'outline'}
                onClick={() => onChange('right')}
              >
                <AlignRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </ResponsiveStyleControl>
      </CollapsibleGroup>

      {/* Colors */}
      <CollapsibleGroup title="Colors" isOpen={colorsOpen} onToggle={setColorsOpen}>
        <ResponsiveStyleControl
          element={element}
          property="color"
          label="Text Color"
          deviceType={responsiveTab}
          fallback="#ffffff"
          onStyleUpdate={onStyleUpdate}
        >
          {(value, onChange) => (
            <ColorPicker
              color={value}
              onChange={onChange}
            />
          )}
        </ResponsiveStyleControl>

        <ResponsiveStyleControl
          element={element}
          property="backgroundColor"
          label="Background Color"
          deviceType={responsiveTab}
          fallback="#3b82f6"
          onStyleUpdate={onStyleUpdate}
        >
          {(value, onChange) => (
            <ColorPicker
              color={value}
              onChange={onChange}
            />
          )}
        </ResponsiveStyleControl>

        <ResponsiveStyleControl
          element={element}
          property="hoverColor"
          label="Text Hover Color"
          deviceType={responsiveTab}
          fallback=""
          onStyleUpdate={onStyleUpdate}
        >
          {(value, onChange) => (
            <ColorPicker
              color={value}
              onChange={onChange}
            />
          )}
        </ResponsiveStyleControl>

        <ResponsiveStyleControl
          element={element}
          property="hoverBackgroundColor"
          label="Background Hover Color"
          deviceType={responsiveTab}
          fallback=""
          onStyleUpdate={onStyleUpdate}
        >
          {(value, onChange) => (
            <ColorPicker
              color={value}
              onChange={onChange}
            />
          )}
        </ResponsiveStyleControl>
      </CollapsibleGroup>

      {/* Borders & Effects */}
      <CollapsibleGroup title="Borders & Effects" isOpen={bordersOpen} onToggle={setBordersOpen}>
        <ResponsiveStyleControl
          element={element}
          property="borderWidth"
          label="Border Width"
          deviceType={responsiveTab}
          fallback=""
          onStyleUpdate={onStyleUpdate}
        >
          {(value, onChange) => (
            <Input
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="e.g., 1px"
            />
          )}
        </ResponsiveStyleControl>

        <ResponsiveStyleControl
          element={element}
          property="borderColor"
          label="Border Color"
          deviceType={responsiveTab}
          fallback="#e5e7eb"
          onStyleUpdate={onStyleUpdate}
        >
          {(value, onChange) => (
            <ColorPicker
              color={value}
              onChange={onChange}
            />
          )}
        </ResponsiveStyleControl>

        <ResponsiveStyleControl
          element={element}
          property="borderRadius"
          label="Border Radius"
          deviceType={responsiveTab}
          fallback="6px"
          onStyleUpdate={onStyleUpdate}
        >
          {(value, onChange) => (
            <div className="flex items-center space-x-2">
              <Slider
                value={[parseInt(value.toString().replace(/\D/g, ''))]}
                onValueChange={(val) => onChange(`${val[0]}px`)}
                max={50}
                min={0}
                step={1}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground w-12">
                {value}
              </span>
            </div>
          )}
        </ResponsiveStyleControl>

        <ResponsiveStyleControl
          element={element}
          property="boxShadow"
          label="Box Shadow"
          deviceType={responsiveTab}
          fallback=""
          onStyleUpdate={onStyleUpdate}
        >
          {(value, onChange) => (
            <Input
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="e.g., 0 2px 4px rgba(0,0,0,0.1)"
            />
          )}
        </ResponsiveStyleControl>
      </CollapsibleGroup>

      {/* Spacing */}
      <CollapsibleGroup title="Spacing" isOpen={spacingOpen} onToggle={setSpacingOpen}>
        <SpacingSliders
          marginTop={element.styles?.marginTop}
          marginRight={element.styles?.marginRight}
          marginBottom={element.styles?.marginBottom}
          marginLeft={element.styles?.marginLeft}
          paddingTop={element.styles?.paddingTop}
          paddingRight={element.styles?.paddingRight}
          paddingBottom={element.styles?.paddingBottom}
          paddingLeft={element.styles?.paddingLeft}
          onMarginChange={(property, value) => onStyleUpdate(property, value)}
          onPaddingChange={(property, value) => onStyleUpdate(property, value)}
        />
      </CollapsibleGroup>
    </div>
  );
};