import React, { createContext, useContext, useState, ReactNode } from 'react';

export type HoverTarget = {
  type: 'section' | 'row' | 'column' | 'element';
  id: string;
  parentId?: string;
  grandParentId?: string;
} | null;

interface HoverContextType {
  hoveredTarget: HoverTarget;
  setHoveredTarget: (target: HoverTarget) => void;
}

const HoverContext = createContext<HoverContextType | undefined>(undefined);

export const useHover = () => {
  const context = useContext(HoverContext);
  if (!context) {
    throw new Error('useHover must be used within a HoverProvider');
  }
  return context;
};

interface HoverProviderProps {
  children: ReactNode;
}

export const HoverProvider: React.FC<HoverProviderProps> = ({ children }) => {
  const [hoveredTarget, setHoveredTarget] = useState<HoverTarget>(null);

  return (
    <HoverContext.Provider value={{ hoveredTarget, setHoveredTarget }}>
      {children}
    </HoverContext.Provider>
  );
};