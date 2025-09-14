import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ExternalLink, 
  Facebook, 
  Twitter, 
  Linkedin, 
  Eye, 
  Copy,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SocialMediaDebuggerProps {
  pageUrl: string;
  title?: string;
  seoTitle?: string;
  seoDescription?: string;
  socialImageUrl?: string;
  canonicalUrl?: string;
}

export const SocialMediaDebugger: React.FC<SocialMediaDebuggerProps> = ({
  pageUrl,
  title,
  seoTitle,
  seoDescription,
  socialImageUrl,
  canonicalUrl
}) => {
  const [previewOpen, setPreviewOpen] = useState(false);
  const { toast } = useToast();

  const displayTitle = seoTitle || title || 'Untitled Page';
  const finalUrl = canonicalUrl || pageUrl;

  const debuggers = [
    {
      name: 'Facebook Debugger',
      icon: <Facebook className="h-4 w-4" />,
      url: `https://developers.facebook.com/tools/debug/?q=${encodeURIComponent(finalUrl)}`,
      description: 'Test Open Graph tags for Facebook sharing',
      color: 'text-blue-600'
    },
    {
      name: 'Twitter Card Validator',
      icon: <Twitter className="h-4 w-4" />,
      url: `https://cards-dev.twitter.com/validator?url=${encodeURIComponent(finalUrl)}`,
      description: 'Validate Twitter Cards for tweet previews',
      color: 'text-blue-400'
    },
    {
      name: 'LinkedIn Inspector',
      icon: <Linkedin className="h-4 w-4" />,
      url: `https://www.linkedin.com/post-inspector/inspect/${encodeURIComponent(finalUrl)}`,
      description: 'Check LinkedIn post preview and metadata',
      color: 'text-blue-700'
    }
  ];

  const copyUrl = async () => {
    await navigator.clipboard.writeText(finalUrl);
    toast({
      title: "URL copied",
      description: "Page URL copied to clipboard",
    });
  };

  const socialPreview = {
    hasImage: !!socialImageUrl,
    hasTitle: !!displayTitle,
    hasDescription: !!seoDescription,
    isComplete: !!socialImageUrl && !!displayTitle && !!seoDescription
  };

  if (!pageUrl) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Page URL is required for social media debugging. Please save the page first.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Social Media Debugger
          {process.env.NODE_ENV === 'development' && (
            <Badge variant="secondary">Dev Only</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Page URL */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Page URL</label>
          <div className="flex items-center gap-2">
            <div className="flex-1 p-2 bg-muted rounded text-sm font-mono text-muted-foreground break-all">
              {finalUrl}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={copyUrl}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Social Preview Status */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Social Preview Status</label>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 text-sm">
              {socialPreview.hasTitle ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              )}
              Title {socialPreview.hasTitle ? 'Set' : 'Missing'}
            </div>
            <div className="flex items-center gap-2 text-sm">
              {socialPreview.hasDescription ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              )}
              Description {socialPreview.hasDescription ? 'Set' : 'Missing'}
            </div>
            <div className="flex items-center gap-2 text-sm">
              {socialPreview.hasImage ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              )}
              Image {socialPreview.hasImage ? 'Set' : 'Missing'}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Badge variant={socialPreview.isComplete ? 'default' : 'secondary'}>
                {socialPreview.isComplete ? 'Complete' : 'Incomplete'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Social Media Preview */}
        {previewOpen && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Preview</label>
            <div className="border rounded-lg p-4 space-y-3 bg-card">
              {socialImageUrl && (
                <div className="aspect-video bg-muted rounded overflow-hidden">
                  <img
                    src={socialImageUrl}
                    alt="Social preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="space-y-1">
                <h4 className="font-semibold text-sm line-clamp-2">{displayTitle}</h4>
                {seoDescription && (
                  <p className="text-muted-foreground text-xs line-clamp-3">{seoDescription}</p>
                )}
                <p className="text-muted-foreground text-xs">{new URL(finalUrl).hostname}</p>
              </div>
            </div>
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() => setPreviewOpen(!previewOpen)}
          className="w-full"
        >
          <Eye className="h-4 w-4 mr-2" />
          {previewOpen ? 'Hide' : 'Show'} Social Preview
        </Button>

        {/* Debug Tools */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Debug Tools</label>
          <div className="space-y-2">
            {debuggers.map((debugger, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                asChild
                className="w-full justify-start"
              >
                <a
                  href={debugger.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <span className={debugger.color}>{debugger.icon}</span>
                  <div className="flex-1 text-left">
                    <div className="font-medium">{debugger.name}</div>
                    <div className="text-xs text-muted-foreground">{debugger.description}</div>
                  </div>
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            ))}
          </div>
        </div>

        {!socialPreview.isComplete && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Complete your social media setup by adding a title, description, and image for better sharing experience.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};