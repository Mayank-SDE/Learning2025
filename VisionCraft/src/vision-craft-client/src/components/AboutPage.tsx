import { motion } from 'motion/react';
import { Target, Users, Zap, Award } from 'lucide-react';
import { Button } from './ui/button';
import { useApp } from './AppContext';
import { PublicNavBar } from './PublicNavBar';
import { ImageWithFallback } from './figma/ImageWithFallback';

const values = [
  {
    icon: Target,
    title: 'Innovation First',
    description: 'We push the boundaries of 3D visualization technology to deliver cutting-edge solutions.'
  },
  {
    icon: Users,
    title: 'Customer Focused',
    description: 'Your success is our success. We build tools that solve real-world problems.'
  },
  {
    icon: Zap,
    title: 'Speed & Quality',
    description: 'We believe in delivering both fast results and exceptional quality, never compromising.'
  },
  {
    icon: Award,
    title: 'Excellence',
    description: 'We strive for excellence in every line of code and every pixel on screen.'
  }
];

const team = [
  { name: 'Alex Chen', role: 'CEO & Founder', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex' },
  { name: 'Sarah Johnson', role: 'CTO', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah' },
  { name: 'Michael Park', role: 'Head of Product', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=michael' },
  { name: 'Emma Davis', role: 'Lead Engineer', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=emma' }
];

export function AboutPage() {
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
            <h1 className="mb-4">About VisionCraft</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              We're on a mission to make 3D visualization accessible to everyone,
              from individual creators to enterprise teams.
            </p>
          </motion.div>

          {/* Story Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-24 items-center"
          >
            <div>
              <h2 className="mb-4">Our Story</h2>
              <p className="text-muted-foreground mb-4">
                Founded in 2023, VisionCraft was born from a simple frustration: 3D reconstruction
                tools were either too complex for beginners or too limited for professionals.
              </p>
              <p className="text-muted-foreground mb-4">
                We set out to build a platform that combines the power of AI with an intuitive
                interface, making it easy for anyone to transform photos into stunning 3D models.
              </p>
              <p className="text-muted-foreground mb-6">
                Today, VisionCraft is trusted by thousands of professionals across industries like
                architecture, construction, real estate, and digital preservation.
              </p>
              <Button
                size="lg"
                className="gradient-blue-purple"
                onClick={() => setCurrentView('register')}
              >
                Join Us Today
              </Button>
            </div>
            <div className="relative h-96 rounded-2xl overflow-hidden shadow-elevation-3">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80"
                alt="VisionCraft Team"
                className="w-full h-full object-cover"
              />
            </div>
          </motion.div>

          {/* Values */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-24"
          >
            <h2 className="text-center mb-12">Our Values</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {values.map((value, index) => (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="glass-panel rounded-xl p-6 text-center"
                >
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <value.icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="mb-2">{value.title}</h3>
                  <p className="text-sm text-muted-foreground">{value.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Team */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-24"
          >
            <h2 className="text-center mb-4">Meet the Team</h2>
            <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
              We're a diverse team of engineers, designers, and 3D enthusiasts
              passionate about making technology accessible.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {team.map((member, index) => (
                <motion.div
                  key={member.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="glass-panel rounded-xl p-6 text-center hover:shadow-elevation-2 transition-all"
                >
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-24 h-24 rounded-full mx-auto mb-4"
                  />
                  <h4 className="mb-1">{member.name}</h4>
                  <p className="text-sm text-muted-foreground">{member.role}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="glass-panel rounded-2xl p-12 text-center gradient-mesh"
          >
            <h2 className="mb-4">Want to Join Our Mission?</h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              We're always looking for talented individuals who share our passion for innovation.
            </p>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setCurrentView('contact')}
            >
              Get in Touch
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
