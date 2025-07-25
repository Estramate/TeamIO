import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

/**
 * Custom hook to handle authentication redirects consistently across pages
 * This addresses the code duplication issue mentioned in the analysis
 */
export const useAuthRedirect = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      
      // Use a shorter delay to improve user experience
      const timer = setTimeout(() => {
        window.location.href = "/api/login";
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, isLoading, toast]);

  return { isAuthenticated, isLoading };
};

/**
 * Enhanced error handler for API responses with better user feedback
 */
export const isUnauthorizedError = (error: any): boolean => {
  return error?.response?.status === 401 || 
         error?.status === 401 || 
         error?.message?.includes('Unauthorized') ||
         error?.message?.includes('Authentication required');
};

/**
 * Centralized error handling for mutations with consistent user feedback
 */
export const handleMutationError = (error: any, toast: any, defaultMessage: string = "An error occurred") => {
  if (isUnauthorizedError(error)) {
    toast({
      title: "Session Expired",
      description: "Your session has expired. Please log in again.",
      variant: "destructive",
    });
    setTimeout(() => {
      window.location.href = "/api/login";
    }, 1500);
    return;
  }

  // Check for structured error response
  const errorMessage = error?.response?.data?.error?.message || 
                      error?.response?.data?.message || 
                      error?.message || 
                      defaultMessage;

  toast({
    title: "Error",
    description: errorMessage,
    variant: "destructive",
  });
};