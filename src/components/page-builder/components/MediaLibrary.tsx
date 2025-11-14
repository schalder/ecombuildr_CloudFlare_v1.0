import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Upload, Trash2, ExternalLink, Music } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface MediaItem {
  name: string;
  url: string;
  created_at: string;
  metadata?: {
    size?: number;
    mimetype?: string;
  };
}

interface MediaLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  currentUrl?: string;
  mediaType?: 'image' | 'audio' | 'all';
}

export const MediaLibrary: React.FC<MediaLibraryProps> = ({
  isOpen,
  onClose,
  onSelect,
  currentUrl,
  mediaType = 'image'
}) => {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MediaItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen) {
      fetchMediaItems();
    }
  }, [isOpen]);

  useEffect(() => {
    const filtered = mediaItems.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredItems(filtered);
  }, [mediaItems, searchTerm]);

  const fetchMediaItems = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.storage
        .from('images')
        .list(user.id, {
          limit: 100,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) throw error;

      const items: MediaItem[] = data
        .filter(file => {
          if (!file.metadata?.mimetype) return false;
          if (mediaType === 'image') return file.metadata.mimetype.startsWith('image/');
          if (mediaType === 'audio') return file.metadata.mimetype.startsWith('audio/');
          return file.metadata.mimetype.startsWith('image/') || file.metadata.mimetype.startsWith('audio/');
        })
        .map(file => {
          const { data: { publicUrl } } = supabase.storage
            .from('images')
            .getPublicUrl(`${user.id}/${file.name}`);
          
          return {
            name: file.name,
            url: publicUrl,
            created_at: file.created_at || '',
            metadata: file.metadata
          };
        });

      setMediaItems(items);
    } catch (error) {
      toast({
        title: "Failed to load media",
        description: "Could not fetch your media library",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (url: string) => {
    onSelect(url);
    onClose();
  };

  const handleDelete = async (fileName: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase.storage
        .from('images')
        .remove([`${user.id}/${fileName}`]);

      if (error) throw error;

      setMediaItems(prev => prev.filter(item => item.name !== fileName));
      toast({
        title: "File deleted",
        description: "The file has been removed from your library"
      });
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "Could not delete the file",
        variant: "destructive"
      });
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>
            {mediaType === 'audio' ? 'Audio Library' : mediaType === 'all' ? 'Media Library' : 'Image Library'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder={mediaType === 'audio' ? "Search audio files..." : mediaType === 'all' ? "Search media..." : "Search images..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={fetchMediaItems}
              disabled={isLoading}
            >
              Refresh
            </Button>
          </div>

          <ScrollArea className="h-[400px]">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <p className="text-muted-foreground">Loading media...</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="flex items-center justify-center h-32">
                <p className="text-muted-foreground">
                  {searchTerm 
                    ? `No ${mediaType === 'audio' ? 'audio files' : mediaType === 'all' ? 'media' : 'images'} found matching your search`
                    : `No ${mediaType === 'audio' ? 'audio files' : mediaType === 'all' ? 'media' : 'images'} in your library`}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-1">
                {filteredItems.map((item) => (
                  <div
                    key={item.name}
                    className={`group relative border rounded-lg overflow-hidden cursor-pointer transition-all hover:ring-2 hover:ring-primary ${
                      currentUrl === item.url ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedItem(selectedItem === item.name ? null : item.name)}
                  >
                    <div className="aspect-square">
                      {item.metadata?.mimetype?.startsWith('audio/') ? (
                        <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                          <Music className="w-12 h-12 text-primary" />
                        </div>
                      ) : (
                        <img
                          src={item.url}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    
                    {selectedItem === item.name && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="space-x-2">
                          <Button
                            type="button"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelect(item.url);
                            }}
                          >
                            Select
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(item.url, '_blank');
                            }}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(item.name);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-2 text-xs">
                      <p className="truncate">{item.name}</p>
                      <p className="text-gray-300">{formatFileSize(item.metadata?.size)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};