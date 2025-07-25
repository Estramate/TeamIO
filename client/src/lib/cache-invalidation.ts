import { QueryClient } from "@tanstack/react-query";

/**
 * Zentrale Cache-Invalidierung für alle Entitäten
 * Stellt sicher, dass bei jeder CRUD-Operation alle relevanten Daten aktualisiert werden
 */
export function invalidateAllData(queryClient: QueryClient, clubId: number) {
  // Core entities
  queryClient.invalidateQueries({ queryKey: ['/api/clubs', clubId, 'dashboard'] });
  queryClient.invalidateQueries({ queryKey: ['/api/clubs', clubId, 'members'] });
  queryClient.invalidateQueries({ queryKey: ['/api/clubs', clubId, 'teams'] });
  queryClient.invalidateQueries({ queryKey: ['/api/clubs', clubId, 'players'] });
  queryClient.invalidateQueries({ queryKey: ['/api/clubs', clubId, 'facilities'] });
  queryClient.invalidateQueries({ queryKey: ['/api/clubs', clubId, 'bookings'] });
  queryClient.invalidateQueries({ queryKey: ['/api/clubs', clubId, 'events'] });
  
  // Finance entities
  queryClient.invalidateQueries({ queryKey: ['/api/clubs', clubId, 'finances'] });
  queryClient.invalidateQueries({ queryKey: ['/api/clubs', clubId, 'member-fees'] });
  queryClient.invalidateQueries({ queryKey: ['/api/clubs', clubId, 'training-fees'] });
  
  // Stats and reports (da diese von anderen Entitäten abhängen)
  queryClient.invalidateQueries({ queryKey: ['/api/clubs', clubId, 'stats'] });
  queryClient.invalidateQueries({ queryKey: ['/api/clubs', clubId, 'reports'] });
}

/**
 * Spezifische Cache-Invalidierung für eine Entität + Dashboard
 */
export function invalidateEntityData(queryClient: QueryClient, clubId: number, entity: string) {
  // Spezifische Entität
  queryClient.invalidateQueries({ queryKey: ['/api/clubs', clubId, entity] });
  
  // Dashboard (immer aktualisieren da es Zusammenfassungen zeigt)
  queryClient.invalidateQueries({ queryKey: ['/api/clubs', clubId, 'dashboard'] });
  
  // Wenn Booking-relevante Entitäten, auch Events aktualisieren
  if (['bookings', 'facilities', 'teams'].includes(entity)) {
    queryClient.invalidateQueries({ queryKey: ['/api/clubs', clubId, 'events'] });
  }
  
  // Wenn Team-relevante Entitäten, auch Player-Daten aktualisieren
  if (['teams', 'players'].includes(entity)) {
    queryClient.invalidateQueries({ queryKey: ['/api/clubs', clubId, 'teams'] });
    queryClient.invalidateQueries({ queryKey: ['/api/clubs', clubId, 'players'] });
  }
  
  // Wenn Finance-relevante Entitäten, alle Finance-Queries aktualisieren
  if (['finances', 'member-fees', 'training-fees'].includes(entity)) {
    queryClient.invalidateQueries({ queryKey: ['/api/clubs', clubId, 'finances'] });
    queryClient.invalidateQueries({ queryKey: ['/api/clubs', clubId, 'member-fees'] });
    queryClient.invalidateQueries({ queryKey: ['/api/clubs', clubId, 'training-fees'] });
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