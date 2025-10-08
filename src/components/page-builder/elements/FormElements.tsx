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
import { useStore } from '@/contexts/StoreContext';

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
  const { store } = useStore();
  const { funnelId } = useParams();
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

          // Get form configuration with defaults
          const formName = element.content.formName || 'Newsletter Subscription';
          const fields = element.content.fields || [];
          const buttonText = element.content.buttonText || 'Subscribe';
          const buttonSize = element.content.buttonSize || 'default';
          const submitAction = element.content.submitAction || 'url';
          const redirectUrl = element.content.redirectUrl || '';
          const redirectStepId = element.content.redirectStepId || '';
          const successMessage = element.content.successMessage || 'Successfully subscribed!';

  // Get device-aware styles
  const elementStyles = renderElementStyles(element, deviceType);
  
  // Get responsive values with proper null checks
  const formWidth = getEffectiveResponsiveValue(element, 'formWidth', deviceType) || 'full';
  const fieldGap = getEffectiveResponsiveValue(element, 'fieldGap', deviceType) || '16px';
  const labelAlignment = getEffectiveResponsiveValue(element, 'labelAlignment', deviceType) || 'left';

  // Render individual form field
  const renderFormField = (field: FormField) => {
    const fieldValue = formData[field.id] || '';
    
    const handleFieldChange = (value: string) => {
      setFormData(prev => ({ ...prev, [field.id]: value }));
    };

    // Get all styling values
    const fieldBorderColor = getEffectiveResponsiveValue(element, 'fieldBorderColor', deviceType, '#e5e7eb');
    const inputTextColor = getEffectiveResponsiveValue(element, 'inputTextColor', deviceType, '#000000');
    const fieldBackground = getEffectiveResponsiveValue(element, 'fieldBackground', deviceType, 'transparent');
    const fieldBorderRadius = getEffectiveResponsiveValue(element, 'fieldBorderRadius', deviceType, '6px');
    const fieldBorderWidth = getEffectiveResponsiveValue(element, 'fieldBorderWidth', deviceType, '1px');
    
    // Label styling
    const labelColor = getEffectiveResponsiveValue(element, 'formLabelColor', deviceType, '#374151');
    const labelFontSize = getEffectiveResponsiveValue(element, 'labelFontSize', deviceType, '14px');
    const labelFontWeight = getEffectiveResponsiveValue(element, 'labelFontWeight', deviceType, '500');
    const labelTextAlignment = getEffectiveResponsiveValue(element, 'labelAlignment', deviceType, 'left');
    
    // Placeholder styling
    const placeholderColor = getEffectiveResponsiveValue(element, 'placeholderColor', deviceType, '#9ca3af');
    const placeholderFontSize = getEffectiveResponsiveValue(element, 'placeholderFontSize', deviceType, '14px');
    const placeholderFontWeight = getEffectiveResponsiveValue(element, 'placeholderFontWeight', deviceType, '400');

    // Create unique IDs
    const fieldId = `form-field-${field.id}`;
    const labelId = `form-label-${field.id}`;

            // Create comprehensive dynamic CSS for this field
            const dynamicStyles = `
              /* Field styling */
              #${fieldId} {
                border-color: ${fieldBorderColor} !important;
                color: ${inputTextColor} !important;
                background-color: ${fieldBackground} !important;
                border-radius: ${fieldBorderRadius} !important;
                border-width: ${fieldBorderWidth} !important;
                border-style: solid !important;
                outline: none !important;
                box-shadow: none !important;
              }
              
              /* Focus state - maintain same border color */
              #${fieldId}:focus {
                border-color: ${fieldBorderColor} !important;
                outline: none !important;
                box-shadow: none !important;
              }
              
              /* Label styling */
              #${labelId} {
                color: ${labelColor} !important;
                font-size: ${labelFontSize} !important;
                font-weight: ${labelFontWeight} !important;
                text-align: ${labelTextAlignment} !important;
                display: block !important;
                width: 100% !important;
                margin-bottom: 8px !important;
              }
              
              /* Placeholder styling - all vendor prefixes */
              #${fieldId}::placeholder {
                color: ${placeholderColor} !important;
                font-size: ${placeholderFontSize} !important;
                font-weight: ${placeholderFontWeight} !important;
              }
              #${fieldId}::-webkit-input-placeholder {
                color: ${placeholderColor} !important;
                font-size: ${placeholderFontSize} !important;
                font-weight: ${placeholderFontWeight} !important;
              }
              #${fieldId}::-moz-placeholder {
                color: ${placeholderColor} !important;
                font-size: ${placeholderFontSize} !important;
                font-weight: ${placeholderFontWeight} !important;
              }
              #${fieldId}:-ms-input-placeholder {
                color: ${placeholderColor} !important;
                font-size: ${placeholderFontSize} !important;
                font-weight: ${placeholderFontWeight} !important;
              }
            `;

    const fieldStyle = {
      borderColor: fieldBorderColor,
      color: inputTextColor,
      backgroundColor: fieldBackground,
      borderRadius: fieldBorderRadius,
      borderWidth: fieldBorderWidth,
      borderStyle: 'solid',
      outline: 'none',
      boxShadow: 'none',
    };

    const commonProps = {
      value: fieldValue,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => handleFieldChange(e.target.value),
      placeholder: field.placeholder,
      required: field.required,
      id: fieldId,
      style: fieldStyle,
    };

    switch (field.type) {
      case 'textBox':
        return (
          <div key={field.id} className="space-y-2">
            <style dangerouslySetInnerHTML={{ __html: dynamicStyles }} />
            <Label htmlFor={fieldId} id={labelId}>
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
            <Textarea
              {...commonProps}
              rows={4}
              className="focus:ring-0 focus:ring-offset-0 focus:outline-none"
            />
          </div>
        );
      default:
        return (
          <div key={field.id} className="space-y-2">
            <style dangerouslySetInnerHTML={{ __html: dynamicStyles }} />
            <Label htmlFor={fieldId} id={labelId}>
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
            <Input
              type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
              {...commonProps}
              className="focus:ring-0 focus:ring-offset-0 focus:outline-none"
            />
          </div>
        );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!store?.id) {
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
          store_id: store.id,
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

  // Get form container values
  const formBackgroundColor = getEffectiveResponsiveValue(element, 'formBackground', deviceType, 'transparent');
  const formBorderRadius = getEffectiveResponsiveValue(element, 'formBorderRadius', deviceType, '8px');
  const formBorderWidth = getEffectiveResponsiveValue(element, 'formBorderWidth', deviceType, '0px');
  const formBorderColor = getEffectiveResponsiveValue(element, 'formBorderColor', deviceType, 'transparent');

  // Create dynamic CSS for form container
  const containerId = `form-container-${element.id}`;
  const containerStyles = `
    #${containerId} {
      background-color: ${formBackgroundColor} !important;
      border-radius: ${formBorderRadius} !important;
      border-width: ${formBorderWidth} !important;
      border-color: ${formBorderColor} !important;
      border-style: solid !important;
    }
  `;

  // Container styles with proper null checks
  const containerStyle = {
    ...elementStyles,
    width: formWidth === 'full' ? '100%' : formWidth === '75%' ? '75%' : formWidth === '50%' ? '50%' : formWidth === '25%' ? '25%' : formWidth,
    backgroundColor: formBackgroundColor,
    borderRadius: formBorderRadius,
    borderWidth: formBorderWidth,
    borderColor: formBorderColor,
    borderStyle: 'solid',
    padding: element.styles?.padding || '24px',
  };

  // Get button color values
  const buttonBg = getEffectiveResponsiveValue(element, 'buttonBg', deviceType, '#3b82f6');
  const buttonTextColor = getEffectiveResponsiveValue(element, 'buttonText', deviceType, '#ffffff');
  const buttonFontSize = getEffectiveResponsiveValue(element, 'buttonFontSize', deviceType, '16px');
  const buttonFontWeight = getEffectiveResponsiveValue(element, 'buttonFontWeight', deviceType, '500');
  const buttonBorderRadius = getEffectiveResponsiveValue(element, 'fieldBorderRadius', deviceType, '6px');
  const buttonHoverBg = getEffectiveResponsiveValue(element, 'buttonHoverBg', deviceType, '#2563eb');
  const buttonHoverText = getEffectiveResponsiveValue(element, 'buttonHoverText', deviceType, '#ffffff');

  // Create dynamic CSS for button
  const buttonId = `form-button-${element.id}`;
  const buttonStyles = `
    #${buttonId} {
      background-color: ${buttonBg} !important;
      color: ${buttonTextColor} !important;
      font-size: ${buttonFontSize} !important;
      font-weight: ${buttonFontWeight} !important;
      border-radius: ${buttonBorderRadius} !important;
      border: none !important;
      padding: 12px 24px !important;
      cursor: pointer !important;
      width: 100% !important;
      transition: all 0.2s ease !important;
    }
    #${buttonId}:hover {
      background-color: ${buttonHoverBg} !important;
      color: ${buttonHoverText} !important;
    }
  `;

  const buttonStyle = {
    backgroundColor: buttonBg,
    color: buttonTextColor,
    fontSize: buttonFontSize,
    fontWeight: buttonFontWeight,
    borderRadius: buttonBorderRadius,
    border: 'none',
    padding: '12px 24px',
    cursor: 'pointer',
    width: '100%',
    transition: 'all 0.2s ease',
  };

  return (
    <div 
      id={containerId}
      className={`${deviceType === 'tablet' && columnCount === 1 ? 'w-full' : 'mx-auto'} p-6`} 
      style={containerStyle}
    >
      <style dangerouslySetInnerHTML={{ __html: containerStyles + buttonStyles }} />
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: fieldGap }}>
        {fields.map(renderFormField)}
        
                <Button 
                  type="submit" 
                  className={`w-full ${buttonSize === 'sm' ? 'h-8 px-3 text-sm' : 
                    buttonSize === 'lg' ? 'h-12 px-6 text-lg' : 
                    buttonSize === 'xl' ? 'h-14 px-8 text-xl' : 
                    'h-10 px-4'}`}
                  disabled={isSubmitting}
                  id={buttonId}
                  style={buttonStyle}
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
            buttonSize: 'default',
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