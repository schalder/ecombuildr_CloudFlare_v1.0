import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Sparkles, Filter } from 'lucide-react';
import { usePrompts, Prompt } from '@/hooks/usePrompts';
import { PromptCard } from '@/components/prompts/PromptCard';
import { PromptViewDialog } from '@/components/prompts/PromptViewDialog';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';

const ContentPrompts: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { prompts, categories, loading, error } = usePrompts({
    categoryId: selectedCategory || undefined,
    searchQuery: searchQuery || undefined,
  });

  const handleViewPrompt = (prompt: Prompt) => {
    setSelectedPrompt(prompt);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedPrompt(null);
  };

  const handleCopyPrompt = (prompt: Prompt) => {
    // This is handled in the PromptCard component
  };

  const filteredPrompts = prompts.filter(prompt => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      prompt.title.toLowerCase().includes(query) ||
      prompt.description?.toLowerCase().includes(query) ||
      prompt.content.toLowerCase().includes(query) ||
      prompt.tags?.some(tag => tag.toLowerCase().includes(query))
    );
  });

  return (
    <DashboardLayout 
      title="Content Prompts" 
      description="Discover and customize AI prompt templates for your content creation needs"
    >
      <div className="py-8">
      {/* Search and Filters */}
      <div className="mb-8 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search prompts by title, description, or content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Categories:</span>
          
          <Button
            variant={selectedCategory === '' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('')}
          >
            All
          </Button>
          
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.name}
            </Button>
          ))}
        </div>

        {/* Results Summary */}
        {!loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>
              {filteredPrompts.length} prompt{filteredPrompts.length !== 1 ? 's' : ''} found
            </span>
            {selectedCategory && (
              <>
                <span>•</span>
                <span>
                  in {categories.find(c => c.id === selectedCategory)?.name}
                </span>
              </>
            )}
            {searchQuery && (
              <>
                <span>•</span>
                <span>matching "{searchQuery}"</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading prompts...</p>
          </div>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-destructive mb-4">Error loading prompts: {error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      ) : filteredPrompts.length === 0 ? (
        <div className="text-center py-12">
          <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No prompts found</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery || selectedCategory
              ? 'Try adjusting your search or filter criteria'
              : 'No prompts are available at the moment'
            }
          </p>
          {(searchQuery || selectedCategory) && (
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('');
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPrompts.map((prompt) => (
            <PromptCard
              key={prompt.id}
              prompt={prompt}
              onViewPrompt={handleViewPrompt}
              onCopyPrompt={handleCopyPrompt}
            />
          ))}
        </div>
      )}

        {/* Prompt View Dialog */}
        <PromptViewDialog
          prompt={selectedPrompt}
          isOpen={isDialogOpen}
          onClose={handleCloseDialog}
        />
      </div>
    </DashboardLayout>
  );
};

export default ContentPrompts;
