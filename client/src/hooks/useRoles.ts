import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export interface Role {
  id: number;
  name: string;
  displayName: string;
  description?: string | null;
  permissions?: any;
  isActive?: boolean;
  sortOrder?: number;
}

export function useRoles() {
  const { data: roles, isLoading, error } = useQuery<Role[]>({
    queryKey: ['/api/roles'],
    queryFn: () => apiRequest('GET', '/api/roles'),
    staleTime: 5 * 60 * 1000, // 5 minutes - roles don't change often
  });

  return {
    roles: roles || [],
    isLoading,
    error,
  };
}