import React, { useState } from 'react';
import { AlertTriangle, Plus, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface MetaTag {
  name: string;
  content: string;
}

interface SEOAdvancedSectionProps {
  canonicalUrl: string;
  metaRobots: string;
  customMetaTags: MetaTag[];
  onCanonicalChange: (url: string) => void;
  onMetaRobotsChange: (robots: string) => void;
  onCustomMetaTagsChange: (tags: MetaTag[]) => void;
}

export const SEOAdvancedSection: React.FC<SEOAdvancedSectionProps> = ({
  canonicalUrl,
  metaRobots,
  customMetaTags,
  onCanonicalChange,
  onMetaRobotsChange,
  onCustomMetaTagsChange
}) => {
  const [newTagName, setNewTagName] = useState('');
  const [newTagContent, setNewTagContent] = useState('');
  
  const hasIssues = !canonicalUrl.trim();
  const issueCount = hasIssues ? 1 : 0;

  const addCustomTag = () => {
    if (newTagName.trim() && newTagContent.trim()) {
      const newTag = { name: newTagName.trim(), content: newTagContent.trim() };
      const exists = customMetaTags.some(tag => tag.name === newTag.name);
      
      if (!exists) {
        onCustomMetaTagsChange([...customMetaTags, newTag]);
        setNewTagName('');
        setNewTagContent('');
      }
    }
  };

  const removeCustomTag = (index: number) => {
    onCustomMetaTagsChange(customMetaTags.filter((_, i) => i !== index));
  };

  return (
    <Collapsible>
      <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-left hover:bg-muted/50 rounded px-2 transition-colors">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Links & Tags</span>
          {issueCount > 0 && (
            <div className="flex items-center text-amber-600">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full ml-1">{issueCount}</span>
            </div>
          )}
        </div>
      </CollapsibleTrigger>
      
      <CollapsibleContent>
        <div className="px-2 pb-4 pt-2 space-y-4">
          {/* Canonical URL */}
          <div>
            <Label htmlFor="canonical_url">Canonical URL</Label>
            <Input
              id="canonical_url"
              value={canonicalUrl}
              onChange={(e) => onCanonicalChange(e.target.value)}
              placeholder="https://example.com/page-url"
              className="mt-1"
            />
            {hasIssues && (
              <div className="flex items-start gap-2 p-2 bg-amber-50 rounded-md mt-2">
                <AlertTriangle className="h-3 w-3 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-800">Add a canonical URL to prevent duplicate content issues</p>
              </div>
            )}
          </div>

          {/* Meta Robots */}
          <div>
            <Label htmlFor="meta_robots">Meta Robots</Label>
            <Select value={metaRobots} onValueChange={onMetaRobotsChange}>
              <SelectTrigger className="mt-1 bg-background">
                <SelectValue placeholder="Select robots directive" />
              </SelectTrigger>
              <SelectContent className="bg-background border shadow-lg z-50">
                <SelectItem value="index,follow">Index, Follow (Default)</SelectItem>
                <SelectItem value="noindex,nofollow">No Index, No Follow</SelectItem>
                <SelectItem value="index,nofollow">Index, No Follow</SelectItem>
                <SelectItem value="noindex,follow">No Index, Follow</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Controls how search engines crawl and index this page
            </p>
          </div>

          {/* Custom Meta Tags */}
          <div>
            <Label>Custom Meta Tags</Label>
            
            {/* Existing Tags */}
            {customMetaTags.length > 0 && (
              <div className="mt-2 space-y-2">
                {customMetaTags.map((tag, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-muted/20 rounded">
                    <div className="flex-1 text-xs">
                      <span className="font-medium">{tag.name}:</span> {tag.content}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCustomTag(index)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Add New Tag */}
            <div className="mt-3 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Name (e.g., viewport)"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  className="text-xs"
                />
                <Input
                  placeholder="Content"
                  value={newTagContent}
                  onChange={(e) => setNewTagContent(e.target.value)}
                  className="text-xs"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addCustomTag}
                disabled={!newTagName.trim() || !newTagContent.trim()}
                className="w-full"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Meta Tag
              </Button>
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            <p><strong>Canonical URL:</strong> Prevents duplicate content issues</p>
            <p><strong>Meta Robots:</strong> Controls search engine behavior</p>
            <p><strong>Custom Tags:</strong> Add specialized meta tags as needed</p>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
