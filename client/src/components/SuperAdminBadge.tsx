import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Crown, Shield } from 'lucide-react';

export function SuperAdminBadge() {
  const { data: superAdminStatus } = useQuery({
    queryKey: ['/api/subscriptions/super-admin/status'],
    enabled: true,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (!(superAdminStatus as any)?.isSuperAdmin) {
    return null;
  }

  return (
    <Badge 
      variant="outline" 
      className="bg-gradient-to-r from-yellow-100 to-yellow-200 dark:from-yellow-900/30 dark:to-yellow-800/30 border-yellow-300 dark:border-yellow-600 text-yellow-800 dark:text-yellow-200"
    >
      <Crown className="h-3 w-3 mr-1" />
      Super Admin
    </Badge>
  );
}

export function useSuperAdminStatus() {
  return useQuery({
    queryKey: ['/api/subscriptions/super-admin/status'],
    enabled: true,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}