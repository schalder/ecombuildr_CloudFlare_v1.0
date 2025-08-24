import React, { useState } from 'react';
import { Quote, MessageSquare, ChevronDown, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { PageBuilderElement } from '../types';
import { elementRegistry } from './ElementRegistry';
import { InlineEditor } from '../components/InlineEditor';
import { renderElementStyles } from '../utils/styleRenderer';
import { generateResponsiveCSS } from '../utils/responsiveStyles';

// Testimonial Element
const TestimonialElement: React.FC<{
  element: PageBuilderElement;
  isEditing?: boolean;
  deviceType?: 'desktop' | 'tablet' | 'mobile';
  columnCount?: number;
  onUpdate?: (updates: Partial<PageBuilderElement>) => void;
}> = ({ element, isEditing, onUpdate, deviceType, columnCount = 1 }) => {
  const testimonial = element.content.testimonial || 'This is an amazing product!';
  const author = element.content.author || 'John Doe';
  const position = element.content.position || 'CEO, Company';
  const rating = element.content.rating || 5;
  const avatar = element.content.avatar || '';
  const showQuote = element.content.showQuote !== false;

  const handleUpdate = (property: string, value: any) => {
    if (onUpdate) {
      onUpdate({
        content: {
          ...element.content,
          [property]: value
        }
      });
    }
  };

  const handleRatingClick = (newRating: number) => {
    if (isEditing) {
      handleUpdate('rating', newRating);
    }
  };

  return (
    <div className={`${deviceType === 'tablet' && columnCount === 1 ? 'w-full' : 'max-w-md mx-auto'} p-6 border rounded-lg bg-background`} style={element.styles}>
      <div className="flex items-center space-x-1 mb-4">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 transition-colors ${
              i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            } ${isEditing ? 'cursor-pointer hover:text-yellow-300' : ''}`}
            onClick={() => handleRatingClick(i + 1)}
          />
        ))}
      </div>
      
      {showQuote && <Quote className="h-8 w-8 text-primary mb-4" />}
      
      <blockquote className="text-lg italic mb-4">
        <InlineEditor
          value={testimonial}
          onChange={(value) => handleUpdate('testimonial', value)}
          placeholder="Enter testimonial text..."
          multiline
          disabled={!isEditing}
          className="text-lg italic"
        />
      </blockquote>
      
      <div className="flex items-center space-x-3">
        <Avatar>
          <AvatarImage src={avatar} />
          <AvatarFallback>{author.split(' ').map(n => n[0]).join('')}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="font-semibold">
            <InlineEditor
              value={author}
              onChange={(value) => handleUpdate('author', value)}
              placeholder="Author name"
              disabled={!isEditing}
              className="font-semibold"
            />
          </div>
          <div className="text-sm text-muted-foreground">
            <InlineEditor
              value={position}
              onChange={(value) => handleUpdate('position', value)}
              placeholder="Position, Company"
              disabled={!isEditing}
              className="text-sm text-muted-foreground"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// FAQ Element
const FAQElement: React.FC<{
  element: PageBuilderElement;
  isEditing?: boolean;
  deviceType?: 'desktop' | 'tablet' | 'mobile';
  columnCount?: number;
  onUpdate?: (updates: Partial<PageBuilderElement>) => void;
}> = ({ element, isEditing, onUpdate, deviceType, columnCount = 1 }) => {
  const faqs = element.content.faqs || [
    { question: 'What is your return policy?', answer: 'We offer a 30-day return policy for all items.' },
    { question: 'How long does shipping take?', answer: 'Standard shipping takes 3-5 business days.' }
  ];
  const title = element.content.title || 'Frequently Asked Questions';

  const handleUpdate = (property: string, value: any) => {
    if (onUpdate) {
      onUpdate({
        content: {
          ...element.content,
          [property]: value
        }
      });
    }
  };

  const updateFAQ = (index: number, field: 'question' | 'answer', value: string) => {
    const newFAQs = [...faqs];
    newFAQs[index] = { ...newFAQs[index], [field]: value };
    handleUpdate('faqs', newFAQs);
  };

  // Generate responsive CSS for this element
  const responsiveCSS = generateResponsiveCSS(element.id, element.styles);
  
  // Get base styles using the utility function
  const containerStyles = renderElementStyles(element, deviceType);
  
  // Determine device key for responsive styles
  const deviceKey = deviceType === 'tablet' ? 'desktop' : deviceType;
  
  // Get question and answer specific styles
  const questionStyles = (element.styles as any)?.questionStyles?.responsive?.[deviceKey] || {};
  const answerStyles = (element.styles as any)?.answerStyles?.responsive?.[deviceKey] || {};
  
  // Get current responsive styles for hover effects
  const currentResponsiveStyles = element.styles?.responsive?.[deviceKey] || {};
  
  // Create inline styles for questions and answers
  const questionInlineStyles = {
    fontSize: questionStyles.fontSize,
    lineHeight: questionStyles.lineHeight,
    color: questionStyles.color,
    fontFamily: questionStyles.fontFamily,
    fontWeight: questionStyles.fontWeight,
    textAlign: questionStyles.textAlign || 'left'
  };

  const answerInlineStyles = {
    fontSize: answerStyles.fontSize,
    lineHeight: answerStyles.lineHeight,
    color: answerStyles.color,
    fontFamily: answerStyles.fontFamily,
    fontWeight: answerStyles.fontWeight,
    textAlign: answerStyles.textAlign || 'left'
  };

  return (
    <>
      {responsiveCSS && <style dangerouslySetInnerHTML={{ __html: responsiveCSS }} />}
      <div 
        className={`element-${element.id} ${deviceType === 'tablet' && columnCount === 1 ? 'w-full' : 'max-w-2xl mx-auto'} space-y-4`} 
        style={containerStyles}
      >
        <h3 className="text-xl font-semibold mb-4">
          <InlineEditor
            value={title}
            onChange={(value) => handleUpdate('title', value)}
            placeholder="Frequently Asked Questions"
            disabled={!isEditing}
            className="text-xl font-semibold"
          />
        </h3>
        {faqs.map((faq: any, index: number) => (
          <Collapsible key={index}>
            <CollapsibleTrigger asChild>
              <Button 
                variant="ghost" 
                className="w-full justify-between p-4 border rounded-lg transition-colors duration-200"
                onMouseEnter={(e) => {
                  if (currentResponsiveStyles.questionHoverBackground) {
                    e.currentTarget.style.backgroundColor = currentResponsiveStyles.questionHoverBackground;
                  } else {
                    e.currentTarget.style.backgroundColor = 'hsl(var(--accent))';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '';
                }}
              >
                <div className="flex-1" style={questionInlineStyles}>
                  <InlineEditor
                    value={faq.question}
                    onChange={(value) => updateFAQ(index, 'question', value)}
                    placeholder="Enter question..."
                    disabled={!isEditing}
                    className="font-medium text-left"
                  />
                </div>
                <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 [&[data-state=open]>svg]:rotate-180" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="p-4 border-x border-b rounded-b-lg bg-muted/20">
              <div style={answerInlineStyles}>
                <InlineEditor
                  value={faq.answer}
                  onChange={(value) => updateFAQ(index, 'answer', value)}
                  placeholder="Enter answer..."
                  multiline
                  disabled={!isEditing}
                  className="text-muted-foreground"
                />
              </div>
            </CollapsibleContent>
          </Collapsible>
        ))}
      </div>
    </>
  );
};

// Accordion Element
const AccordionElement: React.FC<{
  element: PageBuilderElement;
  isEditing?: boolean;
  deviceType?: 'desktop' | 'tablet' | 'mobile';
  columnCount?: number;
  onUpdate?: (updates: Partial<PageBuilderElement>) => void;
}> = ({ element, isEditing, onUpdate, deviceType, columnCount = 1 }) => {
  const items = element.content.items || [
    { title: 'Section 1', content: 'Content for section 1' },
    { title: 'Section 2', content: 'Content for section 2' },
    { title: 'Section 3', content: 'Content for section 3' }
  ];
  const allowMultiple = element.content.allowMultiple || false;

  const handleUpdate = (property: string, value: any) => {
    if (onUpdate) {
      onUpdate({
        content: {
          ...element.content,
          [property]: value
        }
      });
    }
  };

  const updateItem = (index: number, field: 'title' | 'content', value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    handleUpdate('items', newItems);
  };

  // Generate responsive CSS for this element
  const responsiveCSS = generateResponsiveCSS(element.id, element.styles);
  
  // Get base styles using the utility function
  const containerStyles = renderElementStyles(element, deviceType);
  
  // Determine device key for responsive styles
  const deviceKey = deviceType === 'tablet' ? 'desktop' : deviceType;
  
  // Get title and description specific styles  
  const titleStyles = (element.styles as any)?.titleStyles?.responsive?.[deviceKey] || {};
  const descriptionStyles = (element.styles as any)?.descriptionStyles?.responsive?.[deviceKey] || {};
  
  // Create inline styles for title and description
  const titleInlineStyles = {
    fontSize: titleStyles.fontSize,
    lineHeight: titleStyles.lineHeight,
    color: titleStyles.color,
    fontFamily: titleStyles.fontFamily,
    fontWeight: titleStyles.fontWeight,
    textAlign: titleStyles.textAlign || 'left'
  };

  const descriptionInlineStyles = {
    fontSize: descriptionStyles.fontSize,
    lineHeight: descriptionStyles.lineHeight,
    color: descriptionStyles.color,
    fontFamily: descriptionStyles.fontFamily,
    fontWeight: descriptionStyles.fontWeight,
    textAlign: descriptionStyles.textAlign || 'left'
  };
  
  return (
    <>
      {responsiveCSS && <style dangerouslySetInnerHTML={{ __html: responsiveCSS }} />}
      <div 
        className={`element-${element.id} ${deviceType === 'tablet' && columnCount === 1 ? 'w-full' : 'max-w-2xl mx-auto'}`} 
        style={containerStyles}
      >
        <Accordion type={allowMultiple ? "multiple" : "single"} collapsible className="w-full">
          {items.map((item: any, index: number) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex-1" style={titleInlineStyles}>
                  <InlineEditor
                    value={item.title}
                    onChange={(value) => updateItem(index, 'title', value)}
                    placeholder="Section title..."
                    disabled={!isEditing}
                    className="font-medium"
                  />
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                <div className="pt-2" style={descriptionInlineStyles}>
                  <InlineEditor
                    value={item.content}
                    onChange={(value) => updateItem(index, 'content', value)}
                    placeholder="Section content..."
                    multiline
                    disabled={!isEditing}
                    className="text-muted-foreground"
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </>
  );
};

// Tabs Element
const TabsElement: React.FC<{
  element: PageBuilderElement;
  isEditing?: boolean;
  deviceType?: 'desktop' | 'tablet' | 'mobile';
  columnCount?: number;
  onUpdate?: (updates: Partial<PageBuilderElement>) => void;
}> = ({ element, isEditing, onUpdate, deviceType, columnCount = 1 }) => {
  const tabs = element.content.tabs || [
    { id: 'tab1', label: 'Tab 1', content: 'Content for tab 1' },
    { id: 'tab2', label: 'Tab 2', content: 'Content for tab 2' },
    { id: 'tab3', label: 'Tab 3', content: 'Content for tab 3' }
  ];
  const defaultTab = element.content.defaultTab || tabs[0]?.id;

  const handleUpdate = (property: string, value: any) => {
    if (onUpdate) {
      onUpdate({
        content: {
          ...element.content,
          [property]: value
        }
      });
    }
  };

  const updateTab = (index: number, field: 'label' | 'content', value: string) => {
    const newTabs = [...tabs];
    newTabs[index] = { ...newTabs[index], [field]: value };
    handleUpdate('tabs', newTabs);
  };

  const gridCols = tabs.length <= 2 ? 'grid-cols-2' : tabs.length === 3 ? 'grid-cols-3' : 'grid-cols-4';

  return (
    <div className={`${deviceType === 'tablet' && columnCount === 1 ? 'w-full' : 'max-w-2xl mx-auto'}`} style={element.styles}>
      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className={`grid w-full ${gridCols}`}>
          {tabs.map((tab: any, index: number) => (
            <TabsTrigger key={tab.id} value={tab.id} className="min-w-0">
              <InlineEditor
                value={tab.label}
                onChange={(value) => updateTab(index, 'label', value)}
                placeholder="Tab label"
                disabled={!isEditing}
                className="truncate"
              />
            </TabsTrigger>
          ))}
        </TabsList>
        {tabs.map((tab: any, index: number) => (
          <TabsContent key={tab.id} value={tab.id} className="mt-6">
            <div className="p-4 border rounded-lg bg-background">
              <InlineEditor
                value={tab.content}
                onChange={(value) => updateTab(index, 'content', value)}
                placeholder="Tab content..."
                multiline
                disabled={!isEditing}
              />
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