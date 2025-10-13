import { useState } from 'react';
import { motion } from 'motion/react';
import { Layers, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { useAuth } from './AuthContext';
import { useApp } from './AppContext';
import { toast } from 'sonner';
import { PublicNavBar } from './PublicNavBar';

export function LoginPage() {
  const { login } = useAuth();
  const { setCurrentView } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!email || !password) {
        throw new Error('Please enter both email and password');
      }

      await login(email, password);
      toast.success('Welcome back!');
      setCurrentView('dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid credentials');
      toast.error('Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PublicNavBar />
      
      <div className="min-h-screen flex items-center justify-center px-4 pt-16">
        <div className="absolute inset-0 gradient-mesh opacity-40" />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative w-full max-w-md"
        >
          <div className="glass-panel rounded-2xl shadow-elevation-3 p-8">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="absolute inset-0 gradient-blue-purple rounded-2xl blur-xl opacity-60" />
                <div className="relative bg-card p-3 rounded-2xl shadow-elevation-1">
                  <Layers className="w-8 h-8 text-primary" />
                </div>
              </div>
            </div>

            <h1 className="text-center mb-2">Welcome Back</h1>
            <p className="text-center text-muted-foreground mb-8">
              Sign in to your VisionCraft account
            </p>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center gap-2 text-sm text-destructive"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  />
                  <label htmlFor="remember" className="text-sm cursor-pointer">
                    Remember me
                  </label>
                </div>
                <Button
                  type="button"
                  variant="link"
                  className="text-sm px-0"
                  onClick={() => setCurrentView('forgot-password')}
                >
                  Forgot password?
                </Button>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Don't have an account? </span>
              <Button
                variant="link"
                className="px-1"
                onClick={() => setCurrentView('register')}
              >
                Sign up
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
