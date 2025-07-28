import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
