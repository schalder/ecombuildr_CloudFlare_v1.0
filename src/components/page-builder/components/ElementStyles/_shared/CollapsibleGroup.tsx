import React from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';

interface CollapsibleGroupProps {
  title: string;
  isOpen: boolean;
  onToggle: (isOpen: boolean) => void;
  children: React.ReactNode;
}

export const CollapsibleGroup: React.FC<CollapsibleGroupProps> = ({
  title,
  isOpen,
  onToggle,
  children
}) => {
  return (
    <Collapsible open={isOpen} onOpenChange={onToggle} className="w-full min-w-0">
      <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted/50 rounded min-w-0">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate min-w-0 flex-1">{title}</h4>
        <ChevronDown className={`h-4 w-4 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3 pt-2 min-w-0 w-full">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
};