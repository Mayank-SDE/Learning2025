import { motion } from 'motion/react';
import { Check, Zap } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useApp } from './AppContext';
import { PublicNavBar } from './PublicNavBar';

const plans = [
  {
    name: 'Free',
    price: '0',
    description: 'Perfect for trying out VisionCraft',
    features: [
      '5 projects per month',
      'Up to 50 images per project',
      'Basic 3D viewer',
      'Standard resolution export',
      'Community support',
      '1 GB storage'
    ],
    cta: 'Get Started',
    popular: false
  },
  {
    name: 'Pro',
    price: '49',
    description: 'For professional users and teams',
    features: [
      'Unlimited projects',
      'Up to 500 images per project',
      'Advanced 3D viewer with tools',
      'High resolution export',
      'All export formats',
      'Priority support',
      '100 GB storage',
      'Team collaboration (up to 5)',
      'Custom annotations',
      'Advanced measurements'
    ],
    cta: 'Start Free Trial',
    popular: true
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'For large organizations',
    features: [
      'Everything in Pro',
      'Unlimited images per project',
      'Custom processing pipelines',
      'White-label options',
      'SSO & SAML integration',
      'Dedicated support',
      'Unlimited storage',
      'Unlimited team members',
      'API access',
      'Custom SLA',
      'On-premise deployment option'
    ],
    cta: 'Contact Sales',
    popular: false
  }
];

export function PricingPage() {
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
            <h1 className="mb-4">Simple, Transparent Pricing</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Choose the plan that's right for you. All plans include a 14-day free trial.
            </p>
          </motion.div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`
                  glass-panel rounded-2xl p-8 relative
                  ${plan.popular ? 'border-2 border-primary shadow-elevation-3' : 'shadow-elevation-1'}
                `}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 gradient-blue-purple">
                    <Zap className="w-3 h-3 mr-1" />
                    Most Popular
                  </Badge>
                )}

                <div className="text-center mb-6">
                  <h3 className="mb-2">{plan.name}</h3>
                  <div className="flex items-baseline justify-center gap-1 mb-2">
                    {plan.price !== 'Custom' && <span className="text-3xl">$</span>}
                    <span className="text-5xl font-bold">{plan.price}</span>
                    {plan.price !== 'Custom' && <span className="text-muted-foreground">/month</span>}
                  </div>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </div>

                <Button
                  className={`w-full mb-6 ${plan.popular ? 'gradient-blue-purple' : ''}`}
                  variant={plan.popular ? 'default' : 'outline'}
                  onClick={() => setCurrentView(plan.price === 'Custom' ? 'contact' : 'register')}
                >
                  {plan.cta}
                </Button>

                <div className="space-y-3">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          {/* FAQ Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-panel rounded-2xl p-8"
          >
            <h2 className="text-center mb-8">Frequently Asked Questions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 className="mb-2">Can I change plans later?</h4>
                <p className="text-muted-foreground">Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.</p>
              </div>
              <div>
                <h4 className="mb-2">What payment methods do you accept?</h4>
                <p className="text-muted-foreground">We accept all major credit cards, PayPal, and wire transfers for Enterprise plans.</p>
              </div>
              <div>
                <h4 className="mb-2">Is there a setup fee?</h4>
                <p className="text-muted-foreground">No setup fees. You only pay for the plan you choose.</p>
              </div>
              <div>
                <h4 className="mb-2">Can I cancel anytime?</h4>
                <p className="text-muted-foreground">Yes, cancel anytime. No questions asked. Your data remains accessible for 30 days.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
