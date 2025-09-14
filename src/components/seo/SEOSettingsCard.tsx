import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SEOKeywordsInput } from './SEOKeywordsInput';
import { CompactMediaSelector } from '@/components/page-builder/components/CompactMediaSelector';

interface SEOData {
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string[];
  og_image?: string;
  meta_robots?: string;
  canonical_url?: string;
  language_code?: string;
}

interface SEOSettingsCardProps {
  data: SEOData;
  onChange: (data: SEOData) => void;
  pageUrl?: string;
}

export const SEOSettingsCard: React.FC<SEOSettingsCardProps> = ({
  data,
  onChange,
  pageUrl
}) => {
  const handleFieldChange = (field: keyof SEOData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>SEO Settings</CardTitle>
        <CardDescription>
          Configure search engine optimization for this page
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="seo-title">SEO Title</Label>
          <Input
            id="seo-title"
            value={data.seo_title || ''}
            onChange={(e) => handleFieldChange('seo_title', e.target.value)}
            placeholder="Page title for search engines"
            maxLength={60}
          />
          <p className="text-sm text-muted-foreground">
            {(data.seo_title || '').length}/60 characters
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="seo-description">Meta Description</Label>
          <Textarea
            id="seo-description"
            value={data.seo_description || ''}
            onChange={(e) => handleFieldChange('seo_description', e.target.value)}
            placeholder="Brief description for search results"
            maxLength={160}
            rows={3}
          />
          <p className="text-sm text-muted-foreground">
            {(data.seo_description || '').length}/160 characters
          </p>
        </div>

        <div className="space-y-2">
          <Label>Keywords</Label>
          <SEOKeywordsInput
            keywords={data.seo_keywords || []}
            onChange={(keywords) => handleFieldChange('seo_keywords', keywords)}
          />
        </div>

        <div className="space-y-2">
          <Label>Open Graph Image</Label>
          <CompactMediaSelector
            value={data.og_image}
            onChange={(url) => handleFieldChange('og_image', url)}
            label="Select Open Graph Image"
          />
          {data.og_image && (
            <div className="mt-2">
              <img 
                src={data.og_image} 
                alt="Open Graph preview" 
                className="w-full max-w-sm rounded-md border"
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="meta-robots">Meta Robots</Label>
            <Select
              value={data.meta_robots || 'index,follow'}
              onValueChange={(value) => handleFieldChange('meta_robots', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="index,follow">Index, Follow</SelectItem>
                <SelectItem value="index,nofollow">Index, No Follow</SelectItem>
                <SelectItem value="noindex,follow">No Index, Follow</SelectItem>
                <SelectItem value="noindex,nofollow">No Index, No Follow</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="language-code">Language</Label>
            <Select
              value={data.language_code || 'en'}
              onValueChange={(value) => handleFieldChange('language_code', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
                <SelectItem value="fr">French</SelectItem>
                <SelectItem value="de">German</SelectItem>
                <SelectItem value="it">Italian</SelectItem>
                <SelectItem value="pt">Portuguese</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="canonical-url">Canonical URL (Optional)</Label>
          <Input
            id="canonical-url"
            value={data.canonical_url || ''}
            onChange={(e) => handleFieldChange('canonical_url', e.target.value)}
            placeholder={pageUrl || 'https://example.com/page'}
          />
          <p className="text-sm text-muted-foreground">
            Leave empty to use the page's default URL
          </p>
        </div>
      </CardContent>
    </Card>
  );
};