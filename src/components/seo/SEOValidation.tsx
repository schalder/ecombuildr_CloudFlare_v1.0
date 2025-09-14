import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

interface SEOValidationProps {
  title?: string;
  seoTitle?: string;
  seoDescription?: string;
  keywords?: string[];
  socialImageUrl?: string;
  canonicalUrl?: string;
}

export const SEOValidation: React.FC<SEOValidationProps> = ({
  title,
  seoTitle,
  seoDescription,
  keywords,
  socialImageUrl,
  canonicalUrl
}) => {
  const displayTitle = seoTitle || title;
  const titleLength = displayTitle?.length || 0;
  const descriptionLength = seoDescription?.length || 0;

  const validations = [
    {
      label: 'Title Length',
      status: titleLength === 0 ? 'error' : titleLength <= 60 ? 'success' : 'warning',
      message: titleLength === 0 
        ? 'Title is required' 
        : titleLength <= 60 
          ? `Good length (${titleLength}/60)` 
          : `Too long (${titleLength}/60)`
    },
    {
      label: 'Description Length',
      status: descriptionLength === 0 ? 'error' : descriptionLength <= 160 ? 'success' : 'warning',
      message: descriptionLength === 0 
        ? 'Description is required' 
        : descriptionLength <= 160 
          ? `Good length (${descriptionLength}/160)` 
          : `Too long (${descriptionLength}/160)`
    },
    {
      label: 'Keywords',
      status: !keywords?.length ? 'warning' : keywords.length <= 5 ? 'success' : 'warning',
      message: !keywords?.length 
        ? 'Add keywords for better SEO' 
        : keywords.length <= 5 
          ? `Good (${keywords.length} keywords)` 
          : `Too many (${keywords.length}/5 recommended)`
    },
    {
      label: 'Social Image',
      status: !socialImageUrl ? 'warning' : 'success',
      message: !socialImageUrl ? 'Add social image for better sharing' : 'Social image set'
    },
    {
      label: 'Canonical URL',
      status: !canonicalUrl ? 'warning' : 'success',
      message: !canonicalUrl ? 'Add canonical URL to prevent duplicate content' : 'Canonical URL set'
    }
  ];

  const getIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getVariant = (status: string) => {
    switch (status) {
      case 'success':
        return 'default';
      case 'warning':
        return 'secondary';
      case 'error':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const score = validations.filter(v => v.status === 'success').length;
  const maxScore = validations.length;
  const percentage = Math.round((score / maxScore) * 100);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">SEO Score</h4>
        <Badge variant={percentage >= 80 ? 'default' : percentage >= 60 ? 'secondary' : 'destructive'}>
          {score}/{maxScore} ({percentage}%)
        </Badge>
      </div>

      <div className="space-y-2">
        {validations.map((validation, index) => (
          <div key={index} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              {getIcon(validation.status)}
              <span>{validation.label}</span>
            </div>
            <span className="text-muted-foreground text-xs">{validation.message}</span>
          </div>
        ))}
      </div>

      {percentage < 80 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            Improve your SEO score by addressing the warnings above. A score of 80% or higher is recommended.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};