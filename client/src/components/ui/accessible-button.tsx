/**
 * Accessible button component with WCAG compliance
 * Supports loading states, keyboard navigation, and screen reader announcements
 */

import { forwardRef, useState } from 'react';
import { Button, ButtonProps } from './button';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AccessibleButtonProps extends ButtonProps {
  /** Loading state for async operations */
  loading?: boolean;
  /** Text announced to screen readers when loading */
  loadingText?: string;
  /** Confirmation required before action */
  requireConfirmation?: boolean;
  /** Confirmation message */
  confirmationMessage?: string;
  /** Success message announced after action */
  successMessage?: string;
  /** Error message announced on failure */
  errorMessage?: string;
}

export const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  ({ 
    children, 
    loading = false, 
    loadingText = 'Loading...', 
    requireConfirmation = false,
    confirmationMessage = 'Are you sure?',
    successMessage,
    errorMessage,
    disabled,
    onClick,
    className,
    ...props 
  }, ref) => {
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [announcement, setAnnouncement] = useState<string>('');

    const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
      if (loading) return;

      if (requireConfirmation && !showConfirmation) {
        setShowConfirmation(true);
        setAnnouncement(confirmationMessage);
        return;
      }

      try {
        await onClick?.(e);
        if (successMessage) {
          setAnnouncement(successMessage);
        }
      } catch (error) {
        if (errorMessage) {
          setAnnouncement(errorMessage);
        }
      } finally {
        setShowConfirmation(false);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === 'Escape' && showConfirmation) {
        setShowConfirmation(false);
        setAnnouncement('Action cancelled');
      }
    };

    const isDisabled = disabled || loading;

    return (
      <>
        <Button
          ref={ref}
          disabled={isDisabled}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          className={cn(
            showConfirmation && 'ring-2 ring-yellow-500 ring-offset-2',
            className
          )}
          aria-live="polite"
          aria-busy={loading}
          aria-describedby={announcement ? 'button-announcement' : undefined}
          {...props}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {showConfirmation ? 'Confirm?' : children}
          {loading && <span className="sr-only">{loadingText}</span>}
        </Button>
        
        {announcement && (
          <div
            id="button-announcement"
            className="sr-only"
            aria-live="assertive"
            role="status"
          >
            {announcement}
          </div>
        )}
      </>
    );
  }
);

AccessibleButton.displayName = 'AccessibleButton';