import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Route, Switch, useLocation } from "wouter";
import { ErrorBoundary } from "@/components/error-boundary";
import { RequireAuth } from "@/components/require-auth";
import { WorkspaceProvider } from "@/hooks/use-workspace";
import LandingPage from "@/pages/landing";
import LoginPage from "@/pages/login";
import SignupPage from "@/pages/signup";
import DashboardPage from "@/pages/dashboard";
import AssistantPage from "@/pages/assistant";
import MetricsPage from "@/pages/metrics";
import ConnectionsPage from "@/pages/connections";
import ReportsPage from "@/pages/reports";
import AlertsPage from "@/pages/alerts";
import SettingsPage from "@/pages/settings";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

function AppRouter() {
  const [location] = useLocation();
  return (
    <ErrorBoundary resetKey={location}>
      <Switch>
        <Route path="/" component={LandingPage} />
        <Route path="/login" component={LoginPage} />
        <Route path="/signup" component={SignupPage} />
        <Route path="/app" component={() => <RequireAuth component={DashboardPage} />} />
        <Route path="/app/assistant" component={() => <RequireAuth component={AssistantPage} />} />
        <Route path="/app/metrics" component={() => <RequireAuth component={MetricsPage} />} />
        <Route path="/app/connections" component={() => <RequireAuth component={ConnectionsPage} />} />
        <Route path="/app/reports" component={() => <RequireAuth component={ReportsPage} />} />
        <Route path="/app/alerts" component={() => <RequireAuth component={AlertsPage} />} />
        <Route path="/app/settings" component={() => <RequireAuth component={SettingsPage} />} />
        <Route component={NotFound} />
      </Switch>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WorkspaceProvider>
        <AppRouter />
      </WorkspaceProvider>
    </QueryClientProvider>
  );
}

export default App;
