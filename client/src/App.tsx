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
import Media from "@/pages/Media";
import Comments from "@/pages/Comments";
import Themes from "@/pages/Themes";
import Users from "@/pages/Users";
import Settings from "@/pages/Settings";
import Landing from "@/pages/Landing";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Register from "@/pages/Register";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {/* Auth routes - always available */}
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      
      {/* Admin routes - only for authenticated users */}
      {isAuthenticated && (
        <>
          <Route path="/admin" component={Dashboard} />
          <Route path="/admin/posts" component={Posts} />
          <Route path="/admin/pages" component={Pages} />
          <Route path="/admin/media" component={Media} />
          <Route path="/admin/comments" component={Comments} />
          <Route path="/admin/themes" component={Themes} />
          <Route path="/admin/users" component={Users} />
          <Route path="/admin/settings" component={Settings} />
          <Route path="/admin/home" component={Home} />
        </>
      )}
      
      {/* Fallback for non-admin routes - let server handle them */}
      <Route path="/*" component={() => { 
        // Redirect to server-rendered page
        window.location.href = window.location.pathname;
        return null;
      }} />
      
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
