import React from 'react';
import { icons as lucideIcons } from 'lucide-react';
import * as HeroIconsSolid from '@heroicons/react/24/solid';

// Generic icon component type that works with both libraries
export type IconComponent = React.ComponentType<React.SVGProps<SVGSVGElement>>;

export interface IconOption {
  name: string;
  label: string;
  icon: IconComponent;
  set: 'luc' | 'hi';
}

// Convert PascalCase to kebab-case
const toKebabCase = (str: string) => {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
};

// Convert kebab-case to PascalCase  
const toPascalCase = (str: string) => {
  return str.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('');
};

// Generate Lucide icon options
export const ICON_OPTIONS_REGULAR: IconOption[] = Object.keys(lucideIcons)
  .filter(name => name !== 'createLucideIcon' && name !== 'Icon')
  .map(name => {
    const kebabName = toKebabCase(name);
    return {
      name: `luc:${kebabName}`,
      label: name.replace(/([A-Z])/g, ' $1').trim(),
      icon: lucideIcons[name as keyof typeof lucideIcons] as IconComponent,
      set: 'luc' as const
    };
  })
  .sort((a, b) => a.label.localeCompare(b.label));

// Generate Heroicons Solid options
export const ICON_OPTIONS_SOLID: IconOption[] = Object.keys(HeroIconsSolid)
  .map(name => {
    const kebabName = toKebabCase(name);
    return {
      name: `hi:${kebabName}`,
      label: name.replace(/([A-Z])/g, ' $1').trim(),
      icon: HeroIconsSolid[name as keyof typeof HeroIconsSolid] as IconComponent,
      set: 'hi' as const
    };
  })
  .sort((a, b) => a.label.localeCompare(b.label));

// Add custom WhatsApp icon using MessageCircle from Lucide
const whatsappIcon: IconOption = {
  name: 'luc:whatsapp',
  label: 'WhatsApp',
  icon: lucideIcons.MessageCircle as IconComponent,
  set: 'luc' as const
};

// Insert WhatsApp icon into regular icons in proper alphabetical order
const whatsappIndex = ICON_OPTIONS_REGULAR.findIndex(icon => icon.label > 'WhatsApp');
if (whatsappIndex !== -1) {
  ICON_OPTIONS_REGULAR.splice(whatsappIndex, 0, whatsappIcon);
} else {
  ICON_OPTIONS_REGULAR.push(whatsappIcon);
}

// Combined icons map for resolution
const ICONS_MAP: Record<string, IconComponent> = {};

// Add Lucide icons with luc: prefix
ICON_OPTIONS_REGULAR.forEach(option => {
  ICONS_MAP[option.name] = option.icon;
});

// Add Heroicons with hi: prefix
ICON_OPTIONS_SOLID.forEach(option => {
  ICONS_MAP[option.name] = option.icon;
});

// Backward compatibility - add unprefixed Lucide icons
Object.keys(lucideIcons).forEach(name => {
  if (name !== 'createLucideIcon' && name !== 'Icon') {
    const kebabName = toKebabCase(name);
    const lucideIcon = lucideIcons[name as keyof typeof lucideIcons] as IconComponent;
    ICONS_MAP[kebabName] = lucideIcon;
    ICONS_MAP[name] = lucideIcon; // Also support PascalCase for backward compatibility
  }
});

/**
 * Get icon component by name with automatic luc: prefix for backward compatibility
 */
export const getIconByName = (name: string): IconComponent | null => {
  if (!name) return null;
  
  // Try exact match first
  if (ICONS_MAP[name]) {
    return ICONS_MAP[name];
  }
  
  // Try with luc: prefix for backward compatibility
  const withLucPrefix = `luc:${name}`;
  if (ICONS_MAP[withLucPrefix]) {
    return ICONS_MAP[withLucPrefix];
  }
  
  return null;
};

// Export all icon options combined for search
export const ALL_ICON_OPTIONS = [...ICON_OPTIONS_REGULAR, ...ICON_OPTIONS_SOLID];