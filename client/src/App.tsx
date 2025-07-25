import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ClubThemeProvider } from "@/contexts/ClubThemeContext";
import { PageProvider } from "@/contexts/PageContext";
import { useAuth } from "@/hooks/useAuth";
import { lazy, Suspense } from 'react';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { DashboardSkeleton, CardSkeleton } from '@/components/ui/loading-skeleton';
import { Landing } from "@/pages/landing";
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
          <Route component={NotFound} />
        </Switch>
      </Layout>
    </PageProvider>
  );
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  
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
  
  return isAuthenticated ? <AuthenticatedApp /> : <Landing />;
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
