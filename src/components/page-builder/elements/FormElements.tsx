import React, { useState } from 'react';
import { Mail, Send, User, MessageSquare, Phone } from 'lucide-react';
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

// Contact Form Element
const ContactFormElement: React.FC<{
  element: PageBuilderElement;
  isEditing?: boolean;
  deviceType?: 'desktop' | 'tablet' | 'mobile';
  columnCount?: number;
  onUpdate?: (updates: Partial<PageBuilderElement>) => void;
}> = ({ element, isEditing, onUpdate, deviceType, columnCount = 1 }) => {
  const { storeId } = useParams();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const showPhone = element.content.showPhone !== false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId) {
      toast.error('Store not found');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('submit-contact-form', {
        body: {
          store_id: storeId,
          customer_name: formData.name,
          customer_email: formData.email,
          customer_phone: formData.phone || null,
          message: formData.message,
          product_id: element.content.productId || null
        }
      });

      if (error) throw error;

      toast.success(element.content.successMessage || 'Form submitted successfully!');
      setFormData({ name: '', email: '', phone: '', message: '' });
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Failed to submit form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className={`${deviceType === 'tablet' && columnCount === 1 ? 'w-full' : 'max-w-md mx-auto'} p-6 border rounded-lg`} style={element.styles}>
      <h3 className="text-lg font-semibold mb-4">
        {element.content.title || 'Contact Us'}
      </h3>
      {element.content.description && (
        <p className="text-muted-foreground mb-4">{element.content.description}</p>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder={element.content.namePlaceholder || "Your name"}
            required
          />
        </div>
        <div>
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder={element.content.emailPlaceholder || "your@email.com"}
            required
          />
        </div>
        {showPhone && (
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder={element.content.phonePlaceholder || "Your phone number"}
            />
          </div>
        )}
        <div>
          <Label htmlFor="message">Message *</Label>
          <Textarea
            id="message"
            value={formData.message}
            onChange={(e) => handleInputChange('message', e.target.value)}
            placeholder={element.content.messagePlaceholder || "Your message..."}
            rows={4}
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          <Send className="h-4 w-4 mr-2" />
          {isSubmitting ? 'Sending...' : (element.content.buttonText || 'Send Message')}
        </Button>
      </form>
    </div>
  );
};

// Newsletter Element - Enhanced Form Builder
const NewsletterElement: React.FC<{
  element: PageBuilderElement;
  isEditing?: boolean;
  deviceType?: 'desktop' | 'tablet' | 'mobile';
  columnCount?: number;
  onUpdate?: (updates: Partial<PageBuilderElement>) => void;
}> = ({ element, isEditing, onUpdate, deviceType = 'desktop', columnCount = 1 }) => {
  const { storeId, funnelId } = useParams();
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get form configuration with defaults
  const formName = element.content.formName || 'Newsletter Subscription';
  const fields = element.content.fields || [];
  const buttonText = element.content.buttonText || 'Subscribe';
  const submitAction = element.content.submitAction || 'url';
  const redirectUrl = element.content.redirectUrl || '';
  const redirectStepId = element.content.redirectStepId || '';
  const successMessage = element.content.successMessage || 'Successfully subscribed!';

  // Get device-aware styles
  const elementStyles = renderElementStyles(element, deviceType);
  
  // Get responsive values
  const formWidth = getEffectiveResponsiveValue(element.styles?.responsive, 'formWidth', deviceType) || 'full';
  const fieldGap = getEffectiveResponsiveValue(element.styles?.responsive, 'fieldGap', deviceType) || '16px';
  const labelAlignment = getEffectiveResponsiveValue(element.styles?.responsive, 'labelAlignment', deviceType) || 'left';

  // Render individual form field
  const renderFormField = (field: FormField) => {
    const fieldValue = formData[field.id] || '';
    
    const handleFieldChange = (value: string) => {
      setFormData(prev => ({ ...prev, [field.id]: value }));
    };

    const fieldStyle = {
      borderColor: element.styles?.responsive?.[deviceType]?.fieldBorderColor || '#e5e7eb',
      color: element.styles?.responsive?.[deviceType]?.inputTextColor || '#000000',
      backgroundColor: element.styles?.responsive?.[deviceType]?.formBackgroundColor || 'transparent',
      borderRadius: element.styles?.responsive?.[deviceType]?.borderRadius || '6px',
      borderWidth: element.styles?.responsive?.[deviceType]?.borderWidth || '1px',
    };

    const labelStyle = {
      color: element.styles?.responsive?.[deviceType]?.formLabelColor || '#374151',
      fontSize: element.styles?.responsive?.[deviceType]?.labelFontSize || '14px',
      fontWeight: element.styles?.responsive?.[deviceType]?.labelFontWeight || '500',
      textAlign: labelAlignment as any,
    };

    const placeholderStyle = {
      color: element.styles?.responsive?.[deviceType]?.placeholderColor || '#9ca3af',
      fontSize: element.styles?.responsive?.[deviceType]?.placeholderFontSize || '14px',
    };

    const commonProps = {
      value: fieldValue,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => handleFieldChange(e.target.value),
      placeholder: field.placeholder,
      required: field.required,
      style: { ...fieldStyle, ...placeholderStyle },
    };

    switch (field.type) {
      case 'textBox':
        return (
          <div key={field.id}>
            <Label htmlFor={field.id} style={labelStyle}>
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
            <Textarea
              id={field.id}
              {...commonProps}
              rows={4}
            />
          </div>
        );
      default:
        return (
          <div key={field.id}>
            <Label htmlFor={field.id} style={labelStyle}>
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id={field.id}
              type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
              {...commonProps}
            />
          </div>
        );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!storeId) {
      toast.error('Store not found');
      return;
    }

    // Validate required fields
    const missingFields = fields.filter(field => field.required && !formData[field.id]);
    if (missingFields.length > 0) {
      toast.error(`Please fill in all required fields: ${missingFields.map(f => f.label).join(', ')}`);
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('submit-custom-form', {
        body: {
          store_id: storeId,
          funnel_id: funnelId || null,
          form_name: formName,
          form_id: element.id,
          custom_fields: formData,
          submit_action: submitAction,
          redirect_url: redirectUrl,
          redirect_step_id: redirectStepId,
        }
      });

      if (error) throw error;

      toast.success(successMessage);
      setFormData({});

      // Handle redirect
      if (submitAction === 'url' && redirectUrl) {
        window.location.href = redirectUrl;
      } else if (submitAction === 'step' && redirectStepId) {
        // Navigate to funnel step
        window.location.href = `/funnel/${funnelId}/${redirectStepId}`;
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Failed to submit form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Container styles
  const containerStyle = {
    ...elementStyles,
    width: formWidth === 'full' ? '100%' : formWidth === '75%' ? '75%' : formWidth === '50%' ? '50%' : formWidth === '25%' ? '25%' : formWidth,
    gap: fieldGap,
    backgroundColor: element.styles?.responsive?.[deviceType]?.formBackgroundColor || 'transparent',
    borderRadius: element.styles?.responsive?.[deviceType]?.borderRadius || '8px',
    borderWidth: element.styles?.responsive?.[deviceType]?.borderWidth || '0px',
    borderColor: element.styles?.responsive?.[deviceType]?.borderColor || 'transparent',
    borderStyle: 'solid',
    padding: element.styles?.padding || '24px',
  };

  const buttonStyle = {
    backgroundColor: element.styles?.responsive?.[deviceType]?.buttonBg || '#3b82f6',
    color: element.styles?.responsive?.[deviceType]?.buttonText || '#ffffff',
    fontSize: element.styles?.responsive?.[deviceType]?.buttonFontSize || '16px',
    fontWeight: element.styles?.responsive?.[deviceType]?.buttonFontWeight || '500',
    borderRadius: element.styles?.responsive?.[deviceType]?.borderRadius || '6px',
    border: 'none',
    padding: '12px 24px',
    cursor: 'pointer',
    width: '100%',
    transition: 'all 0.2s ease',
  };

  const buttonHoverStyle = {
    backgroundColor: element.styles?.responsive?.[deviceType]?.buttonHoverBg || '#2563eb',
    color: element.styles?.responsive?.[deviceType]?.buttonHoverText || '#ffffff',
  };

  return (
    <div 
      className={`${deviceType === 'tablet' && columnCount === 1 ? 'w-full' : 'mx-auto'} p-6`} 
      style={containerStyle}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {fields.map(renderFormField)}
        
        <Button 
          type="submit" 
          className="w-full" 
          disabled={isSubmitting}
          style={buttonStyle}
          onMouseEnter={(e) => Object.assign(e.currentTarget.style, buttonHoverStyle)}
          onMouseLeave={(e) => Object.assign(e.currentTarget.style, buttonStyle)}
        >
          {isSubmitting ? 'Submitting...' : buttonText}
        </Button>
      </form>
    </div>
  );
};

// Form Field Element
const FormFieldElement: React.FC<{
  element: PageBuilderElement;
  isEditing?: boolean;
  deviceType?: 'desktop' | 'tablet' | 'mobile';
  columnCount?: number;
  onUpdate?: (updates: Partial<PageBuilderElement>) => void;
}> = ({ element, isEditing, onUpdate, deviceType, columnCount = 1 }) => {
  const fieldType = element.content.fieldType || 'text';
  const label = element.content.label || 'Field Label';
  const placeholder = element.content.placeholder || 'Enter value...';

  return (
    <div className={`${deviceType === 'tablet' && columnCount === 1 ? 'w-full' : 'max-w-md'}`} style={element.styles}>
      <Label htmlFor={element.id}>{label}</Label>
      {fieldType === 'textarea' ? (
        <Textarea
          id={element.id}
          placeholder={placeholder}
          rows={3}
        />
      ) : (
        <Input
          id={element.id}
          type={fieldType}
          placeholder={placeholder}
        />
      )}
    </div>
  );
};

// Register Form Elements
export const registerFormElements = () => {
  elementRegistry.register({
    id: 'contact-form',
    name: 'Contact Form',
    category: 'form',
    icon: Mail,
    component: ContactFormElement,
    defaultContent: {
      title: 'Contact Us',
      description: 'Get in touch with us',
      showPhone: true,
      namePlaceholder: 'Your name',
      emailPlaceholder: 'your@email.com',
      phonePlaceholder: 'Your phone number',
      messagePlaceholder: 'Your message...',
      buttonText: 'Send Message',
      successMessage: 'Form submitted successfully!'
    },
    description: 'Contact form with name, email, phone and message fields'
  });

  elementRegistry.register({
    id: 'newsletter',
    name: 'Newsletter',
    category: 'form',
    icon: Mail,
    component: NewsletterElement,
    defaultContent: {
      formName: 'Newsletter Subscription',
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
      submitAction: 'url',
      redirectUrl: '',
      redirectStepId: '',
      successMessage: 'Successfully subscribed!'
    },
    description: 'Customizable form builder with dynamic fields'
  });

  elementRegistry.register({
    id: 'form-field',
    name: 'Form Field',
    category: 'form',
    icon: User,
    component: FormFieldElement,
    defaultContent: {
      fieldType: 'text',
      label: 'Field Label',
      placeholder: 'Enter value...'
    },
    description: 'Single form input field'
  });
};