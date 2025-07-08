'use client';

import { AppSidebar, AppSidebarRef } from '@/components/app-sidebar';
import { SidebarProvider as UISidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { SidebarProvider } from '@/contexts/sidebar-context';
import { User } from '@prisma/client';
import { forwardRef, useRef } from 'react';

interface LayoutWithSidebarProps {
  children: React.ReactNode;
  user: User | null;
}

export const LayoutWithSidebar = forwardRef<AppSidebarRef, LayoutWithSidebarProps>(
  ({ children, user }, ref) => {
    const sidebarRef = useRef<AppSidebarRef>(null);

    // If no external ref is provided, use our internal ref
    const actualRef = ref || sidebarRef;

    const refreshSidebar = () => {
      if (actualRef && 'current' in actualRef && actualRef.current) {
        actualRef.current.refreshTags();
      }
    };

    return (
      <SidebarProvider refreshSidebar={refreshSidebar}>
        <UISidebarProvider>
          <div className="flex h-screen w-full">
            <AppSidebar ref={actualRef} username={user?.username || undefined} />
            <SidebarInset className="flex-1">{children}</SidebarInset>
          </div>
        </UISidebarProvider>
      </SidebarProvider>
    );
  }
);

LayoutWithSidebar.displayName = 'LayoutWithSidebar';
