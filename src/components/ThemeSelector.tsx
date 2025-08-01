import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Theme {
  id: string;
  name: string;
  description: string;
  preview_image: string;
  config: any;
  is_premium: boolean;
}

interface ThemeSelectorProps {
  selectedThemeId?: string;
  onThemeSelect: (themeId: string) => void;
}

export const ThemeSelector = ({ selectedThemeId, onThemeSelect }: ThemeSelectorProps) => {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchThemes();
  }, []);

  const fetchThemes = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('themes')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setThemes(data || []);
    } catch (error) {
      console.error('Error fetching themes:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <div className="aspect-video bg-muted rounded-t-lg" />
            <CardHeader>
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-full" />
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {themes.map((theme) => (
          <Card 
            key={theme.id} 
            className={`relative cursor-pointer transition-all hover:shadow-md ${
              selectedThemeId === theme.id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => onThemeSelect(theme.id)}
          >
            {selectedThemeId === theme.id && (
              <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1 z-10">
                <Check className="h-4 w-4" />
              </div>
            )}
            
            <div className="aspect-video bg-muted rounded-t-lg relative overflow-hidden">
              {theme.preview_image ? (
                <img 
                  src={theme.preview_image} 
                  alt={`${theme.name} theme preview`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
                  <Eye className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
            </div>
            
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{theme.name}</CardTitle>
                {theme.is_premium && (
                  <Badge variant="secondary">Premium</Badge>
                )}
              </div>
              <CardDescription>{theme.description}</CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <div 
                  className="w-4 h-4 rounded-full border" 
                  style={{ backgroundColor: theme.config?.colors?.primary || '#10B981' }}
                />
                <span>Primary Color</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};