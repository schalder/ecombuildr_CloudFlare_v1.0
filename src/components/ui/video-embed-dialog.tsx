import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { parseVideoUrl } from '@/components/page-builder/utils/videoUtils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface VideoEmbedDialogProps {
  open: boolean;
  onClose: () => void;
  onInsert: (options: { src?: string; width: string; embedCode?: string }) => void;
}

export const VideoEmbedDialog: React.FC<VideoEmbedDialogProps> = ({
  open,
  onClose,
  onInsert,
}) => {
  const [videoUrl, setVideoUrl] = useState('');
  const [embedCode, setEmbedCode] = useState('');
  const [width, setWidth] = useState('full');
  const [activeTab, setActiveTab] = useState('url');
  const [urlError, setUrlError] = useState('');

  const handleReset = () => {
    setVideoUrl('');
    setEmbedCode('');
    setWidth('full');
    setActiveTab('url');
    setUrlError('');
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const validateVideoUrl = (url: string): boolean => {
    if (!url.trim()) {
      setUrlError('Please enter a video URL');
      return false;
    }

    const videoInfo = parseVideoUrl(url);
    if (videoInfo.type === 'unknown') {
      setUrlError('Unsupported video URL. Please use YouTube, Vimeo, Wistia, or direct video file URLs.');
      return false;
    }

    setUrlError('');
    return true;
  };

  const handleInsert = () => {
    if (activeTab === 'url') {
      if (!validateVideoUrl(videoUrl)) {
        return;
      }
      onInsert({ src: videoUrl.trim(), width });
    } else {
      if (!embedCode.trim()) {
        return;
      }
      onInsert({ embedCode: embedCode.trim(), width });
    }
    
    handleClose();
  };

  const isValidToInsert = () => {
    if (activeTab === 'url') {
      return videoUrl.trim() && !urlError;
    }
    return embedCode.trim();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Insert Video</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="url">Video URL</TabsTrigger>
            <TabsTrigger value="embed">Embed Code</TabsTrigger>
          </TabsList>

          <TabsContent value="url" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="video-url">Video URL</Label>
              <Input
                id="video-url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={videoUrl}
                onChange={(e) => {
                  setVideoUrl(e.target.value);
                  if (urlError) setUrlError('');
                }}
                onBlur={() => videoUrl && validateVideoUrl(videoUrl)}
              />
              {urlError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{urlError}</AlertDescription>
                </Alert>
              )}
              <p className="text-sm text-muted-foreground">
                Supports YouTube, Vimeo, Wistia, and direct video file URLs (.mp4, .webm, etc.)
              </p>
            </div>
          </TabsContent>

          <TabsContent value="embed" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="embed-code">Embed Code</Label>
              <Textarea
                id="embed-code"
                placeholder="<iframe src='...' ...></iframe>"
                value={embedCode}
                onChange={(e) => setEmbedCode(e.target.value)}
                rows={4}
              />
              <p className="text-sm text-muted-foreground">
                Paste iframe embed code from any video platform. Scripts and unsafe content will be automatically removed.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <div className="space-y-2">
          <Label htmlFor="video-width">Video Width</Label>
          <Select value={width} onValueChange={setWidth}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="full">Full Width (100%)</SelectItem>
              <SelectItem value="three-quarters">75% Width</SelectItem>
              <SelectItem value="half">50% Width</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleInsert} disabled={!isValidToInsert()}>
            Insert Video
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};