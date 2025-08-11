import React from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { AlignLeft, AlignCenter, AlignRight, Monitor, Smartphone } from 'lucide-react';
import { PageBuilderElement } from '../../types';
import { ColorPicker } from '@/components/ui/color-picker';

interface WeeklyFeaturedTypographyStylesProps {
  element: PageBuilderElement;
  onStyleUpdate: (property: string, value: any) => void;
}

function ensureResponsive(base: any) {
  const next = { ...(base || {}) } as any;
  if (!next.responsive) next.responsive = { desktop: {}, mobile: {} };
  if (!next.responsive.desktop) next.responsive.desktop = {};
  if (!next.responsive.mobile) next.responsive.mobile = {};
  return next;
}

function DeviceToggle({ value, onChange }: { value: 'desktop' | 'mobile'; onChange: (v: 'desktop' | 'mobile') => void }) {
  return (
    <div className="flex items-center justify-between">
      <Label className="text-xs">Device</Label>
      <div className="flex gap-2">
        <Button size="sm" variant={value === 'desktop' ? 'default' : 'outline'} onClick={() => onChange('desktop')}>
          <Monitor className="h-4 w-4 mr-1" /> Desktop
        </Button>
        <Button size="sm" variant={value === 'mobile' ? 'default' : 'outline'} onClick={() => onChange('mobile')}>
          <Smartphone className="h-4 w-4 mr-1" /> Mobile
        </Button>
      </div>
    </div>
  );
}

function TypographyGroup({
  label,
  styles,
  onChange,
}: {
  label: string;
  styles: any;
  onChange: (patch: Record<string, any>) => void;
}) {
  return (
    <div className="space-y-3">
      <h5 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">{label}</h5>

      <div>
        <Label className="text-xs">Font Size</Label>
        <div className="flex items-center gap-2">
          <Slider
            value={[parseInt(((styles.fontSize || '16px').toString()).replace(/\D/g, ''))]}
            onValueChange={(v) => onChange({ fontSize: `${v[0]}px` })}
            min={8}
            max={72}
            step={1}
            className="flex-1"
          />
          <span className="text-xs text-muted-foreground w-12">{(styles.fontSize || '16px') as string}</span>
        </div>
      </div>

      <ColorPicker label="Text Color" color={styles.color || ''} onChange={(val) => onChange({ color: val })} />

      <div>
        <Label className="text-xs">Text Align</Label>
        <div className="flex gap-1">
          <Button size="sm" variant={styles.textAlign === 'left' ? 'default' : 'outline'} onClick={() => onChange({ textAlign: 'left' })}>
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button size="sm" variant={styles.textAlign === 'center' ? 'default' : 'outline'} onClick={() => onChange({ textAlign: 'center' })}>
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button size="sm" variant={styles.textAlign === 'right' ? 'default' : 'outline'} onClick={() => onChange({ textAlign: 'right' })}>
            <AlignRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div>
        <Label className="text-xs">Line Height</Label>
        <div className="flex items-center gap-2">
          <Slider
            value={[parseFloat((styles.lineHeight ?? '1.6').toString())]}
            onValueChange={(v) => onChange({ lineHeight: v[0].toString() })}
            min={1}
            max={3}
            step={0.1}
            className="flex-1"
          />
          <span className="text-xs text-muted-foreground w-12">{(styles.lineHeight ?? '1.6') as string}</span>
        </div>
      </div>
    </div>
  );
}

export const WeeklyFeaturedTypographyStyles: React.FC<WeeklyFeaturedTypographyStylesProps> = ({ element, onStyleUpdate }) => {
  const [device, setDevice] = React.useState<'desktop' | 'mobile'>('desktop');

  const getGroup = (key: 'headlineStyles' | 'subheadlineStyles' | 'productTitleStyles' | 'priceStyles') =>
    ensureResponsive((element as any).styles?.[key]).responsive[device] || {};

  const updateGroup = (key: 'headlineStyles' | 'subheadlineStyles' | 'productTitleStyles' | 'priceStyles', patch: Record<string, any>) => {
    const base = ensureResponsive((element as any).styles?.[key]);
    base.responsive[device] = { ...(base.responsive[device] || {}), ...patch };
    onStyleUpdate(key, base);
  };

  return (
    <div className="space-y-5">
      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Typography (Weekly Featured)</h4>

      <DeviceToggle value={device} onChange={setDevice} />

      <TypographyGroup label="Headline" styles={getGroup('headlineStyles')} onChange={(p) => updateGroup('headlineStyles', p)} />

      <TypographyGroup label="Subheadline" styles={getGroup('subheadlineStyles')} onChange={(p) => updateGroup('subheadlineStyles', p)} />

      <TypographyGroup label="Product Title" styles={getGroup('productTitleStyles')} onChange={(p) => updateGroup('productTitleStyles', p)} />

      <TypographyGroup label="Price" styles={getGroup('priceStyles')} onChange={(p) => updateGroup('priceStyles', p)} />
    </div>
  );
};
