import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { File, Search, Plus, Clock } from 'lucide-react';
import { LibraryDigitalFile } from '@/hooks/useDigitalFilesLibrary';

interface DigitalFilesLibraryProps {
  files: LibraryDigitalFile[];
  loading: boolean;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onSelectFile: (file: LibraryDigitalFile) => void;
}

export const DigitalFilesLibrary: React.FC<DigitalFilesLibraryProps> = ({
  files,
  loading,
  searchTerm,
  onSearchChange,
  onSelectFile
}) => {
  const formatFileSize = (bytes?: number) => {
    if (!bytes || bytes === 0) return 'Unknown size';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading your digital files...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="search">Search Files</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="search"
            placeholder="Search by file name or product..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {files.length === 0 ? (
        <div className="text-center p-8 border-2 border-dashed border-muted-foreground/25 rounded-lg">
          <File className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-2">
            {searchTerm ? 'No files found matching your search' : 'No digital files found in your library'}
          </p>
          <p className="text-xs text-muted-foreground">
            {searchTerm ? 'Try a different search term' : 'Upload files to other products to see them here'}
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          <Label>Available Files ({files.length})</Label>
          {files.map((file) => (
            <Card key={`${file.productId}-${file.id}`} className="hover:bg-muted/50 transition-colors">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <File className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="truncate">From: {file.productName}</span>
                        <span>•</span>
                        <span>{formatFileSize(file.size)}</span>
                        <span>•</span>
                        <Clock className="w-3 h-3" />
                        <span>{formatDate(file.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onSelectFile(file)}
                    className="flex-shrink-0 ml-2"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Use File
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};