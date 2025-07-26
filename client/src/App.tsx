import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ClubThemeProvider } from "@/contexts/ClubThemeContext";
import { PageProvider } from "@/contexts/PageContext";
import { useAuth } from "@/hooks/useAuth";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { lazy, Suspense, useState, useEffect } from 'react';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { DashboardSkeleton, CardSkeleton } from '@/components/ui/loading-skeleton';
import { Landing } from "@/pages/landing";
import { LoginPage } from "@/pages/LoginPage";
import { OnboardingWizard } from "@/components/auth/OnboardingWizard";
import Layout from "@/components/layout";
import NotFound from "@/pages/not-found";

// Lazy load all major pages for better performance
const Dashboard = lazy(() => import("@/pages/dashboard"));
const Members = lazy(() => import("@/pages/members"));
const Players = lazy(() => import("@/pages/players"));
const Teams = lazy(() => import("@/pages/teams"));
const Bookings = lazy(() => import("@/pages/bookings"));
const Facilities = lazy(() => import("@/pages/facilities"));
const Finance = lazy(() => import("@/pages/finance"));
const Calendar = lazy(() => import("@/pages/calendar"));
const Communication = lazy(() => import("@/pages/communication"));
const Reports = lazy(() => import("@/pages/reports"));
const Users = lazy(() => import("@/pages/users"));
const Settings = lazy(() => import("@/pages/settings"));

// Lazy loading wrapper component
const LazyPage = ({ component: Component }: { component: React.ComponentType }) => (
  <ErrorBoundary>
    <Suspense fallback={<DashboardSkeleton />}>
      <Component />
    </Suspense>
  </ErrorBoundary>
);

function AuthenticatedApp() {
  return (
    <PageProvider>
      <Layout>
        <Switch>
          <Route path="/" component={() => <LazyPage component={Dashboard} />} />
          <Route path="/members" component={() => <LazyPage component={Members} />} />
          <Route path="/players" component={() => <LazyPage component={Players} />} />
          <Route path="/teams" component={() => <LazyPage component={Teams} />} />
          <Route path="/bookings" component={() => <LazyPage component={Bookings} />} />
          <Route path="/facilities" component={() => <LazyPage component={Facilities} />} />
          <Route path="/finance" component={() => <LazyPage component={Finance} />} />
          <Route path="/calendar" component={() => <LazyPage component={Calendar} />} />
          <Route path="/communication" component={() => <LazyPage component={Communication} />} />
          <Route path="/reports" component={() => <LazyPage component={Reports} />} />
          <Route path="/users" component={() => <LazyPage component={Users} />} />
          <Route path="/settings" component={() => <LazyPage component={Settings} />} />
          <Route path="/auth-test" component={() => <LazyPage component={lazy(() => import("@/pages/auth-test"))} />} />
          <Route component={NotFound} />
        </Switch>
      </Layout>
    </PageProvider>
  );
}

function Router() {
  const { isAuthenticated: replitAuth, isLoading: replitLoading } = useAuth();
  const { isAuthenticated: firebaseAuth, loading: firebaseLoading } = useFirebaseAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [needsClubSelection, setNeedsClubSelection] = useState(false);

  // Check if user is authenticated with either provider
  const isAuthenticated = replitAuth || firebaseAuth;
  const isLoading = replitLoading || firebaseLoading;
  
  // Force redirect to landing page after logout
  useEffect(() => {
    const checkLogoutState = () => {
      // If we're authenticated but we're on root and have no session data
      // this likely means we just logged out and need to refresh
      if (!isLoading && !isAuthenticated && window.location.pathname === '/') {
        console.log('User not authenticated, ensuring landing page is shown');
        // Force a page reload to ensure clean state
        if (sessionStorage.getItem('just_logged_out') === 'true') {
          sessionStorage.removeItem('just_logged_out');
          window.location.reload();
        }
      }
    };
    
    checkLogoutState();
  }, [isAuthenticated, isLoading]);

  // Check if authenticated user needs onboarding
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      // Only show onboarding when user explicitly needs club selection
      // Not automatically for all Firebase users
      // This should be triggered by explicit user action (e.g., "Join Club" button)
      setShowOnboarding(false); // Disable auto-onboarding
    }
  }, [isAuthenticated, isLoading, firebaseAuth, replitAuth]);

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

  // Show landing page for unauthenticated users  
  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/login" component={LoginPage} />
        <Route component={Landing} />
      </Switch>
    );
  }

  // Show onboarding for new Firebase users
  if (showOnboarding) {
    return (
      <>
        <AuthenticatedApp />
        <OnboardingWizard 
          isOpen={showOnboarding}
          onComplete={(clubId) => {
            setShowOnboarding(false);
            if (clubId) {
              // Redirect or refresh to show club data
              window.location.reload();
            }
          }}
        />
      </>
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
