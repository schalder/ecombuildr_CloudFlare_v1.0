import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, TestTube, Copy, CheckCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface SEOTestToolsProps {
  currentUrl?: string;
  customDomain?: string;
}

export function SEOTestTools({ currentUrl, customDomain }: SEOTestToolsProps) {
  const [testUrl, setTestUrl] = useState(currentUrl || '');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied to clipboard',
      description: 'URL copied successfully',
    });
  };

  const testUrls = [
    {
      name: 'Facebook Debugger',
      url: `https://developers.facebook.com/tools/debug/?q=${encodeURIComponent(testUrl)}`,
      description: 'Test Open Graph tags for Facebook'
    },
    {
      name: 'Twitter Card Validator',
      url: `https://cards-dev.twitter.com/validator`,
      description: 'Validate Twitter Cards (paste URL manually)'
    },
    {
      name: 'LinkedIn Post Inspector',
      url: `https://www.linkedin.com/post-inspector/inspect/${encodeURIComponent(testUrl)}`,
      description: 'Test LinkedIn preview'
    },
    {
      name: 'WhatsApp Preview',
      url: `https://www.whatsapp.com/`,
      description: 'Test by sending URL in WhatsApp'
    }
  ];

  const botTestUrl = testUrl ? `${testUrl.split('?')[0]}/__bot${new URL(testUrl).pathname}` : '';

  const handleGenerateSnapshot = async () => {
    if (!testUrl) return;
    
    setIsLoading(true);
    try {
      // Call the Edge Function to force HTML generation
      const response = await fetch(`${testUrl.split('?')[0]}/__bot${new URL(testUrl).pathname}`, {
        headers: {
          'User-Agent': 'facebookexternalhit/1.1'
        }
      });
      
      if (response.ok) {
        toast({
          title: 'Snapshot Generated',
          description: 'HTML snapshot has been generated successfully',
        });
      } else {
        throw new Error('Failed to generate snapshot');
      }
    } catch (error) {
      toast({
        title: 'Generation Failed',
        description: 'Failed to generate HTML snapshot',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          SEO Test Tools
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="test-url">URL to Test</Label>
          <div className="flex gap-2">
            <Input
              id="test-url"
              value={testUrl}
              onChange={(e) => setTestUrl(e.target.value)}
              placeholder="https://yourdomain.com/page"
            />
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => copyToClipboard(testUrl)}
              disabled={!testUrl}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {botTestUrl && (
          <div className="space-y-2">
            <Label>Bot Test URL</Label>
            <div className="flex gap-2">
              <Input
                value={botTestUrl}
                readOnly
                className="bg-muted"
              />
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => copyToClipboard(botTestUrl)}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                onClick={handleGenerateSnapshot}
                disabled={isLoading}
                size="sm"
              >
                {isLoading ? 'Generating...' : 'Test'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              This URL forces bot behavior for testing SEO tags
            </p>
          </div>
        )}

        <div className="space-y-3">
          <Label>Social Media Testing</Label>
          {testUrls.map((tool) => (
            <div key={tool.name} className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">{tool.name}</div>
                <div className="text-sm text-muted-foreground">{tool.description}</div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(tool.url, '_blank')}
                disabled={!testUrl}
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                Test
              </Button>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <Label>Quick Tests</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`view-source:${testUrl}`, '_blank')}
              disabled={!testUrl}
            >
              View Source
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`https://pagespeed.web.dev/analysis?url=${encodeURIComponent(testUrl)}`, '_blank')}
              disabled={!testUrl}
            >
              PageSpeed
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`https://search.google.com/test/rich-results?url=${encodeURIComponent(testUrl)}`, '_blank')}
              disabled={!testUrl}
            >
              Rich Results
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`https://www.google.com/search?q=site:${new URL(testUrl).hostname}`, '_blank')}
              disabled={!testUrl}
            >
              Google Index
            </Button>
          </div>
        </div>

        {customDomain && (
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="font-medium">Custom Domain Active</span>
            </div>
            <Badge variant="secondary">{customDomain}</Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}