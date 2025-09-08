import React, { createContext, useContext, useState } from 'react';

interface DevicePreviewContextType {
  deviceType: 'desktop' | 'tablet' | 'mobile';
  setDeviceType: (deviceType: 'desktop' | 'tablet' | 'mobile') => void;
}

const DevicePreviewContext = createContext<DevicePreviewContextType | undefined>(undefined);

export const DevicePreviewProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [deviceType, setDeviceType] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  return (
    <DevicePreviewContext.Provider value={{ deviceType, setDeviceType }}>
      {children}
    </DevicePreviewContext.Provider>
  );
};

export const useDevicePreview = () => {
  const context = useContext(DevicePreviewContext);
  if (context === undefined) {
    throw new Error('useDevicePreview must be used within a DevicePreviewProvider');
  }
  return context;
};