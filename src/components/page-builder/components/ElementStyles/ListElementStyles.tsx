import React from 'react';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { ColorPicker } from '@/components/ui/color-picker';
import { PageBuilderElement } from '../../types';
import { ResponsiveTabs } from './_shared/ResponsiveStyleControl';
import { ResponsiveStyleControl } from './_shared/ResponsiveStyleControl';
import { useDevicePreview } from '../../contexts/DevicePreviewContext';

interface ListElementStylesProps {
  element: PageBuilderElement;
  onStyleUpdate: (property: string, value: any) => void;
}

export const ListElementStyles: React.FC<ListElementStylesProps> = ({ element, onStyleUpdate }) => {
  // Use global device state instead of local state
  const { deviceType, setDeviceType } = useDevicePreview();

  return (
    <div className="space-y-4">
      <Separator />
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">List Styles</h4>
        
        <ResponsiveTabs 
          activeTab={deviceType} 
          onTabChange={setDeviceType} 
        />

        <ResponsiveStyleControl
          element={element}
          property="iconSize"
          label="Icon Size"
          deviceType={deviceType}
          fallback={16}
          onStyleUpdate={onStyleUpdate}
        >
          {(value, onChange) => (
            <div className="flex items-center space-x-2">
              <Slider
                value={[parseInt(value?.toString().replace(/\D/g, '') || '16')]}
                onValueChange={(val) => onChange(val[0])}
                max={64}
                min={8}
                step={1}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground w-12">{value || 16}px</span>
            </div>
          )}
        </ResponsiveStyleControl>

        <ResponsiveStyleControl
          element={element}
          property="itemGap"
          label="Item Gap"
          deviceType={deviceType}
          fallback={4}
          onStyleUpdate={onStyleUpdate}
        >
          {(value, onChange) => (
            <div className="flex items-center space-x-2">
              <Slider
                value={[parseInt(value?.toString().replace(/\D/g, '') || '4')]}
                onValueChange={(val) => onChange(val[0])}
                max={24}
                min={0}
                step={1}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground w-12">{value || 4}px</span>
            </div>
          )}
        </ResponsiveStyleControl>

        <ResponsiveStyleControl
          element={element}
          property="indent"
          label="Indent"
          deviceType={deviceType}
          fallback={0}
          onStyleUpdate={onStyleUpdate}
        >
          {(value, onChange) => (
            <div className="flex items-center space-x-2">
              <Slider
                value={[parseInt(value?.toString().replace(/\D/g, '') || '0')]}
                onValueChange={(val) => onChange(val[0])}
                max={48}
                min={0}
                step={1}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground w-12">{value || 0}px</span>
            </div>
          )}
        </ResponsiveStyleControl>

        <ResponsiveStyleControl
          element={element}
          property="iconColor"
          label="Icon Color"
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
      </div>
    </div>
  );
};
