import React from 'react';
import { NavigationItem } from './CourseNavigationBuilder';

interface Props {
  items: NavigationItem[];
}

export const CourseNavigationMenu: React.FC<Props> = ({ items }) => {
  if (!items || items.length === 0) return null;

  const handleLinkClick = (item: NavigationItem) => {
    if (item.url) {
      if (item.new_tab) {
        window.open(item.url, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = item.url;
      }
    }
  };

  return (
    <div className="flex items-center gap-4">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => handleLinkClick(item)}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {item.label}
        </button>
      ))}
    </div>
  );
};