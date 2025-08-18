import React from 'react';
import { Image, Upload } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CompactMediaSelector } from '@/components/page-builder/components/CompactMediaSelector';

interface SEOSocialImageSectionProps {
  socialImageUrl: string;
  onChange: (url: string) => void;
}

export const SEOSocialImageSection: React.FC<SEOSocialImageSectionProps> = ({
  socialImageUrl,
  onChange
}) => {
  return (
    <Collapsible>
      <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-left hover:bg-muted/50 rounded px-2 transition-colors">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Social Image</span>
        </div>
      </CollapsibleTrigger>
      
      <CollapsibleContent>
        <div className="px-2 pb-4 pt-2 space-y-3">
          <div>
            <Label>Social Image</Label>
            <p className="text-xs text-muted-foreground mb-2">
              Image displayed when shared on social media (Open Graph & Twitter cards)
            </p>
            
            <CompactMediaSelector
              value={socialImageUrl}
              onChange={(url) => onChange(url)}
              label="Select Social Image"
            />
            
            {socialImageUrl && (
              <div className="mt-3">
                <Label className="text-xs">Preview</Label>
                <div className="mt-1 p-3 border rounded-lg bg-muted/20">
                  <div className="flex items-start gap-3">
                    <img 
                      src={socialImageUrl} 
                      alt="Social preview" 
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-primary">Page Title</h4>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                        This is how your page will appear when shared on social media platforms.
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">ecombuildr.com</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="text-xs text-muted-foreground space-y-1">
            <p><strong>Recommended size:</strong> 1200 x 630 pixels</p>
            <p><strong>Max file size:</strong> 8MB</p>
            <p><strong>Format:</strong> JPG, PNG</p>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};