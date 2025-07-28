import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { queryClient } from '@/lib/queryClient';

interface Club {
  id: number;
  name: string;
  shortName?: string;
  logoUrl?: string;
  role: string;
  status: string;
}

interface ClubStore {
  selectedClub: Club | null;
  setSelectedClub: (club: Club | null) => void;
}

export const useClub = create<ClubStore>()(
  persist(
    (set, get) => ({
      selectedClub: null,
      setSelectedClub: (club) => {
        console.log('Setting selected club:', club);
        
        // Invalidate all subscription-related queries when club changes
        if (club?.id !== get().selectedClub?.id) {
          queryClient.invalidateQueries({ 
            queryKey: ['/api/subscriptions/club'] 
          });
          queryClient.invalidateQueries({ 
            queryKey: ['/api/subscriptions/usage'] 
          });
          queryClient.invalidateQueries({ 
            queryKey: ['/api/subscriptions/super-admin'] 
          });
          console.log('🔄 SUBSCRIPTION CACHE INVALIDATED: Cleared all subscription data for new club');
        }
        
        set({ selectedClub: club });
      },
    }),
    {
      name: 'clubflow-selected-club',
      version: 3, // Increment version to include shortName field
      migrate: (persistedState: any, version: number) => {
        // Clear old state on version change to include new fields
        if (version < 3) {
          return { selectedClub: null };
        }
        return persistedState;
      },
    }
  )
);
