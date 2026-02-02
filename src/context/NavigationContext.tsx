import React, { createContext, useContext, useState, useCallback } from 'react';

export type PageType = 'dashboard' | 'settings' | 'profile' | 'help';

interface NavigationContextType {
  currentPage: PageType;
  navigateTo: (page: PageType) => void;
  goBack: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard');
  const [history, setHistory] = useState<PageType[]>(['dashboard']);

  const navigateTo = useCallback((page: PageType) => {
    setCurrentPage(page);
    setHistory(prev => [...prev, page]);
  }, []);

  const goBack = useCallback(() => {
    if (history.length > 1) {
      const newHistory = history.slice(0, -1);
      setHistory(newHistory);
      setCurrentPage(newHistory[newHistory.length - 1]);
    }
  }, [history]);

  return (
    <NavigationContext.Provider value={{ currentPage, navigateTo, goBack }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};
