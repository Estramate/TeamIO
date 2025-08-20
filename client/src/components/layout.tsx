import { useState } from "react";
import { useLocation } from "wouter";
import Sidebar from "./sidebar";
import Header from "./header";
import { FloatingHelpAssistant, useFloatingHelp } from "@/components/ui/floating-help";
import { getHelpByCategory } from "@/lib/help-content";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location] = useLocation();
  const helpSystem = useFloatingHelp();
  
  // Determine current page for contextual help
  const getCurrentPage = () => {
    if (location.includes('/members')) return 'members';
    if (location.includes('/teams')) return 'teams';
    if (location.includes('/finance')) return 'finance';
    if (location.includes('/bookings')) return 'bookings';
    if (location.includes('/settings')) return 'settings';
    return 'dashboard';
  };

  // Check if current page has help content
  const currentPage = getCurrentPage();
  const hasHelpContent = getHelpByCategory(currentPage).length > 0;

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
      
      {/* Floating Help Assistant - only show if page has help content */}
      {hasHelpContent && (
        <FloatingHelpAssistant
          isOpen={helpSystem.isOpen}
          onToggle={helpSystem.toggle}
          currentPage={currentPage}
        />
      )}
    </div>
  );
}
