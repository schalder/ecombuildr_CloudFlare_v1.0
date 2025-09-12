import React, { useState } from 'react';
import { Mail, Send, User, MessageSquare, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { PageBuilderElement } from '../types';
import { elementRegistry } from './ElementRegistry';
import { supabase } from '@/integrations/supabase/client';
import { useParams } from 'react-router-dom';
import { renderElementStyles, stripElementMargins } from '../utils/styleRenderer';

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

  const elementStyles = renderElementStyles(element, deviceType);
  const finalStyles = !isEditing ? elementStyles : stripElementMargins(elementStyles);

  return (
    <div className={`${deviceType === 'tablet' && columnCount === 1 ? 'w-full' : 'max-w-md mx-auto'} p-6 border rounded-lg`} style={finalStyles}>
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

// Newsletter Element
const NewsletterElement: React.FC<{
  element: PageBuilderElement;
  isEditing?: boolean;
  deviceType?: 'desktop' | 'tablet' | 'mobile';
  columnCount?: number;
  onUpdate?: (updates: Partial<PageBuilderElement>) => void;
}> = ({ element, isEditing, onUpdate, deviceType, columnCount = 1 }) => {
  const { storeId } = useParams();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId) {
      toast.error('Store not found');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('subscribe-newsletter', {
        body: {
          store_id: storeId,
          email: email
        }
      });

      if (error) throw error;

      const successMessage = data.already_subscribed 
        ? 'You are already subscribed!' 
        : (element.content.successMessage || 'Successfully subscribed to newsletter!');
      
      toast.success(successMessage);
      setEmail('');
    } catch (error) {
      console.error('Error subscribing to newsletter:', error);
      toast.error('Failed to subscribe. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const elementStyles = renderElementStyles(element, deviceType);
  const finalStyles = !isEditing ? elementStyles : stripElementMargins(elementStyles);

  return (
    <div className={`${deviceType === 'tablet' && columnCount === 1 ? 'w-full' : 'max-w-md mx-auto'} p-6 text-center`} style={finalStyles}>
      <Mail className="h-12 w-12 mx-auto mb-4 text-primary" />
      <h3 className="text-xl font-semibold mb-2">
        {element.content.title || 'Subscribe to Newsletter'}
      </h3>
      <p className="text-muted-foreground mb-4">
        {element.content.description || 'Get the latest updates and news delivered to your inbox.'}
      </p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={element.content.emailPlaceholder || "Enter your email"}
          required
        />
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Subscribing...' : (element.content.buttonText || 'Subscribe')}
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

  const elementStyles = renderElementStyles(element, deviceType);
  const finalStyles = !isEditing ? elementStyles : stripElementMargins(elementStyles);

  return (
    <div className={`${deviceType === 'tablet' && columnCount === 1 ? 'w-full' : 'max-w-md'}`} style={finalStyles}>
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
      title: 'Subscribe to Newsletter',
      description: 'Get the latest updates and news delivered to your inbox.',
      emailPlaceholder: 'Enter your email',
      buttonText: 'Subscribe',
      successMessage: 'Successfully subscribed to newsletter!'
    },
    description: 'Email subscription form'
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