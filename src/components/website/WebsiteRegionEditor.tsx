import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ElementorPageBuilder } from '@/components/page-builder/ElementorPageBuilder';
import type { PageBuilderData } from '@/components/page-builder/types';

interface WebsiteRegionEditorProps {
  website: {
    id: string;
    name: string;
    settings?: any;
  };
  region: 'header' | 'footer';
}

export const WebsiteRegionEditor: React.FC<WebsiteRegionEditorProps> = ({ website, region }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Resolve keys in settings
  const settingsKey = region === 'header' ? 'global_header' : 'global_footer';

  const initialState = useMemo(() => {
    const regionSettings = website.settings?.[settingsKey] || {};
    return {
      enabled: Boolean(regionSettings.enabled),
      data: (regionSettings.data as PageBuilderData) || { sections: [] },
    };
  }, [website.settings, settingsKey]);

  const [enabled, setEnabled] = useState<boolean>(initialState.enabled);
  const [builderData, setBuilderData] = useState<PageBuilderData>(initialState.data);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setEnabled(initialState.enabled);
    setBuilderData(initialState.data);
  }, [initialState.enabled, initialState.data]);

  const updateWebsite = useMutation({
    mutationFn: async (payload: { enabled: boolean; data: PageBuilderData }) => {
      const newSettings = {
        ...(website.settings || {}),
        [settingsKey]: {
          enabled: payload.enabled,
          data: payload.data,
        },
      };

      const { error } = await supabase
        .from('websites')
        .update({ settings: newSettings, updated_at: new Date().toISOString() })
        .eq('id', website.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['website', website.id] });
      toast({ title: 'Saved', description: `${region === 'header' ? 'Header' : 'Footer'} updated successfully.` });
    },
    onError: (err) => {
      console.error('Failed to save region', err);
      toast({ title: 'Error', description: 'Failed to save. Please try again.', variant: 'destructive' });
    },
  });

  const handleSave = async () => {
    setIsSaving(true);
    updateWebsite.mutate({ enabled, data: builderData });
    setIsSaving(false);
  };

  const handleReset = () => {
    setBuilderData({ sections: [] });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Global {region === 'header' ? 'Header' : 'Footer'}</h2>
        <p className="text-muted-foreground">Build a global {region} for this website. When enabled, it will appear on all pages of this website.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{region === 'header' ? 'Header' : 'Footer'} Settings</CardTitle>
          <CardDescription>Toggle and customize the global {region} for this website.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <div className="text-base font-medium">Enable Global {region === 'header' ? 'Header' : 'Footer'}</div>
              <div className="text-sm text-muted-foreground">When enabled, this {region} will be rendered on all website pages.</div>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Design {region === 'header' ? 'Header' : 'Footer'}</div>
                <div className="text-sm text-muted-foreground">Use the builder to add sections, rows, and elements.</div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={handleReset}>Reset</Button>
                <Button onClick={handleSave} disabled={isSaving} className="min-w-28">
                  {isSaving ? 'Saving…' : 'Save'}
                </Button>
              </div>
            </div>

            {/* Builder */}
            <div className={`border rounded-lg ${enabled ? '' : 'pointer-events-none opacity-60'}`}>
              <ElementorPageBuilder
                initialData={builderData}
                onChange={(d) => setBuilderData(d)}
                onSave={handleSave}
                isSaving={isSaving}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
