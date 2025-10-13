import { useState } from 'react';
import { motion } from 'motion/react';
import { Layers, Mail, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useAuth } from './AuthContext';
import { useApp } from './AppContext';
import { toast } from 'sonner';
import { PublicNavBar } from './PublicNavBar';

export function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const { setCurrentView } = useApp();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!email) {
        throw new Error('Please enter your email');
      }
      await resetPassword(email);
      setEmailSent(true);
      toast.success('Password reset email sent!');
    } catch (err) {
      toast.error('Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-background">
        <PublicNavBar />
        
        <div className="min-h-screen flex items-center justify-center px-4 pt-16">
          <div className="absolute inset-0 gradient-mesh opacity-40" />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-md"
          >
            <div className="glass-panel rounded-2xl shadow-elevation-3 p-8 text-center">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-accent" />
              </div>
              <h1 className="mb-2">Check Your Email</h1>
              <p className="text-muted-foreground mb-6">
                We've sent password reset instructions to <strong>{email}</strong>
              </p>
              <Button
                className="w-full"
                onClick={() => setCurrentView('login')}
              >
                Back to Sign In
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

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

            <h1 className="text-center mb-2">Reset Password</h1>
            <p className="text-center text-muted-foreground mb-8">
              Enter your email to receive reset instructions
            </p>

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

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Sending...
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full gap-2"
                onClick={() => setCurrentView('login')}
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Sign In
              </Button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
