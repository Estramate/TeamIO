import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, Plus, Bell } from "lucide-react";
import MemberModal from "./member-modal";

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const [memberModalOpen, setMemberModalOpen] = useState(false);

  return (
    <>
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={onMenuClick}
            >
              <Menu className="h-4 w-4" />
            </Button>
            
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
              <p className="text-sm text-gray-500 mt-1 hidden sm:block">
                Willkommen zurück, hier ist die Übersicht für Ihren Verein
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => setMemberModalOpen(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white hidden sm:flex"
            >
              <Plus className="w-4 h-4 mr-2" />
              Mitglied hinzufügen
            </Button>
            
            <Button
              onClick={() => setMemberModalOpen(true)}
              size="sm"
              className="bg-blue-500 hover:bg-blue-600 text-white sm:hidden"
            >
              <Plus className="w-4 h-4" />
            </Button>
            
            <div className="relative">
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  3
                </span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <MemberModal 
        open={memberModalOpen} 
        onClose={() => setMemberModalOpen(false)} 
      />
    </>
  );
}
