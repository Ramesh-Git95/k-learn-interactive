import React, { createContext, useContext } from 'react';
import useSRS from '../hooks/useSRS';
import type { UseSRSReturn } from '../hooks/useSRS';

const SRSContext = createContext<UseSRSReturn | null>(null);

export function SRSProvider({ children }: { children: React.ReactNode }) {
  const srs = useSRS();
  return <SRSContext.Provider value={srs}>{children}</SRSContext.Provider>;
}

export function useSRSContext(): UseSRSReturn {
  const ctx = useContext(SRSContext);
  if (!ctx) throw new Error('useSRSContext must be used within SRSProvider');
  return ctx;
}
