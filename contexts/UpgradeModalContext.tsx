import React, { createContext, useContext, useState } from 'react';
import PremiumComparisonModal from '../components/PremiumComparisonModal';

interface UpgradeModalContextType {
  openUpgradeModal: () => void;
}

const UpgradeModalContext = createContext<UpgradeModalContextType>({ openUpgradeModal: () => {} });

export const useUpgradeModal = () => useContext(UpgradeModalContext);

export const UpgradeModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <UpgradeModalContext.Provider value={{ openUpgradeModal: () => setIsOpen(true) }}>
      {children}
      <PremiumComparisonModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </UpgradeModalContext.Provider>
  );
};
