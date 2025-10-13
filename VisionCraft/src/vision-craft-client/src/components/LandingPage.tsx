import { motion } from 'motion/react';
import { Sparkles, Layers, Zap, ArrowRight, Upload, Eye, Download } from 'lucide-react';
import { Button } from './ui/button';
import { useApp } from './AppContext';
import { useAuth } from './AuthContext';

export function LandingPage() {
  const { setCurrentView } = useApp();
  const { isAuthenticated } = useAuth();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      setCurrentView('create-project');
    } else {
      setCurrentView('register');
    }
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-background">
      {/* Animated Background */}
      <div className="absolute inset-0 gradient-mesh opacity-60" />
      
      {/* Floating Gradient Blobs */}
      <motion.div
        className="absolute top-20 left-10 w-96 h-96 rounded-full opacity-30 blur-3xl"
        style={{ background: 'radial-gradient(circle, var(--electric-blue) 0%, transparent 70%)' }}
        animate={{
          x: [0, 50, 0],
          y: [0, 30, 0],
          scale: [1, 1.1, 1]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-20 right-10 w-96 h-96 rounded-full opacity-30 blur-3xl"
        style={{ background: 'radial-gradient(circle, var(--violet) 0%, transparent 70%)' }}
        animate={{
          x: [0, -50, 0],
          y: [0, -30, 0],
          scale: [1, 1.2, 1]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-4xl"
        >
          {/* Logo */}
          <motion.div
            className="flex items-center justify-center gap-3 mb-8"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <div className="relative">
              <div className="absolute inset-0 gradient-blue-purple rounded-2xl blur-xl opacity-60" />
              <div className="relative bg-card p-4 rounded-2xl shadow-elevation-2">
                <Layers className="w-10 h-10 text-primary" />
              </div>
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              VisionCraft
            </h1>
          </motion.div>

          {/* Tagline */}
          <motion.h2
            className="text-4xl md:text-6xl mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            From Photos to 3D Reality
          </motion.h2>

          <motion.p
            className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            Transform your images into industry-grade 3D models with AI-powered photogrammetry.
            Upload, process, and visualize in minutes.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Button
              size="lg"
              className="relative overflow-hidden group px-8 py-6 bg-primary hover:bg-primary/90"
              onClick={handleGetStarted}
            >
              <span className="relative z-10 flex items-center gap-2">
                {isAuthenticated ? 'Create New Project' : 'Get Started Free'}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-primary to-secondary opacity-0 group-hover:opacity-100"
                transition={{ duration: 0.3 }}
              />
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="px-8 py-6 border-2"
              onClick={() => setCurrentView(isAuthenticated ? 'dashboard' : 'features')}
            >
              <span className="flex items-center gap-2">
                {isAuthenticated ? 'View Dashboard' : 'Learn More'}
                <Sparkles className="w-5 h-5" />
              </span>
            </Button>
          </motion.div>

          {/* Features */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
          >
            <FeatureCard
              icon={<Upload className="w-6 h-6" />}
              title="Simple Upload"
              description="Drag and drop images, ZIP files, or entire folders to get started"
            />
            <FeatureCard
              icon={<Zap className="w-6 h-6" />}
              title="AI Processing"
              description="Advanced photogrammetry algorithms create stunning 3D models"
            />
            <FeatureCard
              icon={<Eye className="w-6 h-6" />}
              title="Interactive Viewer"
              description="Inspect, measure, annotate, and analyze your models in real-time"
            />
          </motion.div>

          {/* How It Works */}
          <motion.div
            className="mt-32 max-w-5xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
          >
            <h2 className="text-center mb-12">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { step: '1', title: 'Upload Images', desc: 'Add 20-30 photos of your object from different angles' },
                { step: '2', title: 'AI Processing', desc: 'Our engine creates a textured 3D mesh automatically' },
                { step: '3', title: 'View & Export', desc: 'Inspect in our viewer and export to any format you need' }
              ].map((item, i) => (
                <div key={i} className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-2xl font-bold">
                    {item.step}
                  </div>
                  <h3 className="mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <motion.div
      className="glass-panel rounded-xl p-6 shadow-elevation-1 hover:shadow-elevation-2 transition-all duration-300"
      whileHover={{ y: -4 }}
    >
      <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4 text-primary">
        {icon}
      </div>
      <h3 className="mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </motion.div>
  );
}
