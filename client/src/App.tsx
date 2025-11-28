import { Switch, Route } from 'wouter';
import { queryClient } from './lib/queryClient';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/useAuth';
import NotFound from '@/pages/not-found';
import Dashboard from '@/pages/Dashboard';
import Posts from '@/pages/Posts';
import Pages from '@/pages/Pages';
import Media from '@/pages/Media';
import Comments from '@/pages/Comments';
import Themes from '@/pages/Themes';
import Users from '@/pages/Users';
import Settings from '@/pages/Settings';
import Landing from '@/pages/Landing';
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import PageBuilderEditor from '@/pages/PageBuilderEditor';
import Templates from '@/pages/Templates';
import PreviewPage from '@/pages/PreviewPage';
import { Spinner } from '@/components/ui/spinner';
import PublicPageView from '@/pages/PublicPageView';

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {/* Auth routes - always available */}
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />

      {/* Preview routes - available to everyone */}
      <Route
        path="/preview/post/:id"
        component={({ params }: any) => (
          <PreviewPage postId={params.id} type="post" />
        )}
      />
      <Route
        path="/preview/page/:id"
        component={({ params }: any) => (
          <PreviewPage postId={params.id} type="page" />
        )}
      />
      <Route
        path="/preview/template/:id"
        component={({ params }: any) => (
          <PreviewPage templateId={params.id} type="template" />
        )}
      />

      {/* Public routes - published content available to everyone */}
      <Route
        path="/page/:slug"
        component={({ params }: any) => (
          <PublicPageView slug={params.slug} type="page" />
        )}
      />
      <Route
        path="/post/:slug"
        component={({ params }: any) => (
          <PublicPageView slug={params.slug} type="post" />
        )}
      />

      {/* Conditional routes based on auth state */}
      {isLoading ? (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Spinner className="h-12 w-12 text-wp-blue" />
        </div>
      ) : !isAuthenticated ? (
        <>
          {/* Try to show homepage content from page builder, fallback to Landing */}
          <Route
            path="/"
            component={() => (
              <Landing />
            )}
          />
          <Route component={NotFound} />
        </>
      ) : (
        <>
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/posts" component={Posts} />
          <Route path="/pages" component={Pages} />
          <Route path="/media" component={Media} />
          <Route path="/comments" component={Comments} />
          <Route path="/themes" component={Themes} />
          <Route path="/templates" component={Templates} />
          <Route path="/users" component={Users} />
          <Route path="/settings" component={Settings} />
           <Route path="/home" component={Home} />
           <Route path="/" component={Home} />
          <Route
            path="/page-builder/:type/:id"
            component={({ params }: any) => {
              // Check if id is a UUID (for pages) or slug
              // UUIDs have format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
              const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.id);
              return (
                <PageBuilderEditor
                  postId={params.id}
                  type={params.type as 'post' | 'page'}
                  isSlug={params.type === 'page' && !isUUID}
                />
              );
            }}
          />
          <Route
            path="/page-builder/template/:id"
            component={({ params }: any) => (
              <PageBuilderEditor templateId={params.id} type="template" />
            )}
          />
          <Route path="/page-builder" component={() => <PageBuilderEditor />} />
          <Route component={NotFound} />
        </>
      )}
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
