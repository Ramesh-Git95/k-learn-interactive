import React, { createContext, useContext, useEffect, useState } from 'react';
import PremiumComparisonModal from '../components/PremiumComparisonModal';
import { UPGRADE_MODAL_EVENT } from '../hooks/useUpgrade';

interface UpgradeModalContextType {
  openUpgradeModal: () => void;
}

const UpgradeModalContext = createContext<UpgradeModalContextType>({ openUpgradeModal: () => {} });

export const useUpgradeModal = () => useContext(UpgradeModalContext);

export const UpgradeModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Every premium button in the app raises this through useUpgrade, so they all
  // land on the same paywall rather than some of them jumping to Stripe.
  useEffect(() => {
    const open = () => setIsOpen(true);
    window.addEventListener(UPGRADE_MODAL_EVENT, open);
    return () => window.removeEventListener(UPGRADE_MODAL_EVENT, open);
  }, []);

  return (
    <UpgradeModalContext.Provider value={{ openUpgradeModal: () => setIsOpen(true) }}>
      {children}
      <PremiumComparisonModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </UpgradeModalContext.Provider>
  );
};
