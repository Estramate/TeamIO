import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ClubStore {
  selectedClub: number | null;
  setSelectedClub: (clubId: number | null) => void;
}

export const useClubStore = create<ClubStore>()(
  persist(
    (set) => ({
      selectedClub: null,
      setSelectedClub: (clubId) => set({ selectedClub: clubId }),
    }),
    {
      name: 'club-store',
    }
  )
);