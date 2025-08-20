// ClubFlow Debug Configuration
// Zentrale Konfiguration für Debug-Logs in der gesamten Anwendung
// Setzen Sie die entsprechenden Flags auf true, um Debug-Logs zu aktivieren

export const DEBUG_CONFIG = {
  // API & Backend
  API_REQUESTS: false,          // API Request/Response Logs
  CACHE_OPERATIONS: false,      // Cache Invalidierung und Refetch Logs
  DATABASE_QUERIES: false,      // Datenbank Query Logs
  AUTH_FLOW: false,            // Authentication Flow Logs
  
  // Frontend Components
  TIMELINE_CALCULATIONS: false, // Calendar Timeline Berechnungen
  FORM_SUBMISSIONS: false,      // Form Submit und Validation Logs
  COMPONENT_RENDERS: false,     // React Component Render Logs
  STATE_CHANGES: false,         // Zustand Änderungen (Zustand, Club Selection)
  
  // Business Logic
  BOOKING_OPERATIONS: false,    // Buchung Create/Update/Delete Operations
  NOTIFICATION_SYSTEM: false,   // Notification Trigger und Delivery Logs
  SUBSCRIPTION_CHECKS: false,   // Subscription Status und Limit Checks
  
  // Performance
  PERFORMANCE_METRICS: false,   // Performance Messung und Timing
  MEMORY_USAGE: false,         // Memory Usage Tracking
  
  // Development
  DEVELOPMENT_ONLY: process.env.NODE_ENV === 'development', // Nur in Development Mode
} as const;

// Helper function für conditional logging
export const debugLog = (category: keyof typeof DEBUG_CONFIG, message: string, data?: any) => {
  if (DEBUG_CONFIG[category] && DEBUG_CONFIG.DEVELOPMENT_ONLY) {
    console.log(`[DEBUG:${category}] ${message}`, data ? data : '');
  }
};

// Helper für API Request Logging
export const logApiRequest = (method: string, url: string, data?: any) => {
  debugLog('API_REQUESTS', `${method} ${url}`, data);
};

// Helper für Cache Operations
export const logCacheOperation = (operation: string, queryKey: any, additional?: string) => {
  debugLog('CACHE_OPERATIONS', `${operation} - QueryKey: ${JSON.stringify(queryKey)} ${additional || ''}`);
};

// Helper für Timeline Calculations
export const logTimelineCalculation = (eventTitle: string, calculations: any) => {
  debugLog('TIMELINE_CALCULATIONS', `Timeline calculation for: ${eventTitle}`, calculations);
};

// Helper für Form Operations
export const logFormOperation = (formType: string, operation: string, data?: any) => {
  debugLog('FORM_SUBMISSIONS', `${formType} - ${operation}`, data);
};