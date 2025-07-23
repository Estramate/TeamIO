import { createContext, useContext, useState, ReactNode } from "react";

interface PageContextType {
  title: string;
  subtitle?: string;
  setPage: (title: string, subtitle?: string) => void;
}

const PageContext = createContext<PageContextType | undefined>(undefined);

export function PageProvider({ children }: { children: ReactNode }) {
  const [title, setTitle] = useState("Dashboard");
  const [subtitle, setSubtitle] = useState<string | undefined>("Willkommen zurück, hier ist die Übersicht für Ihren Verein");

  const setPage = (newTitle: string, newSubtitle?: string) => {
    setTitle(newTitle);
    setSubtitle(newSubtitle);
  };

  return (
    <PageContext.Provider value={{ title, subtitle, setPage }}>
      {children}
    </PageContext.Provider>
  );
}

export function usePage() {
  const context = useContext(PageContext);
  if (context === undefined) {
    throw new Error("usePage must be used within a PageProvider");
  }
  return context;
}