import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, File, Link, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface DigitalFile {
  id: string;
  name: string;
  url: string;
  type: 'upload' | 'url';
  size?: number;
}

interface DigitalFileUploadProps {
  files: DigitalFile[];
  onChange: (files: DigitalFile[]) => void;
  label?: string;
}

const ALLOWED_FILE_TYPES = {
  'application/pdf': '.pdf',
  'image/jpeg': '.jpg,.jpeg',
  'image/png': '.png',
  'image/gif': '.gif',
  'text/plain': '.txt',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/zip': '.zip',
  'application/x-rar-compressed': '.rar',
  'application/vnd.ms-excel': '.xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
  'application/vnd.ms-powerpoint': '.ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx'
};

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export const DigitalFileUpload: React.FC<DigitalFileUploadProps> = ({
  files,
  onChange,
  label = "Digital Files"
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [urlName, setUrlName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFile = async (file: File) => {
    // Check file type
    if (!Object.keys(ALLOWED_FILE_TYPES).includes(file.type)) {
      toast({
        title: "File type not allowed",
        description: "Please upload PDF, images (JPG, PNG, GIF), documents (DOC, DOCX), spreadsheets (XLS, XLSX), presentations (PPT, PPTX), text files, ZIP, or RAR files.",
        variant: "destructive"
      });
      return;
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "File too large",
        description: "Please select a file smaller than 50MB",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upload to digital-products bucket
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('digital-products')
        .upload(`${user.id}/${fileName}`, file);

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('digital-products')
        .getPublicUrl(`${user.id}/${fileName}`);

      const newFile: DigitalFile = {
        id: Date.now().toString(),
        name: file.name,
        url: publicUrl,
        type: 'upload',
        size: file.size
      };

      onChange([...files, newFile]);
      
      toast({
        title: "File uploaded",
        description: "Your digital file has been uploaded successfully"
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload file. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles && droppedFiles[0]) {
      handleFile(droppedFiles[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles[0]) {
      handleFile(selectedFiles[0]);
    }
  };

  const addUrlFile = () => {
    if (!urlInput.trim() || !urlName.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide both file name and URL",
        variant: "destructive"
      });
      return;
    }

    try {
      new URL(urlInput); // Validate URL
    } catch {
      toast({
        title: "Invalid URL",
        description: "Please provide a valid URL",
        variant: "destructive"
      });
      return;
    }

    const newFile: DigitalFile = {
      id: Date.now().toString(),
      name: urlName.trim(),
      url: urlInput.trim(),
      type: 'url'
    };

    onChange([...files, newFile]);
    setUrlInput('');
    setUrlName('');
    
    toast({
      title: "URL added",
      description: "Download URL has been added successfully"
    });
  };

  const removeFile = (fileId: string) => {
    onChange(files.filter(f => f.id !== fileId));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const acceptedTypes = Object.values(ALLOWED_FILE_TYPES).join(',');

  return (
    <div className="space-y-4">
      <Label>{label}</Label>
      
      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">Upload Files</TabsTrigger>
          <TabsTrigger value="url">Add URLs</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload" className="space-y-4">
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-muted-foreground/50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <File className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Drag and drop files here, or click to select
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <Upload className="w-4 h-4 mr-2" />
                {isUploading ? 'Uploading...' : 'Choose Files'}
              </Button>
            </div>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedTypes}
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <p className="text-xs text-muted-foreground">
            Maximum file size: 50MB. Supported formats: PDF, JPG, PNG, GIF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, ZIP, RAR
          </p>
        </TabsContent>
        
        <TabsContent value="url" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="fileName">File Name</Label>
              <Input
                id="fileName"
                placeholder="e.g., User Manual.pdf"
                value={urlName}
                onChange={(e) => setUrlName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="fileUrl">Download URL</Label>
              <Input
                id="fileUrl"
                placeholder="https://example.com/file.pdf"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
              />
            </div>
            <Button
              type="button"
              onClick={addUrlFile}
              disabled={!urlInput.trim() || !urlName.trim()}
            >
              <Link className="w-4 h-4 mr-2" />
              Add URL
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {files.length > 0 && (
        <div className="space-y-2">
          <Label>Added Files ({files.length})</Label>
          {files.map((file) => (
            <Card key={file.id}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <File className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {file.type === 'upload' ? (
                          file.size ? `Uploaded • ${formatFileSize(file.size)}` : 'Uploaded'
                        ) : (
                          'External URL'
                        )}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(file.id)}
                  >
                    <X className="w-4 h-4" />
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