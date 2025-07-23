import { createContext, useContext, useEffect } from "react";
import { useClub } from "@/hooks/use-club";

interface ClubWithColors {
  id: number;
  name: string;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  accentColor?: string | null;
}

interface ClubThemeContextType {
  applyClubTheme: (club: ClubWithColors) => void;
  resetTheme: () => void;
}

const ClubThemeContext = createContext<ClubThemeContextType | undefined>(undefined);

interface ClubThemeProviderProps {
  children: React.ReactNode;
}

export function ClubThemeProvider({ children }: ClubThemeProviderProps) {
  const { selectedClub } = useClub();

  const applyClubTheme = (club: ClubWithColors) => {
    const root = document.documentElement;
    
    if (club.primaryColor) {
      root.style.setProperty('--club-primary', club.primaryColor);
    }
    if (club.secondaryColor) {
      root.style.setProperty('--club-secondary', club.secondaryColor);
    }
    if (club.accentColor) {
      root.style.setProperty('--club-accent', club.accentColor);
    }
  };

  const resetTheme = () => {
    const root = document.documentElement;
    root.style.removeProperty('--club-primary');
    root.style.removeProperty('--club-secondary');
    root.style.removeProperty('--club-accent');
  };

  useEffect(() => {
    if (selectedClub) {
      applyClubTheme(selectedClub);
    } else {
      resetTheme();
    }

    return () => resetTheme();
  }, [selectedClub]);

  return (
    <ClubThemeContext.Provider value={{ applyClubTheme, resetTheme }}>
      {children}
    </ClubThemeContext.Provider>
  );
}

export function useClubTheme() {
  const context = useContext(ClubThemeContext);
  if (!context) {
    throw new Error("useClubTheme must be used within a ClubThemeProvider");
  }
  return context;
}