import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { ICON_OPTIONS_REGULAR, ICON_OPTIONS_SOLID, IconOption } from '@/components/icons/icon-sources';

interface IconPickerProps {
  label?: string;
  value?: string;
  onChange: (iconName: string) => void;
}

export const IconPicker: React.FC<IconPickerProps> = ({ label, value, onChange }) => {
  const [query, setQuery] = React.useState('');
  const [activeTab, setActiveTab] = React.useState('regular');

  const currentIcons = activeTab === 'regular' ? ICON_OPTIONS_REGULAR : ICON_OPTIONS_SOLID;

  const filtered = React.useMemo(() => {
    if (!query) return currentIcons;
    const q = query.toLowerCase();
    return currentIcons.filter((i) => i.name.includes(q) || i.label.toLowerCase().includes(q));
  }, [currentIcons, query]);

  // Switch to the correct tab when value changes
  React.useEffect(() => {
    if (value) {
      if (value.startsWith('hi:')) {
        setActiveTab('solid');
      } else {
        setActiveTab('regular');
      }
    }
  }, [value]);

  return (
    <div className="space-y-2">
      {label && <Label className="text-xs">{label}</Label>}
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="regular" className="text-xs">Classic Regular</TabsTrigger>
          <TabsTrigger value="solid" className="text-xs">Classic Solid</TabsTrigger>
        </TabsList>
        
        <div className="mt-2">
          <Input
            placeholder="Search icons..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        
        <TabsContent value={activeTab} className="mt-2">
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
                    <span className="text-2xs text-muted-foreground truncate w-full text-center">
                      {opt.name.replace(/^(luc|hi):/, '')}
                    </span>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
      
      {value && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Selected:</span>
          <code className="px-1 py-0.5 rounded bg-muted text-foreground">{value}</code>
        </div>
      )}
    </div>
  );
};