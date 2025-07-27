import React, { createContext, useContext, useState, useCallback } from 'react';

interface TemplateContextType {
  insertTemplateText: (text: string) => void;
  onTemplateInsert: (callback: (text: string) => void) => void;
  removeTemplateInsertListener: () => void;
}

const TemplateContext = createContext<TemplateContextType | undefined>(undefined);

export const TemplateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [insertCallback, setInsertCallback] = useState<((text: string) => void) | null>(null);

  const insertTemplateText = useCallback((text: string) => {
    if (insertCallback) {
      insertCallback(text);
    }
  }, [insertCallback]);

  const onTemplateInsert = useCallback((callback: (text: string) => void) => {
    setInsertCallback(() => callback);
  }, []);

  const removeTemplateInsertListener = useCallback(() => {
    setInsertCallback(null);
  }, []);

  return (
    <TemplateContext.Provider value={{
      insertTemplateText,
      onTemplateInsert,
      removeTemplateInsertListener
    }}>
      {children}
    </TemplateContext.Provider>
  );
};

export const useTemplateContext = () => {
  const context = useContext(TemplateContext);
  if (context === undefined) {
    throw new Error('useTemplateContext must be used within a TemplateProvider');
  }
  return context;
}; 