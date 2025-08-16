import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { RotateCcw } from 'lucide-react';
import { PageBuilderElement } from '../types';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface CountdownPropertiesProps {
  element: PageBuilderElement;
  onUpdate: (property: string, value: any) => void;
}

export const CountdownProperties: React.FC<CountdownPropertiesProps> = ({
  element,
  onUpdate
}) => {
  const { websiteId } = useParams();
  const [pages, setPages] = React.useState<Array<{ id: string; title: string; slug: string; is_homepage?: boolean }>>([]);
  
  const mode = element.content.mode || 'evergreen';
  const duration = element.content.duration || { days: 0, hours: 0, minutes: 30, seconds: 0 };
  const labels = element.content.labels || {
    days: 'Days',
    hours: 'Hours', 
    minutes: 'Minutes',
    seconds: 'Seconds'
  };

  React.useEffect(() => {
    if (websiteId) {
      supabase
        .from('website_pages')
        .select('id,title,slug,is_homepage')
        .eq('website_id', websiteId)
        .order('is_homepage', { ascending: false })
        .order('created_at', { ascending: false })
        .then(({ data }) => setPages((data as any) || []));
    }
  }, [websiteId]);

  const handleDurationUpdate = (field: string, value: number) => {
    onUpdate('duration', {
      ...duration,
      [field]: Math.max(0, value)
    });
  };

  const handleLabelsUpdate = (field: string, value: string) => {
    onUpdate('labels', {
      ...labels,
      [field]: value
    });
  };

  const handleResetEvergreen = () => {
    localStorage.removeItem(`countdown-${element.id}-start`);
  };

  return (
    <div className="space-y-4">
      {/* Timer Mode */}
      <div>
        <Label>Timer Mode</Label>
        <Select
          value={mode}
          onValueChange={(value) => onUpdate('mode', value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="evergreen">Evergreen (Auto Reset)</SelectItem>
            <SelectItem value="fixed">Fixed Duration</SelectItem>
            <SelectItem value="date">Specific Date</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Duration Settings (for evergreen and fixed modes) */}
      {(mode === 'evergreen' || mode === 'fixed') && (
        <div>
          <Label>Duration</Label>
          <div className="grid grid-cols-4 gap-2 mt-2">
            <div>
              <Label className="text-xs text-muted-foreground">Days</Label>
              <Input
                type="number"
                value={duration.days}
                onChange={(e) => handleDurationUpdate('days', parseInt(e.target.value) || 0)}
                min={0}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Hours</Label>
              <Input
                type="number"
                value={duration.hours}
                onChange={(e) => handleDurationUpdate('hours', parseInt(e.target.value) || 0)}
                min={0}
                max={23}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Minutes</Label>
              <Input
                type="number"
                value={duration.minutes}
                onChange={(e) => handleDurationUpdate('minutes', parseInt(e.target.value) || 0)}
                min={0}
                max={59}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Seconds</Label>
              <Input
                type="number"
                value={duration.seconds}
                onChange={(e) => handleDurationUpdate('seconds', parseInt(e.target.value) || 0)}
                min={0}
                max={59}
              />
            </div>
          </div>
        </div>
      )}

      {/* Target Date (for date mode) */}
      {mode === 'date' && (
        <div>
          <Label>Target Date & Time</Label>
          <Input
            type="datetime-local"
            value={element.content.targetDate || ''}
            onChange={(e) => onUpdate('targetDate', e.target.value)}
          />
        </div>
      )}

      <Separator />

      {/* Labels */}
      <div>
        <Label>Custom Labels</Label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div>
            <Label className="text-xs text-muted-foreground">Days Label</Label>
            <Input
              value={labels.days}
              onChange={(e) => handleLabelsUpdate('days', e.target.value)}
              placeholder="Days"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Hours Label</Label>
            <Input
              value={labels.hours}
              onChange={(e) => handleLabelsUpdate('hours', e.target.value)}
              placeholder="Hours"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Minutes Label</Label>
            <Input
              value={labels.minutes}
              onChange={(e) => handleLabelsUpdate('minutes', e.target.value)}
              placeholder="Minutes"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Seconds Label</Label>
            <Input
              value={labels.seconds}
              onChange={(e) => handleLabelsUpdate('seconds', e.target.value)}
              placeholder="Seconds"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-2 mt-2">
          <Switch
            checked={element.content.showLabels !== false}
            onCheckedChange={(checked) => onUpdate('showLabels', checked)}
          />
          <Label className="text-sm">Show labels</Label>
        </div>
      </div>

      <Separator />

      {/* Layout */}
      <div>
        <Label>Layout</Label>
        <Select
          value={element.content.layout || 'boxes'}
          onValueChange={(value) => onUpdate('layout', value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="boxes">Boxes</SelectItem>
            <SelectItem value="pill">Pill Shape</SelectItem>
            <SelectItem value="inline">Inline with Separator</SelectItem>
            <SelectItem value="stacked">Stacked Grid</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Separator (for inline layout) */}
      {element.content.layout === 'inline' && (
        <div>
          <Label>Separator</Label>
          <Input
            value={element.content.separator || ':'}
            onChange={(e) => onUpdate('separator', e.target.value)}
            placeholder=":"
          />
        </div>
      )}

      {/* Alignment */}
      <div>
        <Label>Alignment</Label>
        <Select
          value={element.content.alignment || 'center'}
          onValueChange={(value) => onUpdate('alignment', value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="left">Left</SelectItem>
            <SelectItem value="center">Center</SelectItem>
            <SelectItem value="right">Right</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Redirect Settings (for fixed and date modes) */}
      {(mode === 'fixed' || mode === 'date') && (
        <div>
          <Label>When Timer Expires</Label>
          <Select
            value={element.content.redirectType || 'url'}
            onValueChange={(value) => onUpdate('redirectType', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="url">Redirect to URL</SelectItem>
              <SelectItem value="page">Redirect to Page</SelectItem>
            </SelectContent>
          </Select>

          {element.content.redirectType === 'url' && (
            <div className="mt-2">
              <Label>Redirect URL</Label>
              <Input
                value={element.content.redirectUrl || ''}
                onChange={(e) => onUpdate('redirectUrl', e.target.value)}
                placeholder="https://example.com"
              />
            </div>
          )}

          {element.content.redirectType === 'page' && (
            <div className="mt-2">
              <Label>Select Page</Label>
              <Select
                value={element.content.pageSlug || ''}
                onValueChange={(value) => onUpdate('pageSlug', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a page" />
                </SelectTrigger>
                <SelectContent>
                  {pages.map(p => (
                    <SelectItem key={p.id} value={p.slug}>
                      {p.title || p.slug}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="mt-2">
            <Label>Target</Label>
            <Select
              value={element.content.target || '_self'}
              onValueChange={(value) => onUpdate('target', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_self">Same Tab</SelectItem>
                <SelectItem value="_blank">New Tab</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <Separator />

      {/* Maintenance */}
      <div>
        <Label>Maintenance</Label>
        <div className="space-y-2 mt-2">
          {mode === 'evergreen' && (
            <Button
              variant="outline" 
              size="sm"
              onClick={handleResetEvergreen}
              className="w-full"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset Evergreen Timer
            </Button>
          )}
          <p className="text-xs text-muted-foreground">
            {mode === 'evergreen' && 'Resets the start time to now'}
            {mode === 'fixed' && 'Timer will expire once and redirect'}
            {mode === 'date' && 'Timer will expire at the specified date/time'}
          </p>
        </div>
      </div>
    </div>
  );
};