import { useState } from 'react';
import { motion } from 'motion/react';
import { Layers, Mail, Lock, User, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { useAuth } from './AuthContext';
import { useApp } from './AppContext';
import { toast } from 'sonner';
import { PublicNavBar } from './PublicNavBar';

export function RegisterPage() {
  const { register } = useAuth();
  const { setCurrentView } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const passwordStrength = (pwd: string) => {
    if (pwd.length === 0) return { strength: 0, label: '', color: '' };
    if (pwd.length < 6) return { strength: 25, label: 'Weak', color: 'bg-destructive' };
    if (pwd.length < 10) return { strength: 50, label: 'Fair', color: 'bg-yellow-500' };
    if (pwd.length < 12 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) {
      return { strength: 75, label: 'Good', color: 'bg-accent' };
    }
    return { strength: 100, label: 'Strong', color: 'bg-green-500' };
  };

  const strength = passwordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!name || !email || !password || !confirmPassword) {
        throw new Error('Please fill in all fields');
      }
      if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }
      if (password.length < 8) {
        throw new Error('Password must be at least 8 characters');
      }
      if (!acceptTerms) {
        throw new Error('Please accept the Terms of Service');
      }

      await register(name, email, password);
      toast.success('Account created successfully!');
      setCurrentView('dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
      toast.error('Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PublicNavBar />
      
      <div className="min-h-screen flex items-center justify-center px-4 py-24">
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

            <h1 className="text-center mb-2">Create Account</h1>
            <p className="text-center text-muted-foreground mb-8">
              Start your 3D visualization journey
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
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
              </div>

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
                {password && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Password strength:</span>
                      <span className={`font-medium ${strength.strength >= 75 ? 'text-accent' : 'text-muted-foreground'}`}>
                        {strength.label}
                      </span>
                    </div>
                    <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${strength.strength}%` }}
                        className={`h-full ${strength.color}`}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10"
                    disabled={isLoading}
                  />
                  {confirmPassword && password === confirmPassword && (
                    <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-accent" />
                  )}
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="terms"
                  checked={acceptTerms}
                  onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                />
                <label htmlFor="terms" className="text-sm cursor-pointer leading-tight">
                  I agree to the{' '}
                  <Button
                    type="button"
                    variant="link"
                    className="px-0 h-auto"
                    onClick={() => setCurrentView('terms')}
                  >
                    Terms of Service
                  </Button>{' '}
                  and{' '}
                  <Button
                    type="button"
                    variant="link"
                    className="px-0 h-auto"
                    onClick={() => setCurrentView('privacy')}
                  >
                    Privacy Policy
                  </Button>
                </label>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Creating account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Already have an account? </span>
              <Button
                variant="link"
                className="px-1"
                onClick={() => setCurrentView('login')}
              >
                Sign in
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
