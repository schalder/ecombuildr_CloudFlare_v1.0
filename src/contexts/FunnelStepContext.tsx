import React, { createContext, useContext } from 'react';

interface FunnelStepContextType {
  stepId: string | null;
  funnelId: string | null;
}

const FunnelStepContext = createContext<FunnelStepContextType>({
  stepId: null,
  funnelId: null,
});

export const useFunnelStepContext = () => {
  return useContext(FunnelStepContext);
};

interface FunnelStepProviderProps {
  stepId: string | null;
  funnelId: string | null;
  children: React.ReactNode;
}

export const FunnelStepProvider: React.FC<FunnelStepProviderProps> = ({
  stepId,
  funnelId,
  children,
}) => {
  return (
    <FunnelStepContext.Provider value={{ stepId, funnelId }}>
      {children}
    </FunnelStepContext.Provider>
  );
};