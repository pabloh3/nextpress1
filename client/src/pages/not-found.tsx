import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft, Home } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";

/**
 * 404 Not Found page component
 * Provides navigation options: go back to previous page or navigate to home
 */
export default function NotFound() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();

  // Determine home route based on authentication status
  const homeRoute = isAuthenticated ? "/home" : "/";

  /**
   * Handle back navigation
   * If there's browser history, go back; otherwise navigate to home
   */
  const handleGoBack = () => {
    // Check if there's a previous page in browser history
    if (window.history.length > 1) {
      window.history.back();
    } else {
      // No previous page, navigate to home
      setLocation(homeRoute);
    }
  };

  /**
   * Handle navigation to home page
   */
  const handleGoHome = () => {
    setLocation(homeRoute);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardTitle className="w-full text-center justify-center p-2">
          <h1 className="text-2xl md:text-4xl font-bold text-gray-800">
            NextPress
          </h1>
        </CardTitle>
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2 justify-center items-center">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-700">
              404 Page Not Found
            </h1>
          </div>

          <p className="mt-4 text-sm text-gray-600 mb-6 text-center">
            The page you're looking for doesn't exist or has been moved, deleted
            or never existed.
          </p>

          <div className="flex gap-3">
            <Button onClick={handleGoBack} variant="outline" className="flex-1">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
            <Button onClick={handleGoHome} className="flex-1">
              <Home className="h-4 w-4 mr-2" />
              Go to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
