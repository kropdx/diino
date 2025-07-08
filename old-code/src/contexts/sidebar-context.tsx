'use client';

import React, { createContext, useContext } from 'react';

interface SidebarContextType {
  refreshSidebar?: () => void;
}

const SidebarContext = createContext<SidebarContextType>({});

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  return context;
};

export const SidebarProvider: React.FC<{
  children: React.ReactNode;
  refreshSidebar?: () => void;
}> = ({ children, refreshSidebar }) => {
  return <SidebarContext.Provider value={{ refreshSidebar }}>{children}</SidebarContext.Provider>;
};
