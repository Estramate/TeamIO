import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ClubThemeProvider } from "@/contexts/ClubThemeContext";
import { PageProvider } from "@/contexts/PageContext";
import { SubscriptionProvider } from "@/hooks/use-subscription";
import { useAuth } from "@/hooks/useAuth";

import { useClub } from "@/hooks/use-club";
import { lazy, useState, useEffect } from 'react';
import { LazyComponentWrapper } from '@/components/LazyPageWrapper';
import { Landing } from "@/pages/Landing";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { OnboardingWizard } from "@/components/auth/OnboardingWizard";
import { PendingMembershipDashboard } from "@/components/PendingMembershipDashboard";
import Layout from "@/components/layout";
import NotFound from "@/pages/Not-Found";

// Lazy load all major pages for better performance
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Members = lazy(() => import("@/pages/Members"));
const Players = lazy(() => import("@/pages/Players"));
const Teams = lazy(() => import("@/pages/Teams"));
const Bookings = lazy(() => import("@/pages/Bookings"));
const Facilities = lazy(() => import("@/pages/Facilities"));
const Finance = lazy(() => import("@/pages/Finance"));
const Calendar = lazy(() => import("@/pages/Calendar"));
const Communication = lazy(() => import("@/pages/Communication"));
const Reports = lazy(() => import("@/pages/Reports"));
const Users = lazy(() => import("@/pages/Users"));
const Settings = lazy(() => import("@/pages/Settings"));
const Subscription = lazy(() => import("@/pages/Subscription"));
const SuperAdmin = lazy(() => import("@/pages/SuperAdmin"));



