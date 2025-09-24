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
// const ChatDemo = lazy(() => import("@/pages/ChatDemo")); // ENTFERNT - Live Chat System komplett entfernt

// ENTFERNT - FloatingChatWidget komplett aus System entfernt



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

  // Only navigate for true dashboard visits, never override current URL
  useEffect(() => {
    if (!hasNavigatedToInitial) {
      // Only navigate to last visited page if user explicitly goes to root "/"
      // Never redirect when user loads a specific URL like "/members" or "/settings"
      if (location === '/' && window.location.pathname === '/') {
        const initialRoute = getInitialRoute();
        if (initialRoute !== '/') {
          setLocation(initialRoute);
        }
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
          <Route path="/dashboard" component={() => {
            // Redirect legacy /dashboard route to root
            const [, setLocation] = useLocation();
            setLocation('/');
            return null;
          }} />
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
          {/* ENTFERNT - Chat Demo Route vollständig entfernt */}

          <Route component={NotFound} />
        </Switch>
        {/* LIVE CHAT WIDGET ENTFERNT - System vollständig bereinigt */}
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
  


  // Check if authenticated user needs club selection or auto-select first club
  useEffect(() => {
    if (isAuthenticated && !isLoading && !membershipChecked) {
      setMembershipChecked(true);

      // First check if user has ANY memberships (active or inactive)
      fetch('/api/user/memberships/status', { credentials: 'include' })
        .then(res => res.ok ? res.json() : { hasMemberships: false })
        .then(membershipStatus => {
          // Debug: logFormOperation('App', 'membership status check', membershipStatus);
          
          if (membershipStatus.hasMemberships) {
            // User has memberships, check for active ones
            if (membershipStatus.activeMemberships > 0) {
              // User has active memberships - skip onboarding entirely
              // Debug: logFormOperation('App', 'user has active memberships', 'proceeding to dashboard');
              setShowOnboarding(false);
              
              // Always load clubs and auto-select intelligently (even if club seems selected)
              fetch('/api/clubs', { credentials: 'include' })
                .then(res => res.ok ? res.json() : [])
                .then(clubs => {
                  // Debug: logFormOperation('App', 'available clubs', clubs?.map((c: any) => ({ id: c.id, name: c.name })));
                  
                  if (clubs && clubs.length > 0) {
                    // Smart club selection logic
                    let targetClub = clubs[0]; // Fallback to first club
                    
                    // Try to restore last selected club from localStorage
                    const storedClubId = localStorage.getItem('clubflow-selected-club');
                    if (storedClubId) {
                      try {
                        const parsed = JSON.parse(storedClubId);
                        const lastClubId = parsed?.state?.selectedClub?.id;
                        const foundClub = clubs.find((club: any) => club.id === lastClubId);
                        if (foundClub) {
                          targetClub = foundClub;
                          // Debug: logFormOperation('App', 'restoring last selected club', targetClub.name);
                        } else {
                          // Debug: logFormOperation('App', 'last club not found, auto-selecting first', targetClub.name);
                        }
                      } catch (e) {
                        // Debug: logFormOperation('App', 'could not parse stored club, auto-selecting first', targetClub.name);
                      }
                    } else {
                      // Debug: logFormOperation('App', 'no stored club found, auto-selecting first', targetClub.name);
                    }
                    
                    // Always set the club, even if one is already selected (ensures consistency)
                    // Debug: logFormOperation('App', 'setting selected club', { name: targetClub.name, id: targetClub.id });
                    setSelectedClub(targetClub);
                  } else {
                    // Debug: logFormOperation('App', 'no clubs found', 'user might need onboarding');
                    setShowOnboarding(true);
                  }
                })
                .catch(err => {
                  console.error('Error fetching clubs:', err);
                  // If we can't fetch clubs, show onboarding as fallback
                  setShowOnboarding(true);
                });
            } else {
              // User has pending memberships but no active ones - show pending dashboard
              // Debug: logFormOperation('App', 'user has pending memberships', 'showing pending dashboard');
              setShowOnboarding('pending');
            }
          } else {
            // No memberships at all - show onboarding
            // Debug: logFormOperation('App', 'user has no memberships', 'showing onboarding');
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
  if (window.location.pathname === '/register' || window.location.pathname.startsWith('/invitation/')) {
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
