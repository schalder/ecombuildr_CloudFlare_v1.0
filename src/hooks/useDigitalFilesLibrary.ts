import { useState, useEffect } from 'react';

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
      // For now, return empty array. This will be populated when we have actual data
      // In a real implementation, you would fetch from your backend
      setFiles([]);
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