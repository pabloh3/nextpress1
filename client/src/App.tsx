import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Posts from "@/pages/Posts";
import Pages from "@/pages/Pages";
import Themes from "@/pages/Themes";
import Users from "@/pages/Users";
import Settings from "@/pages/Settings";
import Landing from "@/pages/Landing";
import Home from "@/pages/Home";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/posts" component={Posts} />
          <Route path="/pages" component={Pages} />
          <Route path="/themes" component={Themes} />
          <Route path="/users" component={Users} />
          <Route path="/settings" component={Settings} />
          <Route path="/home" component={Home} />
        </>
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
