import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Copy, RefreshCw, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SocialDebuggerProps {
  url?: string;
  title?: string;
  description?: string;
  image?: string;
  className?: string;
}

export const SocialDebugger: React.FC<SocialDebuggerProps> = ({
  url,
  title,
  description,
  image,
  className = ''
}) => {
  const { toast } = useToast();
  const [isVisible, setIsVisible] = useState(false);
  
  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  const currentUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  const encodedUrl = encodeURIComponent(currentUrl);

  const debuggingTools = [
    {
      name: 'Facebook Debugger',
      url: `https://developers.facebook.com/tools/debug/?q=${encodedUrl}`,
      description: 'Test how your content appears when shared on Facebook',
      color: 'bg-blue-500'
    },
    {
      name: 'Twitter Card Validator',
      url: `https://cards-dev.twitter.com/validator?url=${encodedUrl}`,
      description: 'Preview and validate Twitter card markup',
      color: 'bg-sky-500'
    },
    {
      name: 'LinkedIn Post Inspector',
      url: `https://www.linkedin.com/post-inspector/inspect/${encodedUrl}`,
      description: 'See how your content appears on LinkedIn',
      color: 'bg-blue-600'
    },
    {
      name: 'WhatsApp Preview',
      url: `https://api.whatsapp.com/send?text=${encodedUrl}`,
      description: 'Test WhatsApp link preview',
      color: 'bg-green-500'
    }
  ];

  const copyMetaTags = async () => {
    const metaTags = `
<!-- Open Graph / Facebook -->
<meta property="og:type" content="website" />
<meta property="og:url" content="${currentUrl}" />
<meta property="og:title" content="${title || 'Your Title'}" />
<meta property="og:description" content="${description || 'Your Description'}" />
<meta property="og:image" content="${image || 'Your Image URL'}" />

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:url" content="${currentUrl}" />
<meta name="twitter:title" content="${title || 'Your Title'}" />
<meta name="twitter:description" content="${description || 'Your Description'}" />
<meta name="twitter:image" content="${image || 'Your Image URL'}" />
    `.trim();

    try {
      await navigator.clipboard.writeText(metaTags);
      toast({
        title: "Meta tags copied!",
        description: "Meta tags have been copied to your clipboard.",
      });
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Failed to copy meta tags to clipboard.",
        variant: "destructive"
      });
    }
  };

  const clearFacebookCache = () => {
    const facebookUrl = `https://developers.facebook.com/tools/debug/clear-cache/?q=${encodedUrl}`;
    window.open(facebookUrl, '_blank');
  };

  if (!isVisible) {
    return (
      <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
        <Button
          onClick={() => setIsVisible(true)}
          size="sm"
          variant="outline"
          className="shadow-lg bg-background"
        >
          <Eye className="h-4 w-4 mr-2" />
          SEO Debug
        </Button>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 w-96 ${className}`}>
      <Card className="shadow-xl border-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">Social Media Debugger</CardTitle>
            <Badge variant="secondary">DEV</Badge>
          </div>
          <Button
            onClick={() => setIsVisible(false)}
            size="sm"
            variant="ghost"
            className="absolute top-2 right-2 h-6 w-6 p-0"
          >
            ×
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-xs text-muted-foreground">
            <strong>URL:</strong> {currentUrl}
          </div>
          
          {/* Current Meta Info */}
          {(title || description || image) && (
            <div className="p-3 bg-muted rounded-md text-xs space-y-1">
              {title && <div><strong>Title:</strong> {title}</div>}
              {description && <div><strong>Description:</strong> {description.substring(0, 100)}...</div>}
              {image && <div><strong>Image:</strong> {image}</div>}
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={copyMetaTags}
              size="sm"
              variant="outline"
              className="text-xs"
            >
              <Copy className="h-3 w-3 mr-1" />
              Copy Tags
            </Button>
            <Button
              onClick={clearFacebookCache}
              size="sm"
              variant="outline"
              className="text-xs"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Clear FB Cache
            </Button>
          </div>

          {/* Debugging Tools */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-muted-foreground">Validation Tools:</div>
            {debuggingTools.map((tool) => (
              <Button
                key={tool.name}
                onClick={() => window.open(tool.url, '_blank')}
                size="sm"
                variant="outline"
                className="w-full justify-start text-xs h-auto p-2"
              >
                <div className={`w-2 h-2 rounded-full ${tool.color} mr-2 flex-shrink-0`} />
                <div className="text-left">
                  <div className="font-medium">{tool.name}</div>
                  <div className="text-muted-foreground text-xs">{tool.description}</div>
                </div>
                <ExternalLink className="h-3 w-3 ml-auto flex-shrink-0" />
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};