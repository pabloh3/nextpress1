import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Eye, EyeOff } from 'lucide-react';
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
import { DomainInputWithVerify } from '@/components/domain';
import { BrandedFormLayout } from '@/components/auth';
import { cn } from '@/lib/utils';

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    siteName: '',
    domain: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    try {
      const hostname = window.location.hostname;
      if (hostname && hostname !== 'localhost') {
        setFormData((prev) => ({ ...prev, domain: hostname }));
      }
    } catch {
      // ignore
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
    void checkSetupStatus();
  }, [setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const failedRequirements = PASSWORD_REQUIREMENTS.filter(
      (req) => !req.regex.test(formData.password),
    );
    if (failedRequirements.length > 0) {
      setError(
        `Password requirements not met: ${failedRequirements.map((r) => r.label).join(', ')}`,
      );
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

      if (data.caddySuccess === false) {
        setError(
          `Setup completed, but domain configuration reported an issue: ${data.caddyStatus}. You may need to restart the proxy for HTTPS.`,
        );
        setTimeout(() => {
          window.location.href = '/login';
        }, 5000);
        return;
      }

      window.location.href = '/login';
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Setup failed';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const updateField =
    (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const getPasswordStrength = () =>
    PASSWORD_REQUIREMENTS.filter((req) => req.regex.test(formData.password)).length;

  if (isCheckingStatus) {
    return (
      <BrandedFormLayout>
        <div className="flex min-h-[12rem] w-full flex-col items-center justify-center gap-4 rounded-xl border border-border/60 bg-card/80 px-6 py-12 shadow-md">
          <Spinner className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Checking setup status…</p>
        </div>
      </BrandedFormLayout>
    );
  }

  return (
    <BrandedFormLayout>
      <Card className="w-full border-border/70 bg-card/95 shadow-lg shadow-black/[0.04] backdrop-blur-sm supports-[backdrop-filter]:bg-card/90 dark:shadow-black/25">
        <CardHeader className="space-y-1 pb-2 text-center">
          <CardTitle className="text-xl font-semibold tracking-tight">
            Welcome
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Create your site and administrator account to finish installing NextPress.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div
                role="alert"
                className="rounded-lg border border-destructive/35 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
              >
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="siteName">Site name</Label>
              <Input
                id="siteName"
                placeholder="My site"
                value={formData.siteName}
                onChange={updateField('siteName')}
                required
                disabled={isLoading}
                className="h-10"
              />
            </div>

            <DomainInputWithVerify
              id="domain"
              label="Domain"
              inputMode="domain"
              value={formData.domain}
              onChange={(v) => {
                setFormData((prev) => ({ ...prev, domain: v }));
              }}
              placeholder="example.com"
              disabled={isLoading}
              required
            />

            <div className="space-y-2">
              <Label htmlFor="email">Admin email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={formData.email}
                onChange={updateField('email')}
                autoComplete="email"
                required
                disabled={isLoading}
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={updateField('password')}
                  autoComplete="new-password"
                  required
                  disabled={isLoading}
                  className="h-10 pr-10"
                  placeholder="••••••••"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0.5 top-1/2 h-9 w-9 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden />
                  )}
                </Button>
              </div>
              {formData.password ? (
                <div className="space-y-2 pt-0.5">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={cn(
                          'h-1 flex-1 rounded-full transition-colors',
                          i <= getPasswordStrength()
                            ? getPasswordStrength() >= 4
                              ? 'bg-emerald-500'
                              : getPasswordStrength() >= 2
                                ? 'bg-amber-500'
                                : 'bg-red-500'
                            : 'bg-muted',
                        )}
                      />
                    ))}
                  </div>
                  <ul className="space-y-0.5 text-xs text-muted-foreground">
                    {PASSWORD_REQUIREMENTS.map((req) => (
                      <li
                        key={req.label}
                        className={cn(
                          req.regex.test(formData.password) && 'font-medium text-emerald-700 dark:text-emerald-400',
                        )}
                      >
                        {req.regex.test(formData.password) ? '✓' : '○'} {req.label}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={updateField('confirmPassword')}
                  autoComplete="new-password"
                  required
                  disabled={isLoading}
                  className="h-10 pr-10"
                  placeholder="••••••••"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0.5 top-1/2 h-9 w-9 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  aria-pressed={showConfirmPassword}
                  disabled={isLoading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden />
                  )}
                </Button>
              </div>
              {formData.confirmPassword && formData.password !== formData.confirmPassword ? (
                <p className="text-xs text-destructive">Passwords do not match</p>
              ) : null}
            </div>

            <Button
              type="submit"
              className="h-10 w-full font-medium"
              disabled={isLoading || getPasswordStrength() < 4}
            >
              {isLoading ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Setting up…
                </>
              ) : (
                'Complete setup'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </BrandedFormLayout>
  );
}
