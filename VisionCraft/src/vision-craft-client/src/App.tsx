import { ThemeProvider } from './components/ThemeProvider';
import { AppProvider, useApp } from './components/AppContext';
import { AuthProvider, useAuth } from './components/AuthContext';
import { LandingPage } from './components/LandingPage';
import { PublicNavBar } from './components/PublicNavBar';
import { LoginPage } from './components/LoginPage';
import { RegisterPage } from './components/RegisterPage';
import { ForgotPasswordPage } from './components/ForgotPasswordPage';
import { FeaturesPage } from './components/FeaturesPage';
import { PricingPage } from './components/PricingPage';
import { AboutPage } from './components/AboutPage';
import { ContactPage } from './components/ContactPage';
import { TermsPage } from './components/TermsPage';
import { PrivacyPage } from './components/PrivacyPage';
import { SettingsPage } from './components/SettingsPage';
import { CreateProjectModal } from './components/CreateProjectModal';
import { ProcessingPage } from './components/ProcessingPage';
import { EnhancedDashboard } from './components/EnhancedDashboard';
import { ProjectListModal } from './components/ProjectListModal';
import { Footer } from './components/Footer';
import { Toaster } from './components/ui/sonner';

function AppContent() {
  const { currentView, setCurrentView } = useApp();
  const { isAuthenticated } = useAuth();

  // Public pages that show navbar and footer
  const publicPages = ['landing', 'features', 'pricing', 'about', 'contact', 'terms', 'privacy'];
  const authPages = ['login', 'register', 'forgot-password'];
  const showPublicNav = publicPages.includes(currentView) || authPages.includes(currentView);
  const showFooter = publicPages.includes(currentView);

  // If user tries to access dashboard/processing without being authenticated
  if (['dashboard', 'processing', 'create-project', 'settings'].includes(currentView) && !isAuthenticated) {
    setCurrentView('login');
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Public Navigation Bar */}
      {showPublicNav && <PublicNavBar />}

      {/* Main Content */}
      <div className={`flex-1 ${showPublicNav ? 'pt-16' : ''}`}>
        {/* Landing & Public Pages */}
        {currentView === 'landing' && <LandingPage />}
        {currentView === 'features' && <FeaturesPage />}
        {currentView === 'pricing' && <PricingPage />}
        {currentView === 'about' && <AboutPage />}
        {currentView === 'contact' && <ContactPage />}
        {currentView === 'terms' && <TermsPage />}
        {currentView === 'privacy' && <PrivacyPage />}

        {/* Auth Pages */}
        {currentView === 'login' && <LoginPage />}
        {currentView === 'register' && <RegisterPage />}
        {currentView === 'forgot-password' && <ForgotPasswordPage />}

        {/* App Pages (Authenticated) */}
        {currentView === 'dashboard' && isAuthenticated && <EnhancedDashboard />}
        {currentView === 'processing' && isAuthenticated && <ProcessingPage />}
        {currentView === 'settings' && isAuthenticated && <SettingsPage />}

        {/* Modals */}
        <CreateProjectModal
          open={currentView === 'create-project'}
          onClose={() => setCurrentView(isAuthenticated ? 'dashboard' : 'landing')}
        />
      </div>

      {/* Footer for public pages */}
      {showFooter && <Footer />}

      {/* Toast Notifications */}
      <Toaster position="top-right" richColors closeButton />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppProvider>
          <AppContent />
        </AppProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
