import { useState, useEffect, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'critical';
export type NotificationType = 'info' | 'success' | 'warning' | 'error';

interface NotificationOptions {
  title: string;
  message: string;
  type?: NotificationType;
  priority?: NotificationPriority;
  persistent?: boolean;
  playSound?: boolean;
  showDesktop?: boolean;
  actionUrl?: string;
  actionLabel?: string;
}

interface NotificationSound {
  name: string;
  file: string;
  volume: number;
}

const NOTIFICATION_SOUNDS: Record<NotificationPriority, NotificationSound> = {
  low: { name: 'Subtle', file: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmceBS196+rCZyMFl2+z7lFaEgAb', volume: 0.3 },
  normal: { name: 'Gentle', file: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmceBS196+rCZyMF', volume: 0.5 },
  high: { name: 'Alert', file: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmceBS196+rCZyMF', volume: 0.7 },
  critical: { name: 'Critical', file: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmceBS196+rCZyMF', volume: 1.0 }
};

export function useNotifications() {
  const [isDesktopSupported, setIsDesktopSupported] = useState(false);
  const [desktopPermission, setDesktopPermission] = useState<NotificationPermission>('default');
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [activeNotifications, setActiveNotifications] = useState<Notification[]>([]);

  // Initialize desktop notification support
  useEffect(() => {
    const checkDesktopSupport = () => {
      if ('Notification' in window) {
        setIsDesktopSupported(true);
        setDesktopPermission(Notification.permission);
      }
    };

    checkDesktopSupport();
  }, []);

  // Request desktop notification permission
  const requestDesktopPermission = useCallback(async () => {
    if (!isDesktopSupported) return false;

    try {
      const permission = await Notification.requestPermission();
      setDesktopPermission(permission);
      return permission === 'granted';
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return false;
    }
  }, [isDesktopSupported]);

  // Play notification sound - KOMPLETT DEAKTIVIERT auf Benutzerwunsch
  const playSound = useCallback((priority: NotificationPriority) => {
    // SOUND KOMPLETT DEAKTIVIERT - "scheußlicher ton bei den push notifications entfernen"
    // Nur noch visuelle Benachrichtigungen ohne störende Töne
    return;
  }, []);

  // Show desktop notification
  const showDesktopNotification = useCallback((options: NotificationOptions) => {
    if (!isDesktopSupported || desktopPermission !== 'granted') return null;

    try {
      const notification = new Notification(options.title, {
        body: options.message,
        icon: '/favicon-96x96.png',
        badge: '/favicon-96x96.png',
        tag: `clubflow-${Date.now()}`,
        requireInteraction: options.priority === 'critical',
        silent: !options.playSound
      });

      // Handle notification click
      notification.onclick = () => {
        window.focus();
        if (options.actionUrl) {
          window.location.href = options.actionUrl;
        }
        notification.close();
      };

      // Auto-close after delay based on priority
      const autoCloseDelay = {
        low: 3000,
        normal: 5000,
        high: 8000,
        critical: 0 // Never auto-close critical notifications
      };

      const delay = autoCloseDelay[options.priority || 'normal'];
      if (delay > 0) {
        setTimeout(() => {
          notification.close();
        }, delay);
      }

      setActiveNotifications(prev => [...prev, notification]);

      return notification;
    } catch (error) {
      console.error('Failed to show desktop notification:', error);
      return null;
    }
  }, [isDesktopSupported, desktopPermission]);

  // Show toast notification with enhanced styling
  const showToastNotification = useCallback((options: NotificationOptions) => {
    toast({
      title: options.title,
      description: options.message,
      duration: options.persistent ? 0 : {
        low: 3000,
        normal: 5000,
        high: 8000,
        critical: 10000
      }[options.priority || 'normal'],
      variant: {
        info: 'default',
        success: 'default',
        warning: 'destructive',
        error: 'destructive'
      }[options.type || 'info'] as 'default' | 'destructive'
    });
  }, []);

  // Main notification function
  const showNotification = useCallback((options: NotificationOptions) => {
    const {
      priority = 'normal',
      playSound: shouldPlaySound = true,
      showDesktop = true
    } = options;

    // Play sound if enabled
    if (shouldPlaySound) {
      playSound(priority);
    }

    // Show desktop notification if supported and enabled
    if (showDesktop && desktopPermission === 'granted') {
      showDesktopNotification(options);
    }

    // Always show toast notification as fallback
    showToastNotification(options);
  }, [playSound, showDesktopNotification, showToastNotification, desktopPermission]);

  // Convenience methods for different notification types
  const showInfo = useCallback((title: string, message: string, options?: Partial<NotificationOptions>) => {
    showNotification({ title, message, type: 'info', ...options });
  }, [showNotification]);

  const showSuccess = useCallback((title: string, message: string, options?: Partial<NotificationOptions>) => {
    showNotification({ title, message, type: 'success', priority: 'normal', ...options });
  }, [showNotification]);

  const showWarning = useCallback((title: string, message: string, options?: Partial<NotificationOptions>) => {
    showNotification({ title, message, type: 'warning', priority: 'high', ...options });
  }, [showNotification]);

  const showError = useCallback((title: string, message: string, options?: Partial<NotificationOptions>) => {
    showNotification({ title, message, type: 'error', priority: 'critical', ...options });
  }, [showNotification]);

  // Clear all active notifications
  const clearAllNotifications = useCallback(() => {
    activeNotifications.forEach(notification => {
      notification.close();
    });
    setActiveNotifications([]);
  }, [activeNotifications]);

  // Toggle sound
  const toggleSound = useCallback(() => {
    setIsSoundEnabled(prev => !prev);
  }, []);

  return {
    // Core methods
    showNotification,
    showInfo,
    showSuccess,
    showWarning,
    showError,
    
    // Permission handling
    requestDesktopPermission,
    
    // Settings
    toggleSound,
    clearAllNotifications,
    
    // State
    isDesktopSupported,
    desktopPermission,
    isSoundEnabled,
    activeNotifications: activeNotifications.length
  };
}

// Context for app-wide notification settings
export const NotificationContext = {
  // Default notification preferences per event type
  preferences: {
    newMessage: { priority: 'normal' as NotificationPriority, playSound: true, showDesktop: true },
    newAnnouncement: { priority: 'high' as NotificationPriority, playSound: true, showDesktop: true },
    eventReminder: { priority: 'high' as NotificationPriority, playSound: true, showDesktop: true },
    paymentDue: { priority: 'critical' as NotificationPriority, playSound: true, showDesktop: true },
    systemAlert: { priority: 'critical' as NotificationPriority, playSound: true, showDesktop: true }
  }
};