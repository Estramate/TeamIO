import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Club {
  id: number;
  name: string;
  role: string;
  status: string;
}

interface ClubStore {
  selectedClub: Club | null;
  setSelectedClub: (club: Club | null) => void;
}

export const useClub = create<ClubStore>()(
  persist(
    (set) => ({
      selectedClub: null,
      setSelectedClub: (club) => set({ selectedClub: club }),
    }),
    {
      name: 'teamio-selected-club',
    }
  )
);
