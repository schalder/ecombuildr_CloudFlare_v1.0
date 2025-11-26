export type TemplateType =
  | 'website_page'
  | 'funnel_step'
  | 'home_page'
  | 'about_page'
  | 'legal_page'
  | 'checkout_page'
  | 'upsell_page'
  | 'downsell_page'
  | 'thank_you_page';

interface TemplateTypeOption {
  value: TemplateType;
  label: string;
  group: 'context' | 'use-case';
  description?: string;
}

export const TEMPLATE_TYPE_OPTIONS: TemplateTypeOption[] = [
  {
    value: 'website_page',
    label: 'Website Page',
    group: 'context',
    description: 'Available while building standard website pages',
  },
  {
    value: 'funnel_step',
    label: 'Funnel Step',
    group: 'context',
    description: 'Available for funnel steps and sequences',
  },
  {
    value: 'home_page',
    label: 'Home Page',
    group: 'use-case',
  },
  {
    value: 'about_page',
    label: 'About Page',
    group: 'use-case',
  },
  {
    value: 'legal_page',
    label: 'Legal Page',
    group: 'use-case',
  },
  {
    value: 'checkout_page',
    label: 'Checkout Page',
    group: 'use-case',
  },
  {
    value: 'upsell_page',
    label: 'Upsell Page',
    group: 'use-case',
  },
  {
    value: 'downsell_page',
    label: 'Downsell Page',
    group: 'use-case',
  },
  {
    value: 'thank_you_page',
    label: 'Thank You Page',
    group: 'use-case',
  },
];

export const TEMPLATE_TYPE_LABELS: Record<TemplateType, string> = TEMPLATE_TYPE_OPTIONS.reduce(
  (acc, option) => {
    acc[option.value] = option.label;
    return acc;
  },
  {} as Record<TemplateType, string>
);

export const TEMPLATE_TYPE_VALUES = TEMPLATE_TYPE_OPTIONS.map((option) => option.value);

export const CONTEXT_TEMPLATE_TYPES = TEMPLATE_TYPE_OPTIONS.filter(
  (option) => option.group === 'context'
).map((option) => option.value);

export const USE_CASE_TEMPLATE_TYPES = TEMPLATE_TYPE_OPTIONS.filter(
  (option) => option.group === 'use-case'
).map((option) => option.value);

export const humanizeTemplateType = (type: TemplateType): string =>
  TEMPLATE_TYPE_LABELS[type] ?? type.replace(/_/g, ' ');

