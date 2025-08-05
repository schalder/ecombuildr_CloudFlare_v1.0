import React, { useState } from 'react';
import { Mail, Send, User, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { PageBuilderElement } from '../types';
import { elementRegistry } from './ElementRegistry';

// Contact Form Element
const ContactFormElement: React.FC<{
  element: PageBuilderElement;
  isEditing?: boolean;
  onUpdate?: (updates: Partial<PageBuilderElement>) => void;
}> = ({ element, isEditing, onUpdate }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Form submitted successfully!');
    setFormData({ name: '', email: '', message: '' });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-md mx-auto p-6 border rounded-lg" style={element.styles}>
      <h3 className="text-lg font-semibold mb-4">{element.content.title || 'Contact Us'}</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="Your name"
            required
          />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="your@email.com"
            required
          />
        </div>
        <div>
          <Label htmlFor="message">Message</Label>
          <Textarea
            id="message"
            value={formData.message}
            onChange={(e) => handleInputChange('message', e.target.value)}
            placeholder="Your message..."
            rows={4}
            required
          />
        </div>
        <Button type="submit" className="w-full">
          <Send className="h-4 w-4 mr-2" />
          Send Message
        </Button>
      </form>
    </div>
  );
};

// Newsletter Element
const NewsletterElement: React.FC<{
  element: PageBuilderElement;
  isEditing?: boolean;
  onUpdate?: (updates: Partial<PageBuilderElement>) => void;
}> = ({ element, isEditing, onUpdate }) => {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Successfully subscribed to newsletter!');
    setEmail('');
  };

  return (
    <div className="max-w-md mx-auto p-6 text-center" style={element.styles}>
      <Mail className="h-12 w-12 mx-auto mb-4 text-primary" />
      <h3 className="text-xl font-semibold mb-2">{element.content.title || 'Subscribe to Newsletter'}</h3>
      <p className="text-muted-foreground mb-4">
        {element.content.description || 'Get the latest updates and news delivered to your inbox.'}
      </p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          required
        />
        <Button type="submit" className="w-full">
          Subscribe
        </Button>
      </form>
    </div>
  );
};

// Form Field Element
const FormFieldElement: React.FC<{
  element: PageBuilderElement;
  isEditing?: boolean;
  onUpdate?: (updates: Partial<PageBuilderElement>) => void;
}> = ({ element, isEditing, onUpdate }) => {
  const fieldType = element.content.fieldType || 'text';
  const label = element.content.label || 'Field Label';
  const placeholder = element.content.placeholder || 'Enter value...';

  return (
    <div className="max-w-md" style={element.styles}>
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
      description: 'Get in touch with us'
    },
    description: 'Contact form with name, email and message fields'
  });

  elementRegistry.register({
    id: 'newsletter',
    name: 'Newsletter',
    category: 'form',
    icon: Mail,
    component: NewsletterElement,
    defaultContent: {
      title: 'Subscribe to Newsletter',
      description: 'Get the latest updates and news delivered to your inbox.'
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