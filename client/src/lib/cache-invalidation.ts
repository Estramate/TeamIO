import { QueryClient } from "@tanstack/react-query";

/**
 * OPTIMIERTE Cache-Invalidierung - nur das Nötigste aktualisieren
 * Deutlich reduziert für bessere Performance
 */
export function invalidateAllData(queryClient: QueryClient, clubId: number) {
  // Nur Dashboard aktualisieren - alle anderen werden bei Bedarf geladen
  queryClient.invalidateQueries({ queryKey: ['/api/clubs', clubId, 'dashboard'] });
}

/**
 * OPTIMIERTE Entity-Cache-Invalidierung - nur direkt betroffene Daten
 */
export function invalidateEntityData(queryClient: QueryClient, clubId: number, entity: string) {
  // Nur die spezifische Entität invalidieren
  queryClient.invalidateQueries({ queryKey: ['/api/clubs', clubId, entity] });
  
  // Dashboard nur bei wichtigen Änderungen
  if (['members', 'teams', 'finances'].includes(entity)) {
    queryClient.invalidateQueries({ queryKey: ['/api/clubs', clubId, 'dashboard'] });
  }
}

/**
 * Invalidierung für Cross-Entity Operationen (z.B. Player-Team Zuordnungen)
 */
export function invalidateCrossEntityData(queryClient: QueryClient, clubId: number, entities: string[]) {
  entities.forEach(entity => {
    invalidateEntityData(queryClient, clubId, entity);
  });
}