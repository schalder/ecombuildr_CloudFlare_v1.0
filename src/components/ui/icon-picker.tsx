import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { ICON_OPTIONS, IconOption } from '@/components/icons/lucide-icon-list';

interface IconPickerProps {
  label?: string;
  value?: string;
  onChange: (iconName: string) => void;
  icons?: IconOption[];
}

export const IconPicker: React.FC<IconPickerProps> = ({ label, value, onChange, icons = ICON_OPTIONS }) => {
  const [query, setQuery] = React.useState('');

  const filtered = React.useMemo(() => {
    if (!query) return icons;
    const q = query.toLowerCase();
    return icons.filter((i) => i.name.includes(q) || i.label.toLowerCase().includes(q));
  }, [icons, query]);

  return (
    <div className="space-y-2">
      {label && <Label className="text-xs">{label}</Label>}
      <Input
        placeholder="Search icons..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <ScrollArea className="h-40 border rounded-md p-2 bg-background">
        <div className="grid grid-cols-6 gap-2">
          {filtered.map((opt) => {
            const selected = value === opt.name;
            const IconComponent = opt.icon;
            return (
              <button
                key={opt.name}
                type="button"
                onClick={() => onChange(opt.name)}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 p-2 rounded-md border transition-colors',
                  selected ? 'border-primary text-primary' : 'border-border hover:border-primary/60'
                )}
                aria-label={opt.label}
                title={opt.label}
              >
                <IconComponent className="h-4 w-4" />
                <span className="text-2xs text-muted-foreground truncate w-full text-center">{opt.name}</span>
              </button>
            );
          })}
        </div>
      </ScrollArea>
      {value && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Selected:</span>
          <code className="px-1 py-0.5 rounded bg-muted text-foreground">{value}</code>
        </div>
      )}
    </div>
  );
};