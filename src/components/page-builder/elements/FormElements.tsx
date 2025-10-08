import React, { useState } from 'react';
import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { PageBuilderElement, FormField } from '../types';
import { elementRegistry } from './ElementRegistry';
import { supabase } from '@/integrations/supabase/client';
import { useParams } from 'react-router-dom';
import { renderElementStyles } from '../utils/styleRenderer';
import { getEffectiveResponsiveValue } from '../utils/responsiveHelpers';
import { useStore } from '@/contexts/StoreContext';

// Newsletter Element - Enhanced Form Builder (now called Optin Form)
const NewsletterElement: React.FC<{
  element: PageBuilderElement;
  isEditing?: boolean;
  deviceType?: 'desktop' | 'tablet' | 'mobile';
  columnCount?: number;
  onUpdate?: (updates: Partial<PageBuilderElement>) => void;
}> = ({ element, isEditing, onUpdate, deviceType = 'desktop', columnCount = 1 }) => {
  const { store } = useStore();
  const { funnelId } = useParams();
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get form configuration with defaults
  const formName = element.content.formName || 'Optin Form';
  const fields = element.content.fields || [];
  const buttonText = element.content.buttonText || 'Submit';
  const buttonSize = element.content.buttonSize || 'default';
  const submitAction = element.content.submitAction || 'url';
  const redirectUrl = element.content.redirectUrl || '';
  const redirectStepId = element.content.redirectStepId || '';
  const successMessage = element.content.successMessage || 'Form submitted successfully!';

  // Generate unique IDs for styling
  const containerId = `form-container-${element.id}`;
  const buttonId = `form-button-${element.id}`;

  // Get responsive values for styling
  const formWidth = getEffectiveResponsiveValue(element, 'formWidth', deviceType, '100%');
  const fieldGap = getEffectiveResponsiveValue(element, 'fieldGap', deviceType, '16px');
  const labelAlignment = getEffectiveResponsiveValue(element, 'labelAlignment', deviceType, 'left');
  const labelColor = getEffectiveResponsiveValue(element, 'labelColor', deviceType, '#374151');
  const labelFontSize = getEffectiveResponsiveValue(element, 'labelFontSize', deviceType, '14px');
  const labelFontWeight = getEffectiveResponsiveValue(element, 'labelFontWeight', deviceType, '500');
  const fieldBorderColor = getEffectiveResponsiveValue(element, 'fieldBorderColor', deviceType, '#d1d5db');
  const fieldBorderWidth = getEffectiveResponsiveValue(element, 'fieldBorderWidth', deviceType, '1px');
  const fieldBorderRadius = getEffectiveResponsiveValue(element, 'fieldBorderRadius', deviceType, '6px');
  const inputTextColor = getEffectiveResponsiveValue(element, 'inputTextColor', deviceType, '#111827');
  const fieldBackground = getEffectiveResponsiveValue(element, 'fieldBackground', deviceType, '#ffffff');
  const placeholderColor = getEffectiveResponsiveValue(element, 'placeholderColor', deviceType, '#9ca3af');
  const placeholderFontSize = getEffectiveResponsiveValue(element, 'placeholderFontSize', deviceType, '14px');
  const placeholderFontWeight = getEffectiveResponsiveValue(element, 'placeholderFontWeight', deviceType, '400');
  const buttonBg = getEffectiveResponsiveValue(element, 'buttonBg', deviceType, '#3b82f6');
  const buttonTextColor = getEffectiveResponsiveValue(element, 'buttonText', deviceType, '#ffffff');
  const buttonFontSize = getEffectiveResponsiveValue(element, 'buttonFontSize', deviceType, '16px');
  const buttonFontWeight = getEffectiveResponsiveValue(element, 'buttonFontWeight', deviceType, '500');
  const buttonHoverBg = getEffectiveResponsiveValue(element, 'buttonHoverBg', deviceType, '#2563eb');
  const buttonHoverText = getEffectiveResponsiveValue(element, 'buttonHoverText', deviceType, '#ffffff');
  const formBackground = getEffectiveResponsiveValue(element, 'formBackground', deviceType, 'transparent');
  const formBorderColor = getEffectiveResponsiveValue(element, 'formBorderColor', deviceType, '#e5e7eb');
  const formBorderWidth = getEffectiveResponsiveValue(element, 'formBorderWidth', deviceType, '1px');
  const formBorderRadius = getEffectiveResponsiveValue(element, 'formBorderRadius', deviceType, '8px');

  // Generate dynamic CSS for form styling
  const dynamicStyles = `
    #${containerId} {
      background-color: ${formBackground} !important;
      border: ${formBorderWidth} solid ${formBorderColor} !important;
      border-radius: ${formBorderRadius} !important;
      width: ${formWidth} !important;
      padding: 20px !important;
    }
    
    #${containerId} .form-field {
      margin-bottom: ${fieldGap} !important;
    }
    
    #${containerId} .form-label {
      color: ${labelColor} !important;
      font-size: ${labelFontSize} !important;
      font-weight: ${labelFontWeight} !important;
      text-align: ${labelAlignment} !important;
      display: block !important;
      width: 100% !important;
      margin-bottom: 8px !important;
    }
    
    #${containerId} .form-input {
      border: ${fieldBorderWidth} solid ${fieldBorderColor} !important;
      border-radius: ${fieldBorderRadius} !important;
      background-color: ${fieldBackground} !important;
      color: ${inputTextColor} !important;
      outline: none !important;
      box-shadow: none !important;
    }
    
    #${containerId} .form-input:focus {
      outline: none !important;
      box-shadow: none !important;
    }
    
    #${containerId} .form-input::placeholder {
      color: ${placeholderColor} !important;
      font-size: ${placeholderFontSize} !important;
      font-weight: ${placeholderFontWeight} !important;
    }
    
    #${containerId} .form-input::-webkit-input-placeholder {
      color: ${placeholderColor} !important;
      font-size: ${placeholderFontSize} !important;
      font-weight: ${placeholderFontWeight} !important;
    }
    
    #${containerId} .form-input::-moz-placeholder {
      color: ${placeholderColor} !important;
      font-size: ${placeholderFontSize} !important;
      font-weight: ${placeholderFontWeight} !important;
    }
    
    #${containerId} .form-input:-ms-input-placeholder {
      color: ${placeholderColor} !important;
      font-size: ${placeholderFontSize} !important;
      font-weight: ${placeholderFontWeight} !important;
    }
    
    #${buttonId} {
      background-color: ${buttonBg} !important;
      color: ${buttonTextColor} !important;
      font-size: ${buttonFontSize} !important;
      font-weight: ${buttonFontWeight} !important;
      border-radius: ${fieldBorderRadius} !important;
      border: none !important;
    }
    
    #${buttonId}:hover {
      background-color: ${buttonHoverBg} !important;
      color: ${buttonHoverText} !important;
    }
  `;

  const handleInputChange = (fieldId: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!store?.id) {
      toast.error('Store not found');
      return;
    }

    setIsSubmitting(true);

    try {
      // Transform formData to use field labels as keys instead of field IDs
      const customFieldsWithLabels = fields.reduce((acc, field) => {
        if (formData[field.id]) {
          acc[field.label] = formData[field.id];
        }
        return acc;
      }, {} as Record<string, string>);

      const { data, error } = await supabase.functions.invoke('submit-custom-form', {
        body: {
          store_id: store.id,
          funnel_id: funnelId || null,
          form_name: formName,
          form_id: element.id,
          custom_fields: customFieldsWithLabels,
          customer_name: formData[fields.find(f => f.type === 'fullName')?.id || ''] || '',
          customer_email: formData[fields.find(f => f.type === 'email')?.id || ''] || '',
          customer_phone: formData[fields.find(f => f.type === 'phone')?.id || ''] || null,
          message: formData[fields.find(f => f.type === 'textBox')?.id || ''] || null,
          form_type: 'custom_form'
        }
      });

      if (error) throw error;

      toast.success(successMessage);
      
      // Clear form
      setFormData({});

      // Handle redirect based on submit action
      if (submitAction === 'step' && redirectStepId) {
        // Redirect to funnel step
        window.location.href = `/funnel/${funnelId}/${redirectStepId}`;
      } else if (submitAction === 'url' && redirectUrl) {
        // Redirect to custom URL
        window.location.href = redirectUrl;
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Failed to submit form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFormField = (field: FormField) => {
    const fieldId = `form-field-${field.id}`;
    const labelId = `form-label-${field.id}`;
    
    const fieldStyle = {
      outline: 'none',
      boxShadow: 'none'
    };

    return (
      <div key={field.id} className="form-field">
        <Label 
          htmlFor={fieldId} 
          className="form-label"
          id={labelId}
        >
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        <div className="space-y-2">
          {field.type === 'textBox' ? (
            <Textarea
              id={fieldId}
              value={formData[field.id] || ''}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              placeholder={field.placeholder || ''}
              required={field.required}
              className="form-input focus:ring-0 focus:ring-offset-0 focus:outline-none"
              style={fieldStyle}
              rows={4}
            />
          ) : (
            <Input
              id={fieldId}
              type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
              value={formData[field.id] || ''}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              placeholder={field.placeholder || ''}
              required={field.required}
              className="form-input focus:ring-0 focus:ring-offset-0 focus:outline-none"
              style={fieldStyle}
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <div id={containerId} className="w-full">
      <style dangerouslySetInnerHTML={{ __html: dynamicStyles }} />
      <form onSubmit={handleSubmit} className="space-y-4">
        {fields.map(renderFormField)}
        
        <Button 
          type="submit" 
          className={`w-full ${buttonSize === 'sm' ? 'h-8 px-3 text-sm' : 
            buttonSize === 'lg' ? 'h-12 px-6 text-lg' : 
            buttonSize === 'xl' ? 'h-14 px-8 text-xl' : 
            'h-10 px-4'}`}
          disabled={isSubmitting}
          id={buttonId}
        >
          {isSubmitting ? 'Submitting...' : buttonText}
        </Button>
      </form>
    </div>
  );
};

// Register Form Elements
export const registerFormElements = () => {
  // Register Optin Form (moved from Newsletter) in basic category
  elementRegistry.register({
    id: 'newsletter',
    name: 'Optin Form',
    category: 'basic',
    icon: Mail,
    component: NewsletterElement,
    defaultContent: {
      formName: 'Optin Form',
      fields: [
        {
          id: 'field-1',
          type: 'fullName',
          label: 'Full Name',
          placeholder: 'Enter your full name',
          required: true
        },
        {
          id: 'field-2',
          type: 'phone',
          label: 'Phone Number',
          placeholder: 'Enter your phone number',
          required: true
        },
        {
          id: 'field-3',
          type: 'email',
          label: 'Email Address',
          placeholder: 'Enter your email',
          required: true
        }
      ],
      buttonText: 'Subscribe',
      buttonSize: 'default',
      submitAction: 'url',
      redirectUrl: '',
      redirectStepId: '',
      successMessage: 'Successfully subscribed!'
    },
    description: 'Advanced optin form builder with dynamic fields and styling'
  });
};