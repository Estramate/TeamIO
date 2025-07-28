import React from 'react';
import { cn } from "@/lib/utils";
import { useSuperAdminStatus } from '@/components/SuperAdminBadge';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface SuperAdminNavigationProps {
  navigation: { name: string; href: string; icon: React.ComponentType<any> }[];
  location: string;
  navigate: (path: string) => void;
  onClose: () => void;
  collapsed: boolean;
}

export function SuperAdminNavigation({ navigation, location, navigate, onClose, collapsed }: SuperAdminNavigationProps) {
  const { data: superAdminStatus, isLoading } = useSuperAdminStatus();

  // Don't show super admin navigation if not a super admin
  if (isLoading || !(superAdminStatus as any)?.isSuperAdmin) {
    return null;
  }

  return (
    <div className="mt-4 pt-4 border-t border-yellow-200 dark:border-yellow-800">
      <p className={cn(
        "text-xs font-semibold text-yellow-600 dark:text-yellow-400 uppercase tracking-wider mb-2",
        collapsed ? "hidden" : "px-3"
      )}>
        Super Admin
      </p>
      <div className="space-y-1">
        {navigation.map((item) => {
          const isActive = location === item.href;
          const Icon = item.icon;
          
          const superAdminButton = (
            <button
              key={item.name}
              onClick={() => {
                navigate(item.href);
                onClose();
              }}
              className={cn(
                "w-full group flex items-center text-sm font-medium transition-all duration-200",
                collapsed 
                  ? "justify-center p-2 rounded-lg hover:bg-yellow-50 dark:hover:bg-yellow-900/20" 
                  : "px-3 py-2.5 rounded-lg hover:bg-yellow-50 dark:hover:bg-yellow-900/20",
                isActive
                  ? collapsed 
                    ? "bg-yellow-500 text-white" 
                    : "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-l-4 border-yellow-500"
                  : "text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300"
              )}
            >
              <Icon className={cn(
                "shrink-0 transition-colors",
                collapsed ? "h-5 w-5" : "h-4 w-4 mr-3"
              )} />
              {!collapsed && (
                <span className="truncate">{item.name}</span>
              )}
            </button>
          );
          
          if (collapsed) {
            return (
              <Tooltip key={item.name}>
                <TooltipTrigger asChild>
                  {superAdminButton}
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{item.name}</p>
                </TooltipContent>
              </Tooltip>
            );
          }
          
          return superAdminButton;
        })}
      </div>
    </div>
  );
}