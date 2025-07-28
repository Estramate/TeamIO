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
import { useNavigation } from "@/hooks/use-navigation";
import { useSmartNotifications } from "@/hooks/use-smart-notifications";
import { lazy, useState, useEffect } from 'react';
import { LazyComponentWrapper } from '@/components/LazyPageWrapper';
import { Landing } from "@/pages/Landing";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { OnboardingWizard } from "@/components/auth/OnboardingWizard";
import { PendingMembershipDashboard } from "@/components/PendingMembershipDashboard";
import Layout from "@/components/layout";
import NotFound from "@/pages/Not-Found";
import { useLocation, useRoute } from "wouter";

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
const SyncDemo = lazy(() => import("@/pages/SyncDemo"));
const ChatDemo = lazy(() => import("@/pages/ChatDemo"));



function AuthenticatedApp() {
  const [location, setLocation] = useLocation();
  const { setLastVisitedPage, getInitialRoute } = useNavigation();
  const [hasNavigatedToInitial, setHasNavigatedToInitial] = useState(false);
  
  // Initialize smart notifications
  useSmartNotifications();

  // Track page visits for next time
  useEffect(() => {
    if (location && location !== '/') {
      setLastVisitedPage(location);
    }
  }, [location, setLastVisitedPage]);

  // Navigate to last visited page on initial load
  useEffect(() => {
    if (!hasNavigatedToInitial && location === '/') {
      const initialRoute = getInitialRoute();
      console.log('🏠 Navigating to initial route:', initialRoute);
      if (initialRoute !== '/') {
        setLocation(initialRoute);
      }
      setHasNavigatedToInitial(true);
    }
  }, [location, hasNavigatedToInitial, getInitialRoute, setLocation]);

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
          <Route path="/sync-demo" component={() => <LazyComponentWrapper component={SyncDemo} />} />
          <Route path="/chat-demo" component={() => <LazyComponentWrapper component={ChatDemo} />} />

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

      // First check if user has ANY memberships (active or inactive)
      fetch('/api/user/memberships/status', { credentials: 'include' })
        .then(res => res.ok ? res.json() : { hasMemberships: false })
        .then(membershipStatus => {
          console.log('📊 Membership Status Check:', membershipStatus);
          
          if (membershipStatus.hasMemberships) {
            // User has memberships, check for active ones
            if (membershipStatus.activeMemberships > 0) {
              // User has active memberships - skip onboarding entirely
              console.log('✅ User has active memberships, bypassing onboarding');
              setShowOnboarding(false);
              
              // Wenn kein Club ausgewählt ist, lade verfügbare Clubs und wähle intelligente aus
              if (!selectedClub) {
                fetch('/api/clubs', { credentials: 'include' })
                  .then(res => res.ok ? res.json() : [])
                  .then(clubs => {
                    if (clubs && clubs.length > 0) {
                      // Versuche den zuletzt ausgewählten Club zu finden (falls localStorage nicht vollständig)
                      const storedClubId = localStorage.getItem('clubflow-selected-club');
                      let targetClub = clubs[0]; // Fallback zum ersten Club
                      
                      if (storedClubId) {
                        try {
                          const parsed = JSON.parse(storedClubId);
                          const lastClubId = parsed?.state?.selectedClub?.id;
                          const foundClub = clubs.find((club: any) => club.id === lastClubId);
                          if (foundClub) {
                            targetClub = foundClub;
                            console.log('🎯 Restoring last selected club:', targetClub.name);
                          } else {
                            console.log('🎯 Last club not found, selecting first available:', targetClub.name);
                          }
                        } catch (e) {
                          console.log('🎯 Could not parse stored club, selecting first available:', targetClub.name);
                        }
                      } else {
                        console.log('🎯 No stored club found, auto-selecting first club:', targetClub.name);
                      }
                      
                      setSelectedClub(targetClub);
                    }
                  })
                  .catch(err => console.error('Error fetching clubs:', err));
              }
            } else {
              // User has pending memberships but no active ones - show pending dashboard
              console.log('⏳ User has pending memberships, showing pending dashboard');
              setShowOnboarding('pending');
            }
          } else {
            // No memberships at all - show onboarding
            console.log('🆕 User has no memberships, showing onboarding');
            setShowOnboarding(true);
          }
        })
        .catch(err => {
          console.error('Error checking membership status:', err);
          // Error checking membership status - show onboarding as fallback
          setShowOnboarding(true);
        });
    }
  }, [isAuthenticated, isLoading, membershipChecked]);

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
