import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ClubThemeProvider } from "@/contexts/ClubThemeContext";
import { PageProvider } from "@/contexts/PageContext";
import { useAuth } from "@/hooks/useAuth";
import Dashboard from "@/pages/dashboard";
import { Landing } from "@/pages/landing";
import Members from "@/pages/members";
import Players from "@/pages/players";
import Teams from "@/pages/teams";
import Bookings from "@/pages/bookings";
import Facilities from "@/pages/facilities";
import Finance from "@/pages/finance";
import Calendar from "@/pages/calendar";
import Communication from "@/pages/communication";
import Users from "@/pages/users";
import Settings from "@/pages/settings";
import Layout from "@/components/layout";
import NotFound from "@/pages/not-found";

function AuthenticatedApp() {
  return (
    <PageProvider>
      <Layout>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/members" component={Members} />
          <Route path="/players" component={Players} />
          <Route path="/teams" component={Teams} />
          <Route path="/bookings" component={Bookings} />
          <Route path="/facilities" component={Facilities} />
          <Route path="/finance" component={Finance} />
          <Route path="/calendar" component={Calendar} />
          <Route path="/communication" component={Communication} />
          <Route path="/users" component={Users} />
          <Route path="/settings" component={Settings} />
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
