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
    queryFn: async () => {
      try {
        const response = await fetch('/api/roles', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('🎯 useRoles API Response:', data);
        return data as Role[];
      } catch (error) {
        console.error('❌ useRoles API Error:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - roles don't change often
    retry: 3,
  });

  return {
    roles: roles || [],
    isLoading,
    error,
  };
}