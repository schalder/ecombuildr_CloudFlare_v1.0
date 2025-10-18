import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Upload, Trash2, Copy, RefreshCw, Grid3X3, List, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
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

const MediaStorage = () => {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MediaItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const { toast } = useToast();
  const { user } = useAuth();
  
  const ITEMS_PER_PAGE = 40;

  useEffect(() => {
    fetchMediaItems(1);
  }, []);

  useEffect(() => {
    const filtered = mediaItems.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredItems(filtered);
  }, [mediaItems, searchTerm]);

  const fetchMediaItems = async (page = 1) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // First, get total count
      const { data: allData, error: countError } = await supabase.storage
        .from('images')
        .list(user.id, {
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (countError) throw countError;

      const totalFiles = allData.filter(file => file.metadata && file.metadata.mimetype?.startsWith('image/'));
      setTotalCount(totalFiles.length);

      // Then get paginated data
      const offset = (page - 1) * ITEMS_PER_PAGE;
      const { data, error } = await supabase.storage
        .from('images')
        .list(user.id, {
          limit: ITEMS_PER_PAGE + 1, // Fetch one extra to check if there's a next page
          offset: offset,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) throw error;

      const allFiles = data.filter(file => file.metadata && file.metadata.mimetype?.startsWith('image/'));
      
      // Check if there's a next page
      const hasMore = allFiles.length > ITEMS_PER_PAGE;
      setHasNextPage(hasMore);
      
      // Take only the items for current page
      const pageFiles = hasMore ? allFiles.slice(0, ITEMS_PER_PAGE) : allFiles;
      
      const items: MediaItem[] = pageFiles.map(file => {
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
      setCurrentPage(page);
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

  const handleFileUpload = async (files: FileList) => {
    if (!user || files.length === 0) return;

    setIsUploading(true);
    const uploadPromises = Array.from(files).map(async (file) => {
      try {
        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`File ${file.name} is too large (max 5MB)`);
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
          throw new Error(`File ${file.name} is not an image`);
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        
        const { data, error } = await supabase.storage
          .from('images')
          .upload(`${user.id}/${fileName}`, file);

        if (error) throw error;

        return { success: true, name: file.name };
      } catch (error: any) {
        return { success: false, name: file.name, error: error.message };
      }
    });

    const results = await Promise.all(uploadPromises);
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    if (successful.length > 0) {
      toast({
        title: "Upload completed",
        description: `${successful.length} file(s) uploaded successfully`
      });
      fetchMediaItems(currentPage); // Refresh the current page
    }

    if (failed.length > 0) {
      toast({
        title: "Some uploads failed",
        description: `${failed.length} file(s) failed to upload`,
        variant: "destructive"
      });
    }

    setIsUploading(false);
  };

  const handleDelete = async (fileName: string) => {
    if (!user) return;

    try {
      const { error } = await supabase.storage
        .from('images')
        .remove([`${user.id}/${fileName}`]);

      if (error) throw error;

      setMediaItems(prev => prev.filter(item => item.name !== fileName));
      setSelectedItems(prev => prev.filter(name => name !== fileName));
      toast({
        title: "Image deleted",
        description: "The image has been removed from your library"
      });
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "Could not delete the image",
        variant: "destructive"
      });
    }
  };

  const handleBulkDelete = async () => {
    if (!user || selectedItems.length === 0) return;

    try {
      const filesToDelete = selectedItems.map(name => `${user.id}/${name}`);
      const { error } = await supabase.storage
        .from('images')
        .remove(filesToDelete);

      if (error) throw error;

      setMediaItems(prev => prev.filter(item => !selectedItems.includes(item.name)));
      setSelectedItems([]);
      toast({
        title: `${filesToDelete.length} images deleted`,
        description: "Selected images have been removed from your library"
      });
    } catch (error) {
      toast({
        title: "Bulk delete failed",
        description: "Could not delete selected images",
        variant: "destructive"
      });
    }
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: "URL copied",
      description: "Image URL has been copied to clipboard"
    });
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <DashboardLayout title="Media Storage" description="Manage your uploaded images and media files">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search images..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-foreground"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchMediaItems(currentPage)}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex border rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>

            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
              className="hidden"
              id="file-upload"
            />
            <Button
              asChild
              disabled={isUploading}
              className="bg-primary hover:bg-primary-glow"
            >
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="w-4 h-4 mr-2" />
                {isUploading ? 'Uploading...' : 'Upload Images'}
              </label>
            </Button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedItems.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {selectedItems.length} item(s) selected
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkDelete}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Selected
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedItems([])}
                  >
                    Clear Selection
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pagination Controls */}
        {!isLoading && filteredItems.length > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Page {currentPage} • Showing {filteredItems.length} of {totalCount} item{totalCount !== 1 ? 's' : ''}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchMediaItems(currentPage - 1)}
                disabled={currentPage === 1 || isLoading}
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchMediaItems(currentPage + 1)}
                disabled={!hasNextPage || isLoading}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="min-h-[calc(100vh-16rem)]">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center space-y-3">
                <div className="animate-pulse w-12 h-12 bg-muted rounded-full mx-auto"></div>
                <p className="text-muted-foreground">Loading media...</p>
              </div>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center">
                <Upload className="w-12 h-12 text-muted-foreground" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-lg font-medium">
                  {searchTerm ? 'No images found' : 'Your media library is empty'}
                </h3>
                <p className="text-muted-foreground max-w-md">
                  {searchTerm 
                    ? `No images found matching "${searchTerm}". Try adjusting your search.`
                    : 'Start building your media library by uploading your first image.'
                  }
                </p>
              </div>
              {!searchTerm && (
                <Button
                  asChild
                  size="lg"
                  className="bg-primary hover:bg-primary-glow"
                >
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Your First Image
                  </label>
                </Button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
              {filteredItems.map((item) => (
                <div
                  key={item.name}
                  className={`group relative border rounded-lg overflow-hidden transition-all hover:ring-2 hover:ring-primary hover:shadow-lg ${
                    selectedItems.includes(item.name) ? 'ring-2 ring-primary shadow-lg' : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    className="absolute top-2 left-2 z-10 w-4 h-4 accent-primary"
                    checked={selectedItems.includes(item.name)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedItems(prev => [...prev, item.name]);
                      } else {
                        setSelectedItems(prev => prev.filter(name => name !== item.name));
                      }
                    }}
                  />
                  
                  <div className="aspect-square">
                    <img
                      src={item.url}
                      alt={item.name}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="space-x-2">
                      <Button
                        size="sm"
                        onClick={() => copyToClipboard(item.url)}
                        className="bg-white/10 hover:bg-white/20 text-white border-white/20"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(item.name)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent text-white p-2 text-xs">
                    <p className="truncate font-medium">{item.name}</p>
                    <p className="text-gray-300">{formatFileSize(item.metadata?.size)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {filteredItems.map((item) => (
                    <div
                      key={item.name}
                      className={`p-4 hover:bg-muted/50 transition-colors ${
                        selectedItems.includes(item.name) ? 'bg-muted' : ''
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <input
                          type="checkbox"
                          className="w-4 h-4 accent-primary"
                          checked={selectedItems.includes(item.name)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedItems(prev => [...prev, item.name]);
                            } else {
                              setSelectedItems(prev => prev.filter(name => name !== item.name));
                            }
                          }}
                        />
                        
                        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border">
                          <img
                            src={item.url}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate text-base">{item.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {formatFileSize(item.metadata?.size)} • {formatDate(item.created_at)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            {item.url}
                          </p>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(item.url)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(item.name)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MediaStorage;