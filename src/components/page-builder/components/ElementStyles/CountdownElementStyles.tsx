import React from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Palette, ChevronDown, ChevronRight } from 'lucide-react';
import { PageBuilderElement } from '../../types';
import { ColorPicker } from '@/components/ui/color-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ResponsiveTabs, ResponsiveStyleControl } from './_shared/ResponsiveStyleControl';
import { SpacingControl } from './_shared/SpacingControl';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useDevicePreview } from '../../contexts/DevicePreviewContext';

interface CountdownElementStylesProps {
  element: PageBuilderElement;
  onStyleUpdate: (property: string, value: any) => void;
}

export const CountdownElementStyles: React.FC<CountdownElementStylesProps> = ({
  element,
  onStyleUpdate,
}) => {
  // Use global device state instead of local state
  const { deviceType, setDeviceType } = useDevicePreview();
  
  // Collapsible sections state
  const [openSections, setOpenSections] = React.useState({
    presets: true,
    numberStyles: true,
    labelStyles: true,
    segmentStyles: true,
    spacing: true
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const applyPreset = (presetName: string) => {
    const presets = {
      'bold-boxes': {
        desktop: {
          numberColor: '#ffffff',
          numberBackgroundColor: 'hsl(var(--primary))',
          labelColor: 'hsl(var(--foreground))',
          numberFontSize: '32px',
          labelFontSize: '14px',
          segmentPadding: '16px',
          segmentBorderRadius: '12px',
          segmentBorderWidth: '0px',
          segmentGap: '16px'
        },
        mobile: {
          numberFontSize: '24px',
          segmentPadding: '12px',
          segmentGap: '12px'
        }
      },
      'outline-pills': {
        desktop: {
          numberColor: 'hsl(var(--primary))',
          numberBackgroundColor: 'transparent',
          labelColor: 'hsl(var(--muted-foreground))',
          numberFontSize: '28px',
          labelFontSize: '12px',
          segmentPadding: '12px 20px',
          segmentBorderRadius: '24px',
          segmentBorderWidth: '2px',
          segmentBorderColor: 'hsl(var(--primary))',
          segmentGap: '16px'
        },
        mobile: {
          numberFontSize: '20px',
          segmentPadding: '8px 16px',
          segmentGap: '12px'
        }
      },
      'minimal-inline': {
        desktop: {
          numberColor: 'hsl(var(--foreground))',
          numberBackgroundColor: 'transparent',
          labelColor: 'hsl(var(--muted-foreground))',
          numberFontSize: '24px',
          labelFontSize: '12px',
          segmentPadding: '4px 8px',
          segmentBorderRadius: '4px',
          segmentBorderWidth: '0px',
          segmentGap: '8px'
        },
        mobile: {
          numberFontSize: '18px',
          segmentGap: '6px'
        }
      },
      'gradient-modern': {
        desktop: {
          numberColor: '#ffffff',
          numberBackgroundColor: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)))',
          labelColor: 'hsl(var(--foreground))',
          numberFontSize: '30px',
          labelFontSize: '13px',
          segmentPadding: '16px',
          segmentBorderRadius: '8px',
          segmentBorderWidth: '0px',
          segmentGap: '20px'
        },
        mobile: {
          numberFontSize: '22px',
          segmentPadding: '12px',
          segmentGap: '14px'
        }
      }
    };

    const preset = presets[presetName as keyof typeof presets];
    if (preset) {
      onStyleUpdate('responsive', preset);
    }
  };

  return (
    <div className="space-y-4">
      {/* Responsive Controls */}
      <ResponsiveTabs activeTab={deviceType} onTabChange={setDeviceType} />

      {/* Style Presets */}
      <Collapsible open={openSections.presets} onOpenChange={() => toggleSection('presets')}>
        <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted/50 rounded-md">
          <Label className="text-xs font-medium">Style Presets</Label>
          {openSections.presets ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2 pt-2">
          <div className="grid grid-cols-2 gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => applyPreset('bold-boxes')}
            >
              <Palette className="h-3 w-3 mr-1" />
              Bold Boxes
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => applyPreset('outline-pills')}
            >
              <Palette className="h-3 w-3 mr-1" />
              Outline Pills
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => applyPreset('minimal-inline')}
            >
              <Palette className="h-3 w-3 mr-1" />
              Minimal Inline
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => applyPreset('gradient-modern')}
            >
              <Palette className="h-3 w-3 mr-1" />
              Gradient Modern
            </Button>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Separator />

      {/* Number Styles */}
      <Collapsible open={openSections.numberStyles} onOpenChange={() => toggleSection('numberStyles')}>
        <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted/50 rounded-md">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Number Styles</h4>
          {openSections.numberStyles ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 pt-2">
          <ResponsiveStyleControl
            element={element}
            property="numberFontSize"
            label="Font Size"
            deviceType={deviceType}
            fallback="24px"
            onStyleUpdate={onStyleUpdate}
          >
            {(value, onChange) => (
              <div className="flex items-center space-x-2">
                <Slider
                  value={[parseInt((value || '24px').replace(/\D/g, ''))]}
                  onValueChange={(val) => onChange(`${val[0]}px`)}
                  max={72}
                  min={12}
                  step={2}
                  className="flex-1"
                />
                <span className="text-xs text-muted-foreground w-12">
                  {value || '24px'}
                </span>
              </div>
            )}
          </ResponsiveStyleControl>

          <ResponsiveStyleControl
            element={element}
            property="numberColor"
            label="Number Color"
            deviceType={deviceType}
            fallback=""
            onStyleUpdate={onStyleUpdate}
          >
            {(value, onChange) => (
              <ColorPicker 
                color={value || ''}
                onChange={onChange}
              />
            )}
          </ResponsiveStyleControl>

          <ResponsiveStyleControl
            element={element}
            property="numberBackgroundColor"
            label="Number Background"
            deviceType={deviceType}
            fallback=""
            onStyleUpdate={onStyleUpdate}
          >
            {(value, onChange) => (
              <ColorPicker 
                color={value || ''}
                onChange={onChange}
              />
            )}
          </ResponsiveStyleControl>
        </CollapsibleContent>
      </Collapsible>

      <Separator />

      {/* Label Styles */}
      <Collapsible open={openSections.labelStyles} onOpenChange={() => toggleSection('labelStyles')}>
        <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted/50 rounded-md">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Label Styles</h4>
          {openSections.labelStyles ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 pt-2">
          <ResponsiveStyleControl
            element={element}
            property="labelFontSize"
            label="Font Size"
            deviceType={deviceType}
            fallback="12px"
            onStyleUpdate={onStyleUpdate}
          >
            {(value, onChange) => (
              <div className="flex items-center space-x-2">
                <Slider
                  value={[parseInt((value || '12px').replace(/\D/g, ''))]}
                  onValueChange={(val) => onChange(`${val[0]}px`)}
                  max={24}
                  min={8}
                  step={1}
                  className="flex-1"
                />
                <span className="text-xs text-muted-foreground w-12">
                  {value || '12px'}
                </span>
              </div>
            )}
          </ResponsiveStyleControl>

          <ResponsiveStyleControl
            element={element}
            property="labelColor"
            label="Label Color"
            deviceType={deviceType}
            fallback=""
            onStyleUpdate={onStyleUpdate}
          >
            {(value, onChange) => (
              <ColorPicker 
                color={value || ''}
                onChange={onChange}
              />
            )}
          </ResponsiveStyleControl>
        </CollapsibleContent>
      </Collapsible>

      <Separator />

      {/* Segment Styles */}
      <Collapsible open={openSections.segmentStyles} onOpenChange={() => toggleSection('segmentStyles')}>
        <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted/50 rounded-md">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Segment Styles</h4>
          {openSections.segmentStyles ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 pt-2">
          <ResponsiveStyleControl
            element={element}
            property="segmentPadding"
            label="Padding"
            deviceType={deviceType}
            fallback="12px"
            onStyleUpdate={onStyleUpdate}
          >
            {(value, onChange) => (
              <Select
                value={value || '12px'}
                onValueChange={onChange}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="4px 8px">Small (4px 8px)</SelectItem>
                  <SelectItem value="8px 12px">Medium (8px 12px)</SelectItem>
                  <SelectItem value="12px">Default (12px)</SelectItem>
                  <SelectItem value="16px">Large (16px)</SelectItem>
                  <SelectItem value="8px 20px">Pill (8px 20px)</SelectItem>
                  <SelectItem value="12px 20px">Wide Pill (12px 20px)</SelectItem>
                </SelectContent>
              </Select>
            )}
          </ResponsiveStyleControl>

          <ResponsiveStyleControl
            element={element}
            property="segmentBorderRadius"
            label="Border Radius"
            deviceType={deviceType}
            fallback="8px"
            onStyleUpdate={onStyleUpdate}
          >
            {(value, onChange) => (
              <div className="flex items-center space-x-2">
                <Slider
                  value={[parseInt((value || '8px').replace(/\D/g, ''))]}
                  onValueChange={(val) => onChange(`${val[0]}px`)}
                  max={50}
                  min={0}
                  step={2}
                  className="flex-1"
                />
                <span className="text-xs text-muted-foreground w-12">
                  {value || '8px'}
                </span>
              </div>
            )}
          </ResponsiveStyleControl>

          <ResponsiveStyleControl
            element={element}
            property="segmentBorderWidth"
            label="Border Width"
            deviceType={deviceType}
            fallback="0px"
            onStyleUpdate={onStyleUpdate}
          >
            {(value, onChange) => (
              <div className="flex items-center space-x-2">
                <Slider
                  value={[parseInt((value || '0px').replace(/\D/g, ''))]}
                  onValueChange={(val) => onChange(`${val[0]}px`)}
                  max={5}
                  min={0}
                  step={1}
                  className="flex-1"
                />
                <span className="text-xs text-muted-foreground w-12">
                  {value || '0px'}
                </span>
              </div>
            )}
          </ResponsiveStyleControl>

          <ResponsiveStyleControl
            element={element}
            property="segmentBorderColor"
            label="Border Color"
            deviceType={deviceType}
            fallback=""
            onStyleUpdate={onStyleUpdate}
          >
            {(value, onChange) => (
              <ColorPicker 
                color={value || ''}
                onChange={onChange}
              />
            )}
          </ResponsiveStyleControl>

          <ResponsiveStyleControl
            element={element}
            property="segmentGap"
            label="Gap Between Segments"
            deviceType={deviceType}
            fallback="16px"
            onStyleUpdate={onStyleUpdate}
          >
            {(value, onChange) => (
              <div className="flex items-center space-x-2">
                <Slider
                  value={[parseInt((value || '16px').replace(/\D/g, ''))]}
                  onValueChange={(val) => onChange(`${val[0]}px`)}
                  max={40}
                  min={4}
                  step={2}
                  className="flex-1"
                />
                <span className="text-xs text-muted-foreground w-12">
                  {value || '16px'}
                </span>
              </div>
            )}
          </ResponsiveStyleControl>
        </CollapsibleContent>
      </Collapsible>

      <Separator />

      {/* Spacing */}
      <Collapsible open={openSections.spacing} onOpenChange={() => toggleSection('spacing')}>
        <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted/50 rounded-md">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Spacing</h4>
          {openSections.spacing ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 pt-2">
          {/* Margin */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Margin</Label>
            <div className="space-y-2">
              <SpacingControl
                element={element}
                property="marginTop"
                label="Top"
                deviceType={deviceType}
                onStyleUpdate={onStyleUpdate}
              />
              <SpacingControl
                element={element}
                property="marginRight"
                label="Right"
                deviceType={deviceType}
                onStyleUpdate={onStyleUpdate}
              />
              <SpacingControl
                element={element}
                property="marginBottom"
                label="Bottom"
                deviceType={deviceType}
                onStyleUpdate={onStyleUpdate}
              />
              <SpacingControl
                element={element}
                property="marginLeft"
                label="Left"
                deviceType={deviceType}
                onStyleUpdate={onStyleUpdate}
              />
            </div>
          </div>

          {/* Padding */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Padding</Label>
            <div className="space-y-2">
              <SpacingControl
                element={element}
                property="paddingTop"
                label="Top"
                deviceType={deviceType}
                onStyleUpdate={onStyleUpdate}
              />
              <SpacingControl
                element={element}
                property="paddingRight"
                label="Right"
                deviceType={deviceType}
                onStyleUpdate={onStyleUpdate}
              />
              <SpacingControl
                element={element}
                property="paddingBottom"
                label="Bottom"
                deviceType={deviceType}
                onStyleUpdate={onStyleUpdate}
              />
              <SpacingControl
                element={element}
                property="paddingLeft"
                label="Left"
                deviceType={deviceType}
                onStyleUpdate={onStyleUpdate}
              />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};