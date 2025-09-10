import React from 'react';
import { PageBuilderElement } from '@/components/page-builder/types';
import { AlertTriangle, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SafeModeRendererProps {
  element: PageBuilderElement;
  deviceType?: 'desktop' | 'tablet' | 'mobile';
}

export const SafeModeRenderer: React.FC<SafeModeRendererProps> = ({ element, deviceType = 'desktop' }) => {
  const [showDetails, setShowDetails] = React.useState(false);

  return (
    <div className="p-3 border border-yellow-300 bg-yellow-50 rounded-lg text-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <span className="font-semibold text-yellow-800">Safe Mode</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDetails(!showDetails)}
          className="h-6 px-2 text-yellow-700 hover:bg-yellow-100"
        >
          <Eye className="h-3 w-3 mr-1" />
          {showDetails ? 'Hide' : 'Show'}
        </Button>
      </div>
      
      <div className="text-yellow-700">
        Element "{element.type}" is in safe mode due to potential issues
      </div>
      
      {showDetails && (
        <div className="mt-3 p-2 bg-yellow-100 rounded text-xs">
          <div><strong>Element ID:</strong> {element.id}</div>
          <div><strong>Element Type:</strong> {element.type}</div>
          <div><strong>Device Type:</strong> {deviceType}</div>
          <div><strong>Content Preview:</strong></div>
          <pre className="mt-1 text-xs bg-white p-2 rounded max-h-20 overflow-auto">
            {JSON.stringify(element.content, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};