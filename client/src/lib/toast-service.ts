/**
 * Centralized Toast Notification Service
 * Replaces all console.log, alert(), and other notification methods
 * with unified toast notifications
 */

import { toast as useToastHook } from "@/hooks/use-toast";

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastOptions {
  title: string;
  description?: string;
  duration?: number;
  action?: React.ReactNode;
}

class ToastService {
  // Success notifications (green)
  success(title: string, description?: string, duration = 5000) {
    useToastHook({
      title: String(title || ''),
      description: description ? String(description) : undefined,
      duration,
      className: "border-green-200 bg-green-50 text-green-900",
    });
  }

  // Error notifications (red)
  error(title: string, description?: string, duration = 8000) {
    useToastHook({
      title: String(title || ''),
      description: description ? String(description) : undefined,
      duration,
      variant: "destructive",
    });
  }

  // Warning notifications (yellow)
  warning(title: string, description?: string, duration = 6000) {
    useToastHook({
      title: String(title || ''),
      description: description ? String(description) : undefined,
      duration,
      className: "border-yellow-200 bg-yellow-50 text-yellow-900",
    });
  }

  // Info notifications (blue)
  info(title: string, description?: string, duration = 5000) {
    useToastHook({
      title: String(title || ''),
      description: description ? String(description) : undefined,
      duration,
      className: "border-blue-200 bg-blue-50 text-blue-900",
    });
  }

  // Loading notifications
  loading(title: string, description?: string) {
    useToastHook({
      title: String(title || ''),
      description: description ? String(description) : undefined,
      duration: 10000, // Longer duration for loading
      className: "border-gray-200 bg-gray-50 text-gray-900",
    });
  }

  // Replace console.log with info toast (development only)
  log(message: string, data?: any) {
    if (process.env.NODE_ENV === 'development') {
      this.info("Debug", `${message}${data ? ` - ${JSON.stringify(data).slice(0, 100)}` : ''}`);
    }
  }

  // Replace console.error with error toast
  logError(message: string, error?: any) {
    this.error(
      "Fehler",
      `${message}${error ? ` - ${error.message || error}` : ''}`,
      10000
    );
  }

  // Replace console.warn with warning toast
  logWarning(message: string, data?: any) {
    this.warning(
      "Warnung",
      `${message}${data ? ` - ${JSON.stringify(data).slice(0, 100)}` : ''}`,
      7000
    );
  }

  // Database operation notifications
  database = {
    created: (entity: string) => this.success("Erstellt", `${entity} wurde erfolgreich erstellt`),
    updated: (entity: string) => this.success("Aktualisiert", `${entity} wurde erfolgreich aktualisiert`),
    deleted: (entity: string) => this.success("Gelöscht", `${entity} wurde erfolgreich gelöscht`),
    error: (operation: string, entity: string) => this.error("Datenbankfehler", `${operation} von ${entity} fehlgeschlagen`),
  };

  // Authentication notifications
  auth = {
    loginSuccess: () => this.success("Anmeldung erfolgreich", "Willkommen zurück!"),
    loginError: (error?: string) => this.error("Anmeldung fehlgeschlagen", error || "Bitte versuchen Sie es erneut"),
    logoutSuccess: () => this.success("Abmeldung erfolgreich", "Auf Wiedersehen!"),
    sessionExpired: () => this.warning("Sitzung abgelaufen", "Bitte melden Sie sich erneut an"),
  };

  // Form notifications
  form = {
    success: (action: string) => this.success("Erfolgreich", `${action} wurde erfolgreich abgeschlossen`),
    validationError: () => this.error("Eingabefehler", "Bitte überprüfen Sie Ihre Eingaben"),
    saveError: () => this.error("Speichern fehlgeschlagen", "Bitte versuchen Sie es erneut"),
  };

  // Network notifications
  network = {
    offline: () => this.warning("Offline", "Keine Internetverbindung"),
    online: () => this.success("Online", "Internetverbindung wiederhergestellt"),
    connectionError: () => this.error("Verbindungsfehler", "Server nicht erreichbar"),
  };
}

// Export singleton instance
export const toastService = new ToastService();

// Convenience exports
export const { success, error, warning, info, loading, log, logError, logWarning } = toastService;

// Replace console methods (development helper)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Store original console methods
  const originalConsole = {
    log: console.log,
    error: console.error,
    warn: console.warn,
  };

  // Override console methods to use toasts (optional, can be toggled)
  const ENABLE_TOAST_CONSOLE = false; // Set to true to redirect console to toasts

  if (ENABLE_TOAST_CONSOLE) {
    console.log = (...args) => {
      originalConsole.log(...args);
      toastService.log(args.join(' '));
    };

    console.error = (...args) => {
      originalConsole.error(...args);
      toastService.logError(args.join(' '));
    };

    console.warn = (...args) => {
      originalConsole.warn(...args);
      toastService.logWarning(args.join(' '));
    };
  }
}