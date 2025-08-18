import React from 'react';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';

interface SEOData {
  title: string;
  seo_title: string;
  seo_description: string;
  seo_keywords: string[];
  meta_author: string;
  social_image_url: string;
  canonical_url: string;
}

interface SEOAnalysisSectionProps {
  data: SEOData;
}

interface SEOCheck {
  label: string;
  status: 'pass' | 'warn' | 'fail';
  message: string;
}

export const SEOAnalysisSection: React.FC<SEOAnalysisSectionProps> = ({ data }) => {
  const checks: SEOCheck[] = [
    // Title checks
    {
      label: 'Page has a title',
      status: data.seo_title || data.title ? 'pass' : 'fail',
      message: data.seo_title || data.title ? 'Title is present' : 'Add a page title'
    },
    {
      label: 'Title is under 60 characters',
      status: (data.seo_title || data.title || '').length <= 60 ? 'pass' : 'warn',
      message: `Title is ${(data.seo_title || data.title || '').length} characters`
    },
    
    // Description checks
    {
      label: 'Page has meta description',
      status: data.seo_description ? 'pass' : 'fail',
      message: data.seo_description ? 'Meta description is present' : 'Add a meta description'
    },
    {
      label: 'Description is under 155 characters',
      status: (data.seo_description || '').length <= 155 ? 'pass' : 'warn',
      message: `Description is ${data.seo_description.length} characters`
    },

    // Keywords check
    {
      label: 'Page has keywords',
      status: data.seo_keywords?.length > 0 ? 'pass' : 'warn',
      message: data.seo_keywords?.length > 0 ? `${data.seo_keywords.length} keywords added` : 'Consider adding relevant keywords'
    },

    // Author check
    {
      label: 'Page has author',
      status: data.meta_author ? 'pass' : 'warn',
      message: data.meta_author ? 'Author is specified' : 'Consider adding an author for credibility'
    },

    // Social image check
    {
      label: 'Social image present',
      status: data.social_image_url ? 'pass' : 'warn',
      message: data.social_image_url ? 'Social image is set' : 'Add a social media image for better sharing'
    },

    // Canonical URL check
    {
      label: 'Canonical URL present',
      status: data.canonical_url ? 'pass' : 'warn',
      message: data.canonical_url ? 'Canonical URL is set' : 'Add canonical URL to prevent duplicate content'
    }
  ];

  const passCount = checks.filter(c => c.status === 'pass').length;
  const totalCount = checks.length;
  const score = Math.round((passCount / totalCount) * 100);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warn':
        return <AlertTriangle className="h-4 w-4 text-amber-600" />;
      case 'fail':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <Collapsible>
      <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-left hover:bg-muted/50 rounded px-2 transition-colors">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">SEO Analysis</span>
          <div className={`text-sm font-semibold ${getScoreColor(score)}`}>
            {score}%
          </div>
        </div>
      </CollapsibleTrigger>
      
      <CollapsibleContent>
        <div className="px-2 pb-4 pt-2 space-y-4">
          {/* Overall Score */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">SEO Score</span>
              <span className={`text-sm font-semibold ${getScoreColor(score)}`}>
                {score}%
              </span>
            </div>
            <Progress value={score} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {passCount} of {totalCount} checks passed
            </p>
          </div>

          {/* Individual Checks */}
          <div className="space-y-2">
            {checks.map((check, index) => (
              <div key={index} className="flex items-start gap-3 p-2 rounded-md bg-muted/20">
                {getStatusIcon(check.status)}
                <div className="flex-1">
                  <div className="text-xs font-medium">{check.label}</div>
                  <div className="text-xs text-muted-foreground">{check.message}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Recommendations */}
          <div className="p-3 bg-blue-50 rounded-md">
            <h4 className="text-xs font-semibold text-blue-900 mb-2">Quick Wins</h4>
            <div className="text-xs text-blue-800 space-y-1">
              {!data.seo_description && <p>• Add a compelling meta description</p>}
              {!data.meta_author && <p>• Add an author name for credibility</p>}
              {!data.social_image_url && <p>• Upload a social media image</p>}
              {(!data.seo_keywords || data.seo_keywords.length === 0) && <p>• Add relevant keywords</p>}
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};