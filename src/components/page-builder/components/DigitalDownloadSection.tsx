import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface DigitalDownloadSectionProps {
  downloadLinks: any[];
  orderId: string;
  orderToken: string;
}

export const DigitalDownloadSection: React.FC<DigitalDownloadSectionProps> = ({
  downloadLinks,
  orderId,
  orderToken
}) => {
  const handleDownloadFile = async (filePath: string, fileName: string) => {
    try {
      const response = await fetch(
        `https://fhqwacmokbtbspkxjixf.supabase.co/functions/v1/download-digital-file?orderId=${orderId}&filePath=${encodeURIComponent(filePath)}&token=${orderToken}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZocXdhY21va2J0YnNwa3hqaXhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2MjYyMzUsImV4cCI6MjA2OTIwMjIzNX0.BaqDCDcynSahyDxEUIyZLLtyXpd959y5Tv6t6tIF3GM`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to download file');
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('File downloaded successfully');
    } catch (error: any) {
      console.error('Download error:', error);
      toast.error(error.message || 'Failed to download file');
    }
  };

  if (!downloadLinks || downloadLinks.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border">
      <div className="p-4 border-b">
        <h3 className="font-semibold flex items-center gap-2">
          <Download className="h-5 w-5" />
          Digital Downloads
        </h3>
      </div>
      <div className="p-4 space-y-3">
        {downloadLinks.map((link: any) => {
          const fileName = link.digital_file_path.split('/').pop() || 'download';
          const isExpired = new Date(link.expires_at) < new Date();
          const isLimitReached = link.download_count >= link.max_downloads;
          const canDownload = !isExpired && !isLimitReached;
          
          return (
            <div key={link.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium">{fileName}</p>
                  <p className="text-sm text-muted-foreground">
                    Downloads: {link.download_count}/{link.max_downloads} | 
                    Expires: {new Date(link.expires_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => handleDownloadFile(link.digital_file_path, fileName)}
                disabled={!canDownload}
                variant={canDownload ? "default" : "secondary"}
              >
                {isExpired ? 'Expired' : isLimitReached ? 'Limit Reached' : 'Download'}
              </Button>
            </div>
          );
        })}
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-sm text-blue-700">
            💡 Save these files to your device. Download links expire after the specified time period.
          </p>
        </div>
      </div>
    </div>
  );
};