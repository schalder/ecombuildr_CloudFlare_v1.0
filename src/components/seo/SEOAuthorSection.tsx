import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface SEOAuthorSectionProps {
  author: string;
  onChange: (author: string) => void;
}

export const SEOAuthorSection: React.FC<SEOAuthorSectionProps> = ({
  author,
  onChange
}) => {
  const hasIssues = !author.trim();

  return (
    <Collapsible defaultOpen={hasIssues}>
      <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-left hover:bg-muted/50 rounded px-2 transition-colors">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Author</span>
          {hasIssues && (
            <div className="flex items-center text-amber-600">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full ml-1">1</span>
            </div>
          )}
        </div>
      </CollapsibleTrigger>
      
      <CollapsibleContent>
        <div className="px-2 pb-4 pt-2 space-y-3">
          <div>
            <Label htmlFor="meta_author">Author</Label>
            <Input
              id="meta_author"
              value={author}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Enter author name"
              className="mt-1"
            />
          </div>
          
          {hasIssues && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-md">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-amber-800">
                <p className="font-medium">Page has author name</p>
                <p>Add an author name to improve content credibility and SEO.</p>
              </div>
            </div>
          )}
          
          <p className="text-xs text-muted-foreground">
            The author name helps establish content credibility and can improve search rankings.
          </p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};