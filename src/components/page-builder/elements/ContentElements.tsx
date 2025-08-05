import React, { useState } from 'react';
import { Quote, MessageSquare, ChevronDown, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PageBuilderElement } from '../types';
import { elementRegistry } from './ElementRegistry';

// Testimonial Element
const TestimonialElement: React.FC<{
  element: PageBuilderElement;
  isEditing?: boolean;
  onUpdate?: (updates: Partial<PageBuilderElement>) => void;
}> = ({ element, isEditing, onUpdate }) => {
  const testimonial = element.content.testimonial || 'This is an amazing product!';
  const author = element.content.author || 'John Doe';
  const position = element.content.position || 'CEO, Company';
  const rating = element.content.rating || 5;
  const avatar = element.content.avatar || '';

  return (
    <div className="max-w-md mx-auto p-6 border rounded-lg" style={element.styles}>
      <div className="flex items-center space-x-1 mb-4">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
          />
        ))}
      </div>
      <Quote className="h-8 w-8 text-primary mb-4" />
      <blockquote className="text-lg italic mb-4">"{testimonial}"</blockquote>
      <div className="flex items-center space-x-3">
        <Avatar>
          <AvatarImage src={avatar} />
          <AvatarFallback>{author.split(' ').map(n => n[0]).join('')}</AvatarFallback>
        </Avatar>
        <div>
          <div className="font-semibold">{author}</div>
          <div className="text-sm text-muted-foreground">{position}</div>
        </div>
      </div>
    </div>
  );
};

// FAQ Element
const FAQElement: React.FC<{
  element: PageBuilderElement;
  isEditing?: boolean;
  onUpdate?: (updates: Partial<PageBuilderElement>) => void;
}> = ({ element, isEditing, onUpdate }) => {
  const faqs = element.content.faqs || [
    { question: 'What is your return policy?', answer: 'We offer a 30-day return policy for all items.' },
    { question: 'How long does shipping take?', answer: 'Standard shipping takes 3-5 business days.' }
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-4" style={element.styles}>
      <h3 className="text-xl font-semibold mb-4">{element.content.title || 'Frequently Asked Questions'}</h3>
      {faqs.map((faq: any, index: number) => (
        <Collapsible key={index}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-4 border rounded-lg">
              <span className="font-medium text-left">{faq.question}</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="p-4 border-x border-b rounded-b-lg">
            <p className="text-muted-foreground">{faq.answer}</p>
          </CollapsibleContent>
        </Collapsible>
      ))}
    </div>
  );
};

// Accordion Element
const AccordionElement: React.FC<{
  element: PageBuilderElement;
  isEditing?: boolean;
  onUpdate?: (updates: Partial<PageBuilderElement>) => void;
}> = ({ element, isEditing, onUpdate }) => {
  const items = element.content.items || [
    { title: 'Section 1', content: 'Content for section 1' },
    { title: 'Section 2', content: 'Content for section 2' },
    { title: 'Section 3', content: 'Content for section 3' }
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-2" style={element.styles}>
      {items.map((item: any, index: number) => (
        <Collapsible key={index}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              {item.title}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="p-4 border border-t-0 rounded-b-lg">
            <p>{item.content}</p>
          </CollapsibleContent>
        </Collapsible>
      ))}
    </div>
  );
};

// Tabs Element
const TabsElement: React.FC<{
  element: PageBuilderElement;
  isEditing?: boolean;
  onUpdate?: (updates: Partial<PageBuilderElement>) => void;
}> = ({ element, isEditing, onUpdate }) => {
  const tabs = element.content.tabs || [
    { id: 'tab1', label: 'Tab 1', content: 'Content for tab 1' },
    { id: 'tab2', label: 'Tab 2', content: 'Content for tab 2' },
    { id: 'tab3', label: 'Tab 3', content: 'Content for tab 3' }
  ];

  return (
    <div className="max-w-2xl mx-auto" style={element.styles}>
      <Tabs defaultValue={tabs[0]?.id} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          {tabs.map((tab: any) => (
            <TabsTrigger key={tab.id} value={tab.id}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {tabs.map((tab: any) => (
          <TabsContent key={tab.id} value={tab.id} className="mt-6">
            <div className="p-4 border rounded-lg">
              <p>{tab.content}</p>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

// Register Content Elements
export const registerContentElements = () => {
  elementRegistry.register({
    id: 'testimonial',
    name: 'Testimonial',
    category: 'marketing',
    icon: Quote,
    component: TestimonialElement,
    defaultContent: {
      testimonial: 'This is an amazing product!',
      author: 'John Doe',
      position: 'CEO, Company',
      rating: 5,
      avatar: ''
    },
    description: 'Customer testimonial with rating'
  });

  elementRegistry.register({
    id: 'faq',
    name: 'FAQ',
    category: 'marketing',
    icon: MessageSquare,
    component: FAQElement,
    defaultContent: {
      title: 'Frequently Asked Questions',
      faqs: [
        { question: 'What is your return policy?', answer: 'We offer a 30-day return policy for all items.' },
        { question: 'How long does shipping take?', answer: 'Standard shipping takes 3-5 business days.' }
      ]
    },
    description: 'Frequently asked questions section'
  });

  elementRegistry.register({
    id: 'accordion',
    name: 'Accordion',
    category: 'basic',
    icon: MessageSquare,
    component: AccordionElement,
    defaultContent: {
      items: [
        { title: 'Section 1', content: 'Content for section 1' },
        { title: 'Section 2', content: 'Content for section 2' },
        { title: 'Section 3', content: 'Content for section 3' }
      ]
    },
    description: 'Collapsible content sections'
  });

  elementRegistry.register({
    id: 'tabs',
    name: 'Tabs',
    category: 'basic',
    icon: MessageSquare,
    component: TabsElement,
    defaultContent: {
      tabs: [
        { id: 'tab1', label: 'Tab 1', content: 'Content for tab 1' },
        { id: 'tab2', label: 'Tab 2', content: 'Content for tab 2' },
        { id: 'tab3', label: 'Tab 3', content: 'Content for tab 3' }
      ]
    },
    description: 'Tabbed content area'
  });
};