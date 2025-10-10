import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Eye, Tag } from 'lucide-react';
import { Prompt } from '@/hooks/usePrompts';
import { useToast } from '@/hooks/use-toast';

interface PromptCardProps {
  prompt: Prompt;
  onViewPrompt: (prompt: Prompt) => void;
  onCopyPrompt?: (prompt: Prompt) => void;
}

export const PromptCard: React.FC<PromptCardProps> = ({
  prompt,
  onViewPrompt,
  onCopyPrompt
}) => {
  const { toast } = useToast();

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(prompt.content);
      toast({
        title: "Copied!",
        description: "Prompt copied to clipboard",
      });
      onCopyPrompt?.(prompt);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy prompt",
        variant: "destructive",
      });
    }
  };

  const truncateText = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <Card className="h-full flex flex-col hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold line-clamp-2">
              {prompt.title}
            </CardTitle>
            {prompt.description && (
              <CardDescription className="mt-2 line-clamp-2">
                {prompt.description}
              </CardDescription>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2 mt-3">
          {prompt.category && (
            <Badge variant="secondary" className="text-xs">
              {prompt.category.name}
            </Badge>
          )}
          {prompt.tags && prompt.tags.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Tag className="h-3 w-3" />
              <span>{prompt.tags.length} tags</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-between">
        <div className="mb-4">
          <p className="text-sm text-muted-foreground line-clamp-3">
            {truncateText(prompt.content)}
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewPrompt(prompt)}
            className="flex-1"
          >
            <Eye className="h-4 w-4 mr-2" />
            View Prompt
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleCopyPrompt}
            className="flex-1"
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
