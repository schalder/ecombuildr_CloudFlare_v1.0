import React, { useEffect, useState } from 'react';
import { BlockRenderer } from '@/components/blocks/BlockRenderer';
import { Block } from '@/components/blocks/types';
import { supabase } from '@/integrations/supabase/client';
import { useStore } from '@/contexts/StoreContext';

export const ThemeRenderer: React.FC = () => {
  const { store } = useStore();
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (store?.id) {
      loadThemeContent();
    }
  }, [store?.id]);

  const loadThemeContent = async () => {
    if (!store?.id) return;

    try {
      // First, try to get custom theme configuration
      const { data: customization } = await supabase
        .from('store_customizations')
        .select('sections')
        .eq('store_id', store.id)
        .eq('is_active', true)
        .single();

      let sections = [];

      if (customization?.sections && Array.isArray(customization.sections)) {
        // Use customized sections
        sections = customization.sections;
      } else {
        // Fallback to default template or create default content
        sections = [
          {
            type: 'hero_tech',
            content: {
              title: `Welcome to ${store.name}`,
              subtitle: 'Discover amazing products that transform your world',
              cta: 'Shop Now',
              background: 'gradient',
              layout: 'center'
            }
          },
          {
            type: 'featured_products',
            content: {
              title: 'Featured Products',
              limit: 8,
              layout: 'grid',
              showPrice: true
            }
          }
        ];
      }

      // Convert sections to blocks
      const themeBlocks: Block[] = sections.map((section: any, index: number) => ({
        id: `section_${index}`,
        type: section.type,
        content: section.content,
        attributes: {}
      }));

      setBlocks(themeBlocks);
    } catch (error) {
      console.error('Error loading theme content:', error);
      // Fallback to basic content
      setBlocks([
        {
          id: 'fallback_hero',
          type: 'hero_tech',
          content: {
            title: `Welcome to ${store?.name || 'Our Store'}`,
            subtitle: 'Discover amazing products',
            cta: 'Shop Now',
            background: 'gradient',
            layout: 'center'
          },
          attributes: {}
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse space-y-4 w-full max-w-4xl">
          <div className="h-64 bg-muted rounded-lg"></div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-48 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return <BlockRenderer blocks={blocks} className="min-h-screen" />;
};