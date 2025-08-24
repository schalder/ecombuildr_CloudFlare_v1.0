import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PageBuilderRenderer } from '@/components/storefront/PageBuilderRenderer';
import { PageBuilderData } from '@/components/page-builder/types';

export default function AdminTemplatePreview() {
  const { templateId } = useParams();

  const { data: template, isLoading, error } = useQuery({
    queryKey: ['template-preview', templateId],
    queryFn: async () => {
      if (!templateId) throw new Error('Template ID is required');
      
      const { data, error } = await supabase
        .from('page_templates')
        .select('name, content')
        .eq('id', templateId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: Boolean(templateId),
  });

  if (!templateId) {
    return <Navigate to="/admin/templates" replace />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading template preview...</div>
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Template Not Found</h1>
          <p className="text-muted-foreground">The requested template could not be loaded.</p>
        </div>
      </div>
    );
  }

  const builderData: PageBuilderData = template.content as any || {
    sections: [],
    globalStyles: {},
    pageStyles: {}
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Template content */}
      <PageBuilderRenderer data={builderData} />
    </div>
  );
}