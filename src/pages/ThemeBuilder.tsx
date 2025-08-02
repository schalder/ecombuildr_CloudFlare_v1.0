import React, { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { ThemeTemplateSelector } from '@/components/ThemeTemplateSelector';
import { ThemeCustomizer } from '@/components/ThemeCustomizer';
import { useUserStore } from '@/hooks/useUserStore';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface ThemeTemplate {
  id: string;
  name: string;
  slug: string;
  description: string;
  config: Record<string, any>;
  sections: any[];
  is_premium: boolean;
}

export const ThemeBuilder = () => {
  const { store: currentStore } = useUserStore();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<ThemeTemplate | null>(null);
  const [step, setStep] = useState<'select' | 'customize'>('select');

  const handleTemplateSelect = (template: ThemeTemplate) => {
    setSelectedTemplate(template);
    setStep('customize');
  };

  const handlePreview = (template: ThemeTemplate) => {
    // TODO: Implement preview functionality
    toast({
      title: "Preview Coming Soon",
      description: "Preview functionality will be available soon.",
    });
  };

  const handleBack = () => {
    setStep('select');
    setSelectedTemplate(null);
  };

  const handleSave = () => {
    toast({
      title: "Theme Applied",
      description: "Your new theme has been applied to your store.",
    });
    navigate('/dashboard');
  };

  if (!currentStore) {
    return (
      <DashboardLayout 
        title="Theme Builder" 
        description="Choose and customize your store theme"
      >
        <div className="text-center py-12">
          <p className="text-muted-foreground">Please select a store to continue.</p>
        </div>
      </DashboardLayout>
    );
  }

  if (step === 'customize' && selectedTemplate) {
    return (
      <ThemeCustomizer
        template={selectedTemplate}
        storeId={currentStore.id}
        onBack={handleBack}
        onSave={handleSave}
      />
    );
  }

  return (
    <DashboardLayout 
      title="Theme Builder" 
      description="Choose and customize your store theme"
    >
      <div className="space-y-8">
        <ThemeTemplateSelector
          onTemplateSelect={handleTemplateSelect}
          onPreview={handlePreview}
        />
      </div>
    </DashboardLayout>
  );
};

export default ThemeBuilder;