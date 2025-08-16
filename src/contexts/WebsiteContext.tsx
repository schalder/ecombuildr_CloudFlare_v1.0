import React, { createContext, useContext, ReactNode } from 'react';

interface WebsiteContextValue {
  websiteId?: string;
  websiteSlug?: string;
}

const WebsiteContext = createContext<WebsiteContextValue | undefined>(undefined);

interface WebsiteProviderProps {
  children: ReactNode;
  websiteId?: string;
  websiteSlug?: string;
}

export const WebsiteProvider: React.FC<WebsiteProviderProps> = ({ 
  children, 
  websiteId, 
  websiteSlug 
}) => {
  const value: WebsiteContextValue = {
    websiteId,
    websiteSlug
  };

  return (
    <WebsiteContext.Provider value={value}>
      {children}
    </WebsiteContext.Provider>
  );
};

export const useWebsiteContext = (): WebsiteContextValue => {
  const context = useContext(WebsiteContext);
  return context || {};
};