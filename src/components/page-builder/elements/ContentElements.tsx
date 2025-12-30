import React, { useState } from 'react';
import { Quote, MessageSquare, ChevronDown, Star, Image } from 'lucide-react';
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
import { StorefrontImage } from '@/components/storefront/renderer/StorefrontImage';


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

  // Generate responsive CSS and get inline styles
  const responsiveCSS = generateResponsiveCSS(element.id, element.styles);
  const inlineStyles = renderElementStyles(element, deviceType || 'desktop');
  
  // Get responsive styles for current device
  const responsiveStyles = element.styles?.responsive || { desktop: {}, mobile: {} };
  const currentDevice = deviceType || 'desktop';
  const currentResponsiveStyles = (responsiveStyles as any)[currentDevice] || {};
  
  // Style helpers for different parts
  const getTestimonialStyles = () => {
    return {
      fontFamily: (currentResponsiveStyles as any).testimonialFontFamily || (element.styles as any)?.testimonialFontFamily,
      fontSize: (currentResponsiveStyles as any).testimonialFontSize || (element.styles as any)?.testimonialFontSize || '18px',
      textAlign: (currentResponsiveStyles as any).testimonialTextAlign || (element.styles as any)?.testimonialTextAlign,
      lineHeight: (currentResponsiveStyles as any).testimonialLineHeight || (element.styles as any)?.testimonialLineHeight || '1.6',
      color: (currentResponsiveStyles as any).testimonialColor || (element.styles as any)?.testimonialColor,
    };
  };

  const getAuthorStyles = () => {
    return {
      fontFamily: (currentResponsiveStyles as any).authorFontFamily || (element.styles as any)?.authorFontFamily,
      fontSize: (currentResponsiveStyles as any).authorFontSize || (element.styles as any)?.authorFontSize || '16px',
      textAlign: (currentResponsiveStyles as any).authorTextAlign || (element.styles as any)?.authorTextAlign,
      lineHeight: (currentResponsiveStyles as any).authorLineHeight || (element.styles as any)?.authorLineHeight || '1.5',
      color: (currentResponsiveStyles as any).authorColor || (element.styles as any)?.authorColor,
    };
  };

  const getPositionStyles = () => {
    return {
      fontFamily: (currentResponsiveStyles as any).positionFontFamily || (element.styles as any)?.positionFontFamily,
      fontSize: (currentResponsiveStyles as any).positionFontSize || (element.styles as any)?.positionFontSize || '14px',
      textAlign: (currentResponsiveStyles as any).positionTextAlign || (element.styles as any)?.positionTextAlign,
      lineHeight: (currentResponsiveStyles as any).positionLineHeight || (element.styles as any)?.positionLineHeight || '1.4',
      color: (currentResponsiveStyles as any).positionColor || (element.styles as any)?.positionColor,
    };
  };

  return (
    <>
      {responsiveCSS && <style dangerouslySetInnerHTML={{ __html: responsiveCSS }} />}
      <div 
        className={`${deviceType === 'tablet' && columnCount === 1 ? 'w-full' : 'max-w-md mx-auto'} p-6 border rounded-lg bg-background`} 
        style={inlineStyles}
      >
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
        
        <blockquote className="mb-4" style={getTestimonialStyles()}>
          <InlineEditor
            value={testimonial}
            onChange={(value) => handleUpdate('testimonial', value)}
            placeholder="Enter testimonial text..."
            multiline
            disabled={!isEditing}
            className="italic"
          />
        </blockquote>
        
        <div className="flex items-center space-x-3">
          <Avatar>
            <AvatarImage src={avatar} />
            <AvatarFallback>{author.split(' ').map(n => n[0]).join('')}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div style={getAuthorStyles()}>
              <InlineEditor
                value={author}
                onChange={(value) => handleUpdate('author', value)}
                placeholder="Author name"
                disabled={!isEditing}
                className="font-semibold"
              />
            </div>
            <div style={getPositionStyles()}>
              <InlineEditor
                value={position}
                onChange={(value) => handleUpdate('position', value)}
                placeholder="Position, Company"
                disabled={!isEditing}
                className="text-muted-foreground"
              />
            </div>
          </div>
        </div>
      </div>
    </>
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
  
  // Get FAQ gap from responsive styles
  const faqGap = currentResponsiveStyles.faqGap || '16px';
  
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
        className={`element-${element.id} w-full ${deviceType === 'mobile' ? 'px-2' : deviceType === 'tablet' && columnCount === 1 ? 'w-full' : 'max-w-2xl mx-auto'} overflow-hidden`} 
        style={{
          ...containerStyles,
          gap: faqGap,
          display: 'flex',
          flexDirection: 'column',
          maxWidth: '100%'
        }}
      >
        <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 px-1 break-words">
          <InlineEditor
            value={title}
            onChange={(value) => handleUpdate('title', value)}
            placeholder="Frequently Asked Questions"
            disabled={!isEditing}
            className="text-lg sm:text-xl font-semibold break-words"
          />
        </h3>
        {faqs.map((faq: any, index: number) => (
          <Collapsible key={index} className="w-full min-w-0">
            <CollapsibleTrigger asChild>
              <Button 
                variant="ghost" 
                className="w-full justify-between items-start h-auto min-h-[3rem] py-3 px-3 sm:py-4 sm:px-4 border rounded-lg transition-colors duration-200 overflow-hidden"
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
                <div className="flex-1 min-w-0 pr-2 overflow-hidden" style={questionInlineStyles}>
                  <InlineEditor
                    value={faq.question}
                    onChange={(value) => updateFAQ(index, 'question', value)}
                    placeholder="Enter question..."
                    disabled={!isEditing}
                    className="font-medium text-left break-words whitespace-normal overflow-wrap-anywhere leading-relaxed"
                  />
                </div>
                <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 [&[data-state=open]>svg]:rotate-180 ml-2 flex-shrink-0 mt-0.5" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="py-3 px-3 sm:py-4 sm:px-4 border-x border-b rounded-b-lg bg-muted/20 overflow-hidden">
              <div style={answerInlineStyles} className="break-words whitespace-normal overflow-wrap-anywhere max-w-full leading-relaxed">
                <InlineEditor
                  value={faq.answer}
                  onChange={(value) => updateFAQ(index, 'answer', value)}
                  placeholder="Enter answer..."
                  multiline
                  disabled={!isEditing}
                  className="text-muted-foreground break-words whitespace-normal overflow-wrap-anywhere leading-relaxed"
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
                <div className="pt-2">
                  <InlineEditor
                    value={item.content}
                    onChange={(value) => updateItem(index, 'content', value)}
                    placeholder="Section content..."
                    multiline
                    disabled={!isEditing}
                    style={descriptionInlineStyles}
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

  // Generate responsive CSS for this element
  const responsiveCSS = generateResponsiveCSS(element.id, element.styles);
  
  // Get base styles using the utility function
  const containerStyles = renderElementStyles(element, deviceType);
  
  // Determine device key for responsive styles
  const deviceKey = deviceType === 'tablet' ? 'desktop' : deviceType;
  
  // Get tab-specific styles
  const tabLabelStyles = (element.styles as any)?.tabLabelStyles?.responsive?.[deviceKey] || {};
  const tabContentStyles = (element.styles as any)?.tabContentStyles?.responsive?.[deviceKey] || {};
  const tabListStyles = (element.styles as any)?.tabListStyles?.responsive?.[deviceKey] || {};
  
  // Create inline styles
  const tabLabelInlineStyles = {
    fontSize: tabLabelStyles.fontSize,
    lineHeight: tabLabelStyles.lineHeight,
    color: tabLabelStyles.color,
    fontFamily: tabLabelStyles.fontFamily,
    fontWeight: tabLabelStyles.fontWeight,
    textAlign: tabLabelStyles.textAlign || 'center'
  };

  const tabContentInlineStyles = {
    fontSize: tabContentStyles.fontSize,
    lineHeight: tabContentStyles.lineHeight,
    color: tabContentStyles.color,
    fontFamily: tabContentStyles.fontFamily,
    fontWeight: tabContentStyles.fontWeight,
    textAlign: tabContentStyles.textAlign || 'left'
  };

  const tabListInlineStyles = {
    backgroundColor: tabListStyles.backgroundColor,
    borderColor: tabListStyles.borderColor,
    borderWidth: tabListStyles.borderWidth,
    borderRadius: tabListStyles.borderRadius,
    padding: tabListStyles.padding
  };

  return (
    <>
      {responsiveCSS && <style dangerouslySetInnerHTML={{ __html: responsiveCSS }} />}
      <div 
        className={`element-${element.id} w-full`} 
        style={containerStyles}
      >
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList 
            className="flex w-full flex-wrap gap-1" 
            style={tabListInlineStyles}
          >
            {tabs.map((tab: any, index: number) => (
              <TabsTrigger 
                key={tab.id} 
                value={tab.id} 
                className="flex-1 min-w-0"
                style={tabLabelInlineStyles}
              >
                <InlineEditor
                  value={tab.label}
                  onChange={(value) => updateTab(index, 'label', value)}
                  placeholder="Tab label"
                  disabled={!isEditing}
                  className="truncate"
                  style={tabLabelInlineStyles}
                />
              </TabsTrigger>
            ))}
          </TabsList>
          {tabs.map((tab: any, index: number) => (
            <TabsContent key={tab.id} value={tab.id} className="mt-6">
              <div className="p-4 border rounded-lg bg-background" style={tabContentInlineStyles}>
                <InlineEditor
                  value={tab.content}
                  onChange={(value) => updateTab(index, 'content', value)}
                  placeholder="Tab content..."
                  multiline
                  disabled={!isEditing}
                  style={tabContentInlineStyles}
                />
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </>
  );
};

// Image Feature Element
const ImageFeatureElement: React.FC<{
  element: PageBuilderElement;
  isEditing?: boolean;
  deviceType?: 'desktop' | 'tablet' | 'mobile';
  columnCount?: number;
  onUpdate?: (updates: Partial<PageBuilderElement>) => void;
}> = ({ element, isEditing, onUpdate, deviceType, columnCount = 1 }) => {
  const headline = element.content.headline || 'Feature Headline';
  const description = element.content.description || 'Feature description goes here...';
  const imageUrl = element.content.imageUrl || '';
  const altText = element.content.altText || 'Feature image';
  const imagePosition = element.content.imagePosition || 'left';
  const imageWidth = element.content.imageWidth || 25;

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

  // Generate responsive CSS without margins/padding and get inline styles
  const omitSpacing = (obj?: any) => {
    if (!obj) return {};
    const { margin, marginTop, marginRight, marginBottom, marginLeft, padding, paddingTop, paddingRight, paddingBottom, paddingLeft, ...rest } = obj;
    return rest;
  };
  const responsiveCSS = generateResponsiveCSS(element.id, {
    ...element.styles,
    responsive: {
      desktop: omitSpacing(element.styles?.responsive?.desktop),
      tablet: omitSpacing(element.styles?.responsive?.tablet),
      mobile: omitSpacing(element.styles?.responsive?.mobile),
    },
  });
  const inlineStyles = renderElementStyles(element, deviceType || 'desktop');
  const { padding, paddingTop, paddingRight, paddingBottom, paddingLeft, ...stylesNoPadding } = (inlineStyles as any);
  
  // Extract padding values for application to container
  const paddingStyles: React.CSSProperties = {};
  if (paddingTop) paddingStyles.paddingTop = paddingTop;
  if (paddingRight) paddingStyles.paddingRight = paddingRight;
  if (paddingBottom) paddingStyles.paddingBottom = paddingBottom;
  if (paddingLeft) paddingStyles.paddingLeft = paddingLeft;
  
  // Get responsive styles for current device
  const responsiveStyles = element.styles?.responsive || { desktop: {}, mobile: {} };
  const currentDevice = deviceType || 'desktop';
  const currentResponsiveStyles = (responsiveStyles as any)[currentDevice] || {};
  
  // Helper function for responsive style resolution
  const getResponsiveStyleValue = (property: string, fallback: any = '') => {
    const responsiveStyles = element.styles?.responsive || { desktop: {}, mobile: {} };
    const currentDevice = deviceType || 'desktop';
    const currentResponsiveStyles = (responsiveStyles as any)[currentDevice] || {};
    
    // Current device value
    const currentValue = currentResponsiveStyles[property];
    if (currentValue !== undefined && currentValue !== null && currentValue !== '') {
      return currentValue;
    }
    
    // Inheritance: mobile -> tablet -> desktop
    if (currentDevice === 'mobile') {
      const tabletValue = (responsiveStyles as any).tablet?.[property];
      if (tabletValue !== undefined && tabletValue !== null && tabletValue !== '') {
        return tabletValue;
      }
    }
    
    if (currentDevice === 'mobile' || currentDevice === 'tablet') {
      const desktopValue = (responsiveStyles as any).desktop?.[property];
      if (desktopValue !== undefined && desktopValue !== null && desktopValue !== '') {
        return desktopValue;
      }
    }
    
    // Final fallback to base styles or provided fallback
    return (element.styles as any)?.[property] || fallback;
  };

  // Style helpers for different parts using responsive helpers
  const getHeadlineStyles = () => {
    return {
      fontFamily: getResponsiveStyleValue('headlineFontFamily', ''),
      fontSize: getResponsiveStyleValue('headlineFontSize', '24px'),
      textAlign: getResponsiveStyleValue('headlineTextAlign', 'left'),
      lineHeight: getResponsiveStyleValue('headlineLineHeight', '1.4'),
      color: getResponsiveStyleValue('headlineColor', ''),
    };
  };

  const getDescriptionStyles = () => {
    return {
      fontFamily: getResponsiveStyleValue('descriptionFontFamily', ''),
      fontSize: getResponsiveStyleValue('descriptionFontSize', '16px'),
      textAlign: getResponsiveStyleValue('descriptionTextAlign', 'left'),
      lineHeight: getResponsiveStyleValue('descriptionLineHeight', '1.6'),
      color: getResponsiveStyleValue('descriptionColor', ''),
    };
  };

  // Get responsive image position (moved from content to styles, with backward compatibility)
  const responsiveImagePosition = getResponsiveStyleValue('imagePosition', imagePosition);
  
  // Determine layout based on device and image position
  const isMobile = deviceType === 'mobile';
  // If position is 'top', always use flex-col (stacked layout)
  // On mobile, always use flex-col regardless of position
  // Otherwise, use flex-row or flex-row-reverse based on position
  let flexDirection: string;
  if (responsiveImagePosition === 'top' || isMobile) {
    flexDirection = 'flex-col';
  } else if (responsiveImagePosition === 'right') {
    flexDirection = 'flex-row-reverse';
  } else {
    flexDirection = 'flex-row';
  }
  
  const textAlign = (currentResponsiveStyles as any).textAlign || (element.styles as any)?.textAlign || 'left';
  
  // Get responsive image max-height
  const imageMaxHeight = getResponsiveStyleValue('imageMaxHeight', '400px');
  
  // Use object-contain when max-height is set to resize image instead of cropping
  // object-contain will resize the image to fit within max-height while maintaining aspect ratio
  // object-cover would crop the image to fill the space
  const imageObjectFit = imageMaxHeight ? 'object-contain' : 'object-cover';

  return (
    <>
      {responsiveCSS && <style dangerouslySetInnerHTML={{ __html: responsiveCSS }} />}
      <div 
        className={`element-${element.id} flex ${flexDirection} ${isMobile ? 'gap-3' : 'gap-6'} items-center ${deviceType === 'tablet' && columnCount === 1 ? 'w-full' : 'max-w-4xl mx-auto'}`} 
        style={{
          ...stylesNoPadding,
          ...paddingStyles,
          textAlign: textAlign as any
        }}
      >
        {/* Image */}
        <div 
          className={`${isMobile || responsiveImagePosition === 'top' ? 'w-full flex justify-center' : 'flex-shrink-0'}`}
          style={{
            width: isMobile || responsiveImagePosition === 'top' ? '100%' : `${imageWidth}%`
          }}
        >
          {imageUrl ? (
            isEditing ? (
              <img
                src={imageUrl}
                alt={altText}
                className={`${isMobile ? 'max-w-full mx-auto block' : 'w-full'} h-auto rounded-lg ${imageObjectFit} select-none`}
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
                style={{
                  maxHeight: imageMaxHeight
                }}
              />
            ) : (
              <StorefrontImage
                src={imageUrl}
                alt={altText}
                className={`${isMobile ? 'max-w-full mx-auto block' : 'w-full'} h-auto rounded-lg ${imageObjectFit}`}
                style={{
                  maxHeight: imageMaxHeight
                }}
                priority={false}
                preserveOriginal={true}
              />
            )
          ) : (
            <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center pointer-events-none">
              <span className="text-muted-foreground text-sm">No image selected</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className={`${isMobile ? 'w-full' : 'flex-1'} space-y-1`}>
          <h3 style={getHeadlineStyles()}>
            <InlineEditor
              value={headline}
              onChange={(value) => handleUpdate('headline', value)}
              placeholder="Feature headline..."
              disabled={!isEditing}
              className="font-semibold"
            />
          </h3>
          
          <div>
            <InlineEditor
              value={description}
              onChange={(value) => handleUpdate('description', value)}
              placeholder="Feature description..."
              multiline
              disabled={!isEditing}
              style={getDescriptionStyles()}
            />
          </div>
        </div>
      </div>
    </>
  );
};

// Register Content Elements
export const registerContentElements = () => {
  elementRegistry.register({
    id: 'image-feature',
    name: 'Image Feature',
    category: 'basic',
    icon: Image,
    component: ImageFeatureElement,
    defaultContent: {
      headline: 'Amazing Feature',
      description: 'This feature will help you achieve your goals faster and more efficiently.',
      imageUrl: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=500&h=300&fit=crop',
      altText: 'Feature image',
      imagePosition: 'left',
      imageWidth: 25
    },
    description: 'Feature card with image and text'
  });

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