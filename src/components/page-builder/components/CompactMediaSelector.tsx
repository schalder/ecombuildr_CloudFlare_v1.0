import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FolderOpen, Upload, Link, Plus, X, Edit } from 'lucide-react';
import { ImageUpload } from '@/components/ui/image-upload';
import { MediaLibrary } from './MediaLibrary';

interface CompactMediaSelectorProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
}

export const CompactMediaSelector: React.FC<CompactMediaSelectorProps> = ({
  value = '',
  onChange,
  label = 'Select Image'
}) => {
  const [isMediaLibraryOpen, setIsMediaLibraryOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isUrlDialogOpen, setIsUrlDialogOpen] = useState(false);
  const [urlInput, setUrlInput] = useState(value);

  const handleLibrarySelect = (url: string) => {
    onChange(url);
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
      setIsUrlDialogOpen(false);
    }
  };

  const handleRemove = () => {
    onChange('');
    setUrlInput('');
  };

  const hasImage = Boolean(value);

  if (hasImage) {
    return (
      <div className="group relative">
        <div className="flex items-center gap-3 p-2 border rounded-lg bg-muted/30 overflow-hidden">
          <div className="w-12 h-12 rounded-md overflow-hidden bg-muted flex-shrink-0">
            <img 
              src={value} 
              alt="Selected"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNiAxNkwyNCAxNkwyNCAxOEwxNiAxOFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTE2IDIwTDI0IDIwTDI0IDIyTDE2IDIyWiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';
              }}
            />
          </div>
          <div className="flex-1 min-w-0 overflow-hidden">
            <p className="text-sm font-medium truncate" title={value.split('/').pop() || 'Selected image'}>
              {(() => {
                const filename = value.split('/').pop() || 'Selected image';
                return filename.length > 25 ? `${filename.substring(0, 25)}...` : filename;
              })()}
            </p>
            <p className="text-xs text-muted-foreground truncate" title={value}>
              {(() => {
                if (value.length <= 35) return value;
                const start = value.substring(0, 20);
                const end = value.substring(value.length - 12);
                return `${start}...${end}`;
              })()}
            </p>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                  <Edit className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsMediaLibraryOpen(true)}>
                  <FolderOpen className="w-4 h-4 mr-2" />
                  Browse Library
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsUploadDialogOpen(true)}>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload New
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsUrlDialogOpen(true)}>
                  <Link className="w-4 h-4 mr-2" />
                  External URL
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={handleRemove}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Dialogs */}
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload New Image</DialogTitle>
            </DialogHeader>
            <ImageUpload
              value=""
              onChange={(url) => {
                onChange(url);
                setIsUploadDialogOpen(false);
              }}
              accept="image/*"
              maxSize={5}
            />
          </DialogContent>
        </Dialog>

        <Dialog open={isUrlDialogOpen} onOpenChange={setIsUrlDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add External Image URL</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/image.jpg"
                onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsUrlDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUrlSubmit} disabled={!urlInput.trim()}>
                  Use URL
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <MediaLibrary
          isOpen={isMediaLibraryOpen}
          onClose={() => setIsMediaLibraryOpen(false)}
          onSelect={handleLibrarySelect}
          currentUrl={value}
        />
      </div>
    );
  }

  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full justify-start">
            <Plus className="w-4 h-4 mr-2" />
            {label}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuItem onClick={() => setIsMediaLibraryOpen(true)}>
            <FolderOpen className="w-4 h-4 mr-2" />
            Browse Library
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsUploadDialogOpen(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Upload New
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsUrlDialogOpen(true)}>
            <Link className="w-4 h-4 mr-2" />
            External URL
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialogs */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload New Image</DialogTitle>
          </DialogHeader>
          <ImageUpload
            value=""
            onChange={(url) => {
              onChange(url);
              setIsUploadDialogOpen(false);
            }}
            accept="image/*"
            maxSize={5}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isUrlDialogOpen} onOpenChange={setIsUrlDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add External Image URL</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://example.com/image.jpg"
              onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsUrlDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUrlSubmit} disabled={!urlInput.trim()}>
                Use URL
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <MediaLibrary
        isOpen={isMediaLibraryOpen}
        onClose={() => setIsMediaLibraryOpen(false)}
        onSelect={handleLibrarySelect}
        currentUrl={value}
      />
    </div>
  );
};