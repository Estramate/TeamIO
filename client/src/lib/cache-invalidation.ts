import { QueryClient } from "@tanstack/react-query";

/**
 * INTELLIGENTE Cache-Invalidierung - Balance zwischen Performance und Aktualität
 */
export function invalidateAllData(queryClient: QueryClient, clubId: number) {
  // Dashboard immer aktualisieren (zeigt Übersicht)
  queryClient.invalidateQueries({ queryKey: ['/api/clubs', clubId, 'dashboard'] });
  
  // Communication-Daten auch aktualisieren für Benutzerfreundlichkeit
  queryClient.invalidateQueries({ queryKey: ['/api/clubs', clubId, 'communication-stats'] });
  queryClient.invalidateQueries({ queryKey: ['/api/clubs', clubId, 'notifications'] });
}

/**
 * BENUTZERFREUNDLICHE Entity-Cache-Invalidierung
 */
export function invalidateEntityData(queryClient: QueryClient, clubId: number, entity: string) {
  // Spezifische Entität immer invalidieren
  queryClient.invalidateQueries({ queryKey: ['/api/clubs', clubId, entity] });
  
  // Dashboard bei wichtigen Änderungen
  if (['members', 'teams', 'finances', 'bookings', 'events'].includes(entity)) {
    queryClient.invalidateQueries({ queryKey: ['/api/clubs', clubId, 'dashboard'] });
  }
  
  // Communication-bezogene Updates
  if (['messages', 'announcements'].includes(entity)) {
    queryClient.invalidateQueries({ queryKey: ['/api/clubs', clubId, 'communication-stats'] });
    queryClient.invalidateQueries({ queryKey: ['/api/clubs', clubId, 'notifications'] });
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