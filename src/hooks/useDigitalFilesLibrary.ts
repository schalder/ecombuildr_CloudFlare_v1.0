import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface LibraryDigitalFile {
  id: string;
  name: string;
  url: string;
  size?: number;
  type: string;
  productName: string;
  productId: string;
  createdAt: string;
}

export const useDigitalFilesLibrary = (storeId?: string) => {
  const [files, setFiles] = useState<LibraryDigitalFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchLibraryFiles = async () => {
    if (!storeId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_digital_files_library', {
        store_id_param: storeId
      });

      if (error) throw error;

      const libraryFiles: LibraryDigitalFile[] = (data || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        url: item.url,
        size: item.size,
        type: item.type,
        productName: item.product_name,
        productId: item.product_id,
        createdAt: item.created_at
      }));

      // Remove duplicates based on URL
      const uniqueFiles = libraryFiles.filter((file, index, self) => 
        index === self.findIndex(f => f.url === file.url)
      );

      setFiles(uniqueFiles);
    } catch (error) {
      console.error('Error fetching library files:', error);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLibraryFiles();
  }, [storeId]);

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    file.productName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return {
    files: filteredFiles,
    loading,
    searchTerm,
    setSearchTerm,
    refetch: fetchLibraryFiles
  };
};