function AuthenticatedApp() {
  return (
    <SubscriptionProvider>
      <PageProvider>
        <Layout>
        <Switch>
          <Route path="/" component={() => <LazyComponentWrapper component={Dashboard} />} />
          <Route path="/members" component={() => <LazyComponentWrapper component={Members} />} />
          <Route path="/players" component={() => <LazyComponentWrapper component={Players} />} />
          <Route path="/teams" component={() => <LazyComponentWrapper component={Teams} />} />
          <Route path="/bookings" component={() => <LazyComponentWrapper component={Bookings} />} />
          <Route path="/facilities" component={() => <LazyComponentWrapper component={Facilities} />} />
          <Route path="/finance" component={() => <LazyComponentWrapper component={Finance} />} />
          <Route path="/calendar" component={() => <LazyComponentWrapper component={Calendar} />} />
          <Route path="/communication" component={() => <LazyComponentWrapper component={Communication} />} />
          <Route path="/reports" component={() => <LazyComponentWrapper component={Reports} />} />
          <Route path="/users" component={() => <LazyComponentWrapper component={Users} />} />
          <Route path="/settings" component={() => <LazyComponentWrapper component={Settings} />} />
          <Route path="/subscription" component={() => <LazyComponentWrapper component={Subscription} />} />
          <Route path="/super-admin" component={() => <LazyComponentWrapper component={SuperAdmin} />} />

          <Route component={NotFound} />
        </Switch>
      </Layout>
    </PageProvider>
    </SubscriptionProvider>
  );
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  const { selectedClub, setSelectedClub } = useClub();
  const [showOnboarding, setShowOnboarding] = useState<boolean | 'pending'>(false);
  const [membershipChecked, setMembershipChecked] = useState(false);
  
  // Force redirect to landing page after logout
  useEffect(() => {
    const checkLogoutState = () => {
      // If we're authenticated but we're on root and have no session data
      // this likely means we just logged out and need to refresh
      if (!isLoading && !isAuthenticated && window.location.pathname === '/') {
        // User not authenticated, ensuring landing page is shown
        // Force a page reload to ensure clean state
        if (sessionStorage.getItem('just_logged_out') === 'true') {
          sessionStorage.removeItem('just_logged_out');
          window.location.reload();
        }
      }
    };
    
    checkLogoutState();
  }, [isAuthenticated, isLoading]);

  // Check if authenticated user needs club selection or auto-select first club
  useEffect(() => {
    if (isAuthenticated && !isLoading && !membershipChecked) {
      setMembershipChecked(true);

      // If no club is selected, check user's membership status
      if (!selectedClub) {
        // First check if user has ANY memberships (active or inactive)
        fetch('/api/user/memberships/status', { credentials: 'include' })
          .then(res => res.ok ? res.json() : { hasMemberships: false })
          .then(membershipStatus => {
            if (membershipStatus.hasMemberships) {
              // User has memberships, check for active ones
              if (membershipStatus.activeMemberships > 0) {
                // Get active clubs to auto-select
                fetch('/api/clubs', { credentials: 'include' })
                  .then(res => res.ok ? res.json() : [])
                  .then(clubs => {
                    if (clubs && clubs.length > 0) {
                      if (clubs.length === 1) {
                        // Only one active club - auto-select and go directly to dashboard
                        console.log('🎯 Auto-selecting single club:', clubs[0].name);
                        setSelectedClub(clubs[0]);
                        setShowOnboarding(false);
                      } else {
                        // Multiple active clubs - show selection (onboarding wizard)
                        console.log('📋 Multiple clubs found, showing selection:', clubs.length);
                        setShowOnboarding(true);
                      }
                    } else {
                      setShowOnboarding(false);
                    }
                  })
                  .catch(() => setShowOnboarding(false));
              } else {
                // User has pending memberships but no active ones - show pending dashboard
                setShowOnboarding('pending');
              }
            } else {
              // No memberships at all - show onboarding
              setShowOnboarding(true);
            }
          })
          .catch(() => {
            // Error checking membership status - show onboarding as fallback
            setShowOnboarding(true);
          });
      } else {
        setShowOnboarding(false);
      }
    }
  }, [isAuthenticated, isLoading, selectedClub, membershipChecked]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Lade Anwendung...</p>
        </div>
      </div>
    );
  }

  // Show register page regardless of authentication status (for invitation links)
  if (window.location.pathname === '/register') {
    return <RegisterPage />;
  }

  // Show landing page for unauthenticated users  
  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/login" component={LoginPage} />
        <Route component={Landing} />
      </Switch>
    );
  }

  // Show pending dashboard for users with inactive memberships
  if (showOnboarding === 'pending' && isAuthenticated) {
    return (
      <PendingMembershipDashboard 
        onJoinAnotherClub={() => setShowOnboarding(true)}
      />
    );
  }

  // Show club selection for users without a club
  if (showOnboarding && isAuthenticated) {
    return (
      <OnboardingWizard 
        isOpen={true}
        onComplete={async (clubId) => {
          // After completing onboarding, check user's membership status
          try {
            const response = await fetch('/api/user/memberships/status', { credentials: 'include' });
            const membershipStatus = await response.json();
            
            if (membershipStatus.activeMemberships > 0) {
              // User has active memberships - can go to dashboard
              setShowOnboarding(false);
              if (clubId) {
                // Club is automatically selected in the onboarding wizard
                // No need to reload - the app will re-render
              }
            } else if (membershipStatus.hasMemberships) {
              // User has pending memberships - show pending dashboard
              setShowOnboarding('pending');
            } else {
              // No memberships at all - stay in onboarding (shouldn't happen)
              setShowOnboarding(true);
            }
          } catch (error) {
            console.error('Error checking membership status:', error);
            // Fallback to pending dashboard to be safe
            setShowOnboarding('pending');
          }
        }}
        onClose={async () => {
          // When dialog is closed without completing (X button or Escape)
          // Check membership status and navigate accordingly
          try {
            const response = await fetch('/api/user/memberships/status', { credentials: 'include' });
            const membershipStatus = await response.json();
            
            if (membershipStatus.activeMemberships > 0) {
              // User has active memberships - can go to dashboard
              setShowOnboarding(false);
            } else {
              // No active memberships - show pending dashboard
              setShowOnboarding('pending');
            }
          } catch (error) {
            console.error('Error checking membership status:', error);
            // Fallback to pending dashboard to be safe
            setShowOnboarding('pending');
          }
        }}
      />
    );
  }

  return <AuthenticatedApp />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ClubThemeProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ClubThemeProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
