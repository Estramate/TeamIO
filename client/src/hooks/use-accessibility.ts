/**
 * Accessibility hooks for WCAG 2.1 AA compliance
 * Provides keyboard navigation, focus management, and screen reader support
 */

import { useEffect, useRef, useCallback } from 'react';
import React from 'react';

/**
 * Hook for managing focus trap within a modal or dialog
 */
export const useFocusTrap = (isActive: boolean) => {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus();
          e.preventDefault();
        }
      }
    };

    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        container.dispatchEvent(new CustomEvent('escape-key'));
      }
    };

    document.addEventListener('keydown', handleTabKey);
    document.addEventListener('keydown', handleEscapeKey);
    
    // Focus first element when trap activates
    firstElement?.focus();

    return () => {
      document.removeEventListener('keydown', handleTabKey);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isActive]);

  return containerRef;
};

/**
 * Hook for announcing content changes to screen readers
 */
export const useScreenReaderAnnouncement = () => {
  const announceRef = useRef<HTMLDivElement>(null);

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!announceRef.current) return;

    announceRef.current.setAttribute('aria-live', priority);
    announceRef.current.textContent = message;

    // Clear the message after a short delay to allow re-announcement of the same message
    setTimeout(() => {
      if (announceRef.current) {
        announceRef.current.textContent = '';
      }
    }, 1000);
  }, []);

  const AnnouncementRegion = useCallback(() => 
    React.createElement('div', {
      ref: announceRef,
      'aria-live': 'polite',
      'aria-atomic': 'true',
      className: 'sr-only',
      role: 'status'
    })
  , []);

  return { announce, AnnouncementRegion };
};

/**
 * Hook for keyboard navigation in lists and menus
 */
export const useKeyboardNavigation = (
  items: Array<{ id: string; disabled?: boolean }>,
  onSelect?: (id: string) => void
) => {
  const containerRef = useRef<HTMLElement>(null);
  const activeIndexRef = useRef<number>(-1);

  const getEnabledItems = useCallback(() => {
    return items.filter(item => !item.disabled);
  }, [items]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!containerRef.current) return;

    const enabledItems = getEnabledItems();
    
    // Guard against empty enabled items to prevent runtime crashes
    if (enabledItems.length === 0) return;
    
    const currentIndex = activeIndexRef.current;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        const nextIndex = currentIndex < enabledItems.length - 1 ? currentIndex + 1 : 0;
        activeIndexRef.current = nextIndex;
        
        const nextElement = containerRef.current.querySelector(
          `[data-item-id="${enabledItems[nextIndex].id}"]`
        ) as HTMLElement;
        nextElement?.focus();
        break;

      case 'ArrowUp':
        e.preventDefault();
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : enabledItems.length - 1;
        activeIndexRef.current = prevIndex;
        
        const prevElement = containerRef.current.querySelector(
          `[data-item-id="${enabledItems[prevIndex].id}"]`
        ) as HTMLElement;
        prevElement?.focus();
        break;

      case 'Home':
        e.preventDefault();
        activeIndexRef.current = 0;
        const firstElement = containerRef.current.querySelector(
          `[data-item-id="${enabledItems[0].id}"]`
        ) as HTMLElement;
        firstElement?.focus();
        break;

      case 'End':
        e.preventDefault();
        const lastIndex = enabledItems.length - 1;
        activeIndexRef.current = lastIndex;
        const lastElement = containerRef.current.querySelector(
          `[data-item-id="${enabledItems[lastIndex].id}"]`
        ) as HTMLElement;
        lastElement?.focus();
        break;

      case 'Enter':
      case ' ':
        e.preventDefault();
        if (currentIndex >= 0 && currentIndex < enabledItems.length) {
          onSelect?.(enabledItems[currentIndex].id);
        }
        break;
    }
  }, [items, onSelect, getEnabledItems]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('keydown', handleKeyDown);
    
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return containerRef;
};

/**
 * Hook for managing reduced motion preferences
 */
export const useReducedMotion = () => {
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;
  
  return prefersReducedMotion;
};

/**
 * Hook for managing high contrast mode
 */
export const useHighContrast = () => {
  const prefersHighContrast = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-contrast: high)').matches
    : false;
  
  return prefersHighContrast;
};

/**
 * Hook for skip links functionality
 */
export const useSkipLink = () => {
  const skipToContent = useCallback((targetId: string) => {
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  const SkipLink = useCallback(({ targetId, children }: { 
    targetId: string; 
    children: React.ReactNode 
  }) => 
    React.createElement('a', {
      href: `#${targetId}`,
      onClick: (e: React.MouseEvent) => {
        e.preventDefault();
        skipToContent(targetId);
      },
      className: "sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:p-4 focus:bg-primary focus:text-primary-foreground focus:no-underline"
    }, children)
  , [skipToContent]);

  return { skipToContent, SkipLink };
};