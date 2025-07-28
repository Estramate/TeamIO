import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface NavigationStore {
  lastVisitedPage: string;
  setLastVisitedPage: (path: string) => void;
  getInitialRoute: () => string;
}

export const useNavigation = create<NavigationStore>()(
  persist(
    (set, get) => ({
      lastVisitedPage: '/', // Dashboard als Standard
      setLastVisitedPage: (path: string) => {
        // Nur echte Seiten speichern, keine Auth-Routen
        const isAuthRoute = ['/login', '/register', '/logout'].includes(path);
        const isRootRoute = path === '/';
        
        if (!isAuthRoute) {
          console.log('📍 Storing last visited page:', path);
          set({ lastVisitedPage: path });
        }
      },
      getInitialRoute: () => {
        const stored = get().lastVisitedPage;
        // Immer Dashboard als Standard, außer explizit andere Seite gespeichert
        return stored && stored !== '/' ? stored : '/';
      },
    }),
    {
      name: 'clubflow-navigation',
      version: 1,
    }
  )
);