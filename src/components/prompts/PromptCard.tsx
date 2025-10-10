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

  return (
    <Card className="h-full flex flex-col border border-gray-200 bg-white hover:border-gray-300 hover:shadow-lg transition-all duration-200 group">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-2 leading-tight mb-2">
          {prompt.title}
        </CardTitle>
        
        {prompt.description && (
          <CardDescription className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
            {prompt.description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-between pt-0">
        {/* Category and Tags Section */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            {prompt.category && (
              <Badge 
                variant="secondary" 
                className="bg-blue-50 text-blue-700 border border-blue-200 text-xs font-medium px-2.5 py-1"
              >
                {prompt.category.name}
              </Badge>
            )}
          </div>
          
          {prompt.tags && prompt.tags.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-md px-2.5 py-1">
              <Tag className="h-3 w-3" />
              <span className="font-medium">{prompt.tags.length} tags</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewPrompt(prompt)}
            className="flex-1 border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-colors duration-200"
          >
            <Eye className="h-4 w-4 mr-2" />
            View Prompt
          </Button>
          <Button
            size="sm"
            onClick={handleCopyPrompt}
            className="flex-1 bg-gray-900 hover:bg-gray-800 text-white transition-colors duration-200"
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
