import { Layers, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/button';
import { useApp } from './AppContext';
import { ThemeToggle } from './ThemeToggle';

export function PublicNavBar() {
  const { setCurrentView } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { name: 'Features', view: 'features' },
    { name: 'Pricing', view: 'pricing' },
    { name: 'About', view: 'about' },
    { name: 'Contact', view: 'contact' }
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button
            onClick={() => setCurrentView('landing')}
            className="flex items-center gap-2 group"
          >
            <div className="relative">
              <div className="absolute inset-0 gradient-blue-purple rounded-lg blur-lg opacity-0 group-hover:opacity-60 transition-opacity" />
              <div className="relative bg-primary/10 p-2 rounded-lg">
                <Layers className="w-6 h-6 text-primary" />
              </div>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              VisionCraft
            </span>
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <button
                key={item.name}
                onClick={() => setCurrentView(item.view)}
                className="text-foreground/80 hover:text-foreground transition-colors"
              >
                {item.name}
              </button>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <div className="hidden md:flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={() => setCurrentView('login')}
              >
                Sign In
              </Button>
              <Button
                onClick={() => setCurrentView('register')}
                className="gradient-blue-purple"
              >
                Get Started
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-border bg-card"
          >
            <div className="px-4 py-4 space-y-3">
              {navItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => {
                    setCurrentView(item.view);
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 rounded-lg hover:bg-muted transition-colors"
                >
                  {item.name}
                </button>
              ))}
              <div className="pt-3 border-t border-border space-y-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setCurrentView('login');
                    setMobileMenuOpen(false);
                  }}
                >
                  Sign In
                </Button>
                <Button
                  className="w-full gradient-blue-purple"
                  onClick={() => {
                    setCurrentView('register');
                    setMobileMenuOpen(false);
                  }}
                >
                  Get Started
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
