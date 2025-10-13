import { motion } from 'motion/react';
import {
  Zap,
  Layers,
  Sparkles,
  Ruler,
  MessageSquare,
  Share2,
  Download,
  Users,
  Shield,
  Cloud,
  Cpu,
  Globe
} from 'lucide-react';
import { Button } from './ui/button';
import { useApp } from './AppContext';
import { PublicNavBar } from './PublicNavBar';

const features = [
  {
    icon: Zap,
    title: 'AI-Powered Processing',
    description: 'Advanced machine learning algorithms automatically generate high-quality 3D meshes from your photos in minutes.',
    gradient: 'from-primary to-secondary'
  },
  {
    icon: Layers,
    title: 'Multi-Format Support',
    description: 'Import and export in all major 3D formats including GLB, GLTF, OBJ, PLY, FBX, STL, and point clouds.',
    gradient: 'from-secondary to-accent'
  },
  {
    icon: Sparkles,
    title: 'Real-Time Viewer',
    description: 'Interactive 3D visualization with smooth navigation, multiple camera angles, and detailed model inspection.',
    gradient: 'from-accent to-primary'
  },
  {
    icon: Ruler,
    title: 'Precision Measurements',
    description: 'Take accurate point-to-point, angle, and area measurements with customizable units and export capabilities.',
    gradient: 'from-primary to-accent'
  },
  {
    icon: MessageSquare,
    title: 'Collaborative Annotations',
    description: 'Add text labels, image pins, and comments directly on your 3D models. Share insights with your team in real-time.',
    gradient: 'from-secondary to-primary'
  },
  {
    icon: Share2,
    title: 'Easy Sharing',
    description: 'Generate secure sharing links with customizable permissions. Embed models on your website or share with clients.',
    gradient: 'from-accent to-secondary'
  },
  {
    icon: Download,
    title: 'Batch Export',
    description: 'Export multiple formats simultaneously with custom quality settings, textures, and optimization options.',
    gradient: 'from-primary to-secondary'
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description: 'Work together in real-time with multi-user support, role-based access control, and activity tracking.',
    gradient: 'from-secondary to-accent'
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'Bank-level encryption, SOC 2 compliance, SSO integration, and detailed audit logs for enterprise peace of mind.',
    gradient: 'from-accent to-primary'
  },
  {
    icon: Cloud,
    title: 'Cloud Processing',
    description: 'Leverage powerful cloud infrastructure for heavy processing. No local hardware limitations.',
    gradient: 'from-primary to-accent'
  },
  {
    icon: Cpu,
    title: 'GPU Acceleration',
    description: 'Optimized rendering pipeline with WebGL 2.0 and WebGPU support for smooth, high-performance visualization.',
    gradient: 'from-secondary to-primary'
  },
  {
    icon: Globe,
    title: 'Cross-Platform',
    description: 'Works seamlessly on desktop, tablet, and mobile. Progressive web app with offline capabilities.',
    gradient: 'from-accent to-secondary'
  }
];

export function FeaturesPage() {
  const { setCurrentView } = useApp();

  return (
    <div className="min-h-screen bg-background">
      <PublicNavBar />
      
      <div className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h1 className="mb-4">Powerful Features for 3D Visualization</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Everything you need to transform photos into interactive 3D models,
              measure, annotate, and share your work with the world.
            </p>
          </motion.div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="glass-panel rounded-xl p-6 hover:shadow-elevation-2 transition-all duration-300 group"
              >
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.gradient} p-2.5 mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-full h-full text-white" />
                </div>
                <h3 className="mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="glass-panel rounded-2xl p-12 text-center gradient-mesh"
          >
            <h2 className="mb-4">Ready to Get Started?</h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of professionals using VisionCraft for their 3D visualization needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="gradient-blue-purple px-8"
                onClick={() => setCurrentView('register')}
              >
                Start Free Trial
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setCurrentView('pricing')}
              >
                View Pricing
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
