import { useState } from "react";
import Sidebar from "./sidebar";
import Header from "./header";
// ENTFERNT - LiveChatWidget komplett aus System entfernt

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
      
      {/* LIVE CHAT WIDGET ENTFERNT - Vollständige System-Bereinigung */}
    </div>
  );
}
