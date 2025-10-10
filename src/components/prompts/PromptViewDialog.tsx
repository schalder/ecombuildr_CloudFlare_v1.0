import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Copy, Edit, RotateCcw, Tag } from 'lucide-react';
import { Prompt } from '@/hooks/usePrompts';
import { useToast } from '@/hooks/use-toast';

interface PromptViewDialogProps {
  prompt: Prompt | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PromptViewDialog: React.FC<PromptViewDialogProps> = ({
  prompt,
  isOpen,
  onClose
}) => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');

  // Reset state when prompt changes
  React.useEffect(() => {
    if (prompt) {
      setOriginalContent(prompt.content);
      setEditedContent(prompt.content);
      setIsEditing(false);
    }
  }, [prompt]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleReset = () => {
    setEditedContent(originalContent);
    setIsEditing(false);
  };

  const handleCopyPrompt = async () => {
    const contentToCopy = isEditing ? editedContent : originalContent;
    try {
      await navigator.clipboard.writeText(contentToCopy);
      toast({
        title: "Copied!",
        description: "Prompt copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy prompt",
        variant: "destructive",
      });
    }
  };

  const handleContentChange = (content: string) => {
    setEditedContent(content);
  };

  if (!prompt) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-xl font-semibold">
                {prompt.title}
              </DialogTitle>
              {prompt.description && (
                <DialogDescription className="mt-2">
                  {prompt.description}
                </DialogDescription>
              )}
            </div>
            <div className="flex items-center gap-2 ml-4">
              {prompt.category && (
                <Badge variant="secondary">
                  {prompt.category.name}
                </Badge>
              )}
              {prompt.tags && prompt.tags.length > 0 && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Tag className="h-4 w-4" />
                  <span>{prompt.tags.length}</span>
                </div>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-4 flex-shrink-0">
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <span className="text-sm text-muted-foreground">
                    Editing mode - changes are temporary
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReset}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEdit}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Prompt
                </Button>
              )}
            </div>
            
            <Button
              onClick={handleCopyPrompt}
              className="flex items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              Copy {isEditing ? 'Edited' : 'Original'}
            </Button>
          </div>

          <div className="flex-1 overflow-auto border rounded-md">
            <RichTextEditor
              content={isEditing ? editedContent : originalContent}
              onChange={handleContentChange}
              placeholder="Prompt content will appear here..."
              className="min-h-[400px]"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
