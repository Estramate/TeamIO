// Enhanced keyboard navigation hooks for WCAG compliance
import { useEffect, useRef, useCallback } from 'react';

export const useKeyboardNavigation = (enabled: boolean = true) => {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const { key, ctrlKey, altKey } = event;
      const container = containerRef.current;
      if (!container) return;

      // Arrow key navigation for lists and grids
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
        const focusableElements = container.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const currentIndex = Array.from(focusableElements).indexOf(document.activeElement as HTMLElement);
        
        if (currentIndex === -1) return;

        let nextIndex = currentIndex;
        
        switch (key) {
          case 'ArrowDown':
            nextIndex = Math.min(currentIndex + 1, focusableElements.length - 1);
            break;
          case 'ArrowUp':
            nextIndex = Math.max(currentIndex - 1, 0);
            break;
          case 'ArrowRight':
            nextIndex = Math.min(currentIndex + 1, focusableElements.length - 1);
            break;
          case 'ArrowLeft':
            nextIndex = Math.max(currentIndex - 1, 0);
            break;
        }

        if (nextIndex !== currentIndex) {
          event.preventDefault();
          (focusableElements[nextIndex] as HTMLElement).focus();
        }
      }

      // Escape key handling
      if (key === 'Escape') {
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement && activeElement.closest('[role="dialog"]')) {
          // Handle dialog escape
          const closeButton = container.querySelector('[data-dismiss="dialog"]') as HTMLButtonElement;
          closeButton?.click();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enabled]);

  return containerRef;
};

export const useFocusTrap = (isActive: boolean) => {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!isActive) return;

    const container = containerRef.current;
    if (!container) return;

    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    // Focus first element when trap becomes active
    if (firstElement) {
      firstElement.focus();
    }

    document.addEventListener('keydown', handleTabKey);
    return () => document.removeEventListener('keydown', handleTabKey);
  }, [isActive]);

  return containerRef;
};

export const useAnnouncer = () => {
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', priority);
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    announcer.textContent = message;

    document.body.appendChild(announcer);
    
    setTimeout(() => {
      document.body.removeChild(announcer);
    }, 1000);
  }, []);

  return announce;
};