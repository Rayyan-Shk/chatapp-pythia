"use client";

import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { ChannelSidebar } from "@/components/chat/ChannelSidebar";
import { CreateChannelDialog } from "@/components/chat/CreateChannelDialog";
import { useChatStore } from "@/lib/store/chatStore";
import { cn } from "@/lib/utils";

interface MobileLayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
}

export const MobileLayout = ({ children, showSidebar = true }: MobileLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { activeChannelId } = useChatStore();
  
  // Auto-close sidebar when channel changes on mobile
  useEffect(() => {
    setSidebarOpen(false);
  }, [activeChannelId]);

  // Close sidebar on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [sidebarOpen]);

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar - Hidden on mobile */}
      {showSidebar && (
        <div className="hidden md:block">
          <ChannelSidebar />
        </div>
      )}

      {/* Mobile Sidebar Sheet */}
      {showSidebar && (
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "fixed top-3 left-3 z-50 md:hidden",
                "h-9 w-9 p-0",
                "bg-background/80 backdrop-blur-sm border shadow-sm",
                "hover:bg-background/90"
              )}
            >
              <Menu className="h-4 w-4" />
              <span className="sr-only">Open sidebar</span>
            </Button>
          </SheetTrigger>
          
          <SheetContent 
            side="left" 
            className="p-0 w-80 sm:w-72"
            onInteractOutside={() => setSidebarOpen(false)}
          >
            {/* Close button for mobile */}
            <div className="flex justify-end p-2 md:hidden">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close sidebar</span>
              </Button>
            </div>
            
            <div className="h-full">
              <ChannelSidebar />
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header spacing when sidebar is shown */}
        {showSidebar && (
          <div className="h-12 md:hidden" />
        )}
        
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>

      {/* Global Dialogs */}
      <CreateChannelDialog />
    </div>
  );
}; 