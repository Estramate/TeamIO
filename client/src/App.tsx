import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Dashboard from "@/pages/dashboard";
import Landing from "@/pages/landing";
import Members from "@/pages/members";
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

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <Layout>
          <Route path="/" component={Dashboard} />
          <Route path="/members" component={Members} />
          <Route path="/teams" component={Teams} />
          <Route path="/bookings" component={Bookings} />
          <Route path="/facilities" component={Facilities} />
          <Route path="/finance" component={Finance} />
          <Route path="/calendar" component={Calendar} />
          <Route path="/communication" component={Communication} />
          <Route path="/users" component={Users} />
          <Route path="/settings" component={Settings} />
        </Layout>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
