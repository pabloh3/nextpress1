import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';

/**
 * Password requirements for validation
 */
const PASSWORD_REQUIREMENTS = [
  { regex: /.{8,}/, label: 'At least 8 characters' },
  { regex: /[A-Z]/, label: 'One uppercase letter' },
  { regex: /[a-z]/, label: 'One lowercase letter' },
  { regex: /[0-9]/, label: 'One number' },
];

/**
 * Setup Wizard page for initial system configuration.
 * Displayed when the system has no sites configured (fresh install).
 */
export default function Setup() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    siteName: '',
    domain: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  // Check if already setup on mount
  useEffect(() => {
    // Attempt to pre-fill domain using current window hostname
    try {
      const hostname = window.location.hostname;
      // Skip generic localhosts since they usually aren't real domains, unless it's IP
      if (hostname && hostname !== 'localhost') {
        setFormData(prev => ({ ...prev, domain: hostname }));
      }
    } catch (e) {
      // Ignore window object errors in edge cases
    }

    const checkSetupStatus = async () => {
      try {
        const res = await fetch('/api/setup/status');
        const data = await res.json();
        if (data.isSetup) {
          setLocation('/login');
        }
      } catch {
        // If check fails, show the form anyway
      } finally {
        setIsCheckingStatus(false);
      }
    };
    checkSetupStatus();
  }, [setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password requirements
    const failedRequirements = PASSWORD_REQUIREMENTS.filter(
      req => !req.regex.test(formData.password)
    );
    if (failedRequirements.length > 0) {
      setError(`Password requirements not met: ${failedRequirements.map(r => r.label).join(', ')}`);
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteName: formData.siteName,
          domain: formData.domain,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || 'Setup failed');
      }

      // Redirect to login
      window.location.href = '/login';
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Setup failed';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  // Password strength indicator
  const getPasswordStrength = () => {
    const passed = PASSWORD_REQUIREMENTS.filter(req =>
      req.regex.test(formData.password)
    ).length;
    return passed;
  };

  if (isCheckingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Welcome to NextPress</CardTitle>
          <CardDescription>
            Complete the setup to get started with your new site
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="siteName">Site Name</Label>
              <Input
                id="siteName"
                placeholder="My Awesome Site"
                value={formData.siteName}
                onChange={updateField('siteName')}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="domain">Domain</Label>
              <Input
                id="domain"
                placeholder="example.com"
                value={formData.domain}
                onChange={updateField('domain')}
                required
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500">
                Point your DNS A record to this server before setup
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Admin Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={formData.email}
                onChange={updateField('email')}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={updateField('password')}
                required
                disabled={isLoading}
              />
              {formData.password && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map(i => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded ${
                          i <= getPasswordStrength()
                            ? getPasswordStrength() >= 4
                              ? 'bg-green-500'
                              : getPasswordStrength() >= 2
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                            : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <ul className="text-xs text-gray-500 space-y-0.5">
                    {PASSWORD_REQUIREMENTS.map(req => (
                      <li
                        key={req.label}
                        className={req.regex.test(formData.password) ? 'text-green-600' : ''}
                      >
                        {req.regex.test(formData.password) ? '✓' : '○'} {req.label}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={updateField('confirmPassword')}
                required
                disabled={isLoading}
              />
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="text-xs text-red-500">Passwords do not match</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || getPasswordStrength() < 4}
            >
              {isLoading ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Setting up...
                </>
              ) : (
                'Complete Setup'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
