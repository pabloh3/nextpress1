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
import PageBuilderEditor from "@/pages/PageBuilderEditor";
import Templates from "@/pages/Templates";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {/* Auth routes - always available */}
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/posts" component={Posts} />
          <Route path="/pages" component={Pages} />
          <Route path="/media" component={Media} />
          <Route path="/comments" component={Comments} />
          <Route path="/themes" component={Themes} />
          <Route path="/templates" component={Templates} />
          <Route path="/users" component={Users} />
          <Route path="/settings" component={Settings} />
          <Route path="/home" component={Home} />
          <Route path="/page-builder/:type/:id" component={({ params }: any) => (
            <PageBuilderEditor postId={params.id} type={params.type as 'post' | 'page'} />
          )} />
          <Route path="/page-builder/template/:id" component={({ params }: any) => (
            <PageBuilderEditor templateId={params.id} type="template" />
          )} />
          <Route path="/page-builder" component={() => (
            <PageBuilderEditor />
          )} />
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
