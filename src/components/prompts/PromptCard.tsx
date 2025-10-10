import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Eye, Tag, Sparkles } from 'lucide-react';
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
    <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-white to-gray-50/50 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full flex flex-col">
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-purple-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Sparkles icon in top-right corner */}
      <div className="absolute top-4 right-4 opacity-20 group-hover:opacity-40 transition-opacity duration-300">
        <Sparkles className="h-5 w-5 text-blue-500" />
      </div>

      <CardHeader className="pb-4 relative z-10">
        <div className="space-y-3">
          <CardTitle className="text-lg font-bold text-gray-900 line-clamp-2 leading-tight group-hover:text-blue-700 transition-colors duration-200">
            {prompt.title}
          </CardTitle>
          
          {prompt.description && (
            <CardDescription className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
              {prompt.description}
            </CardDescription>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-between relative z-10 pt-0">
        {/* Category and Tags Section */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            {prompt.category && (
              <Badge 
                variant="secondary" 
                className="bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors duration-200 text-xs font-medium px-2.5 py-1"
              >
                {prompt.category.name}
              </Badge>
            )}
          </div>
          
          {prompt.tags && prompt.tags.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-100 rounded-full px-2.5 py-1">
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
            className="flex-1 border-gray-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 font-medium"
          >
            <Eye className="h-4 w-4 mr-2" />
            View Prompt
          </Button>
          <Button
            size="sm"
            onClick={handleCopyPrompt}
            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-sm hover:shadow-md transition-all duration-200 font-medium"
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
