import { Layers } from 'lucide-react';
import { useApp } from './AppContext';

export function Footer() {
  const { setCurrentView } = useApp();

  const footerLinks = {
    product: [
      { name: 'Features', view: 'features' },
      { name: 'Pricing', view: 'pricing' },
      { name: 'About', view: 'about' }
    ],
    support: [
      { name: 'Contact', view: 'contact' },
      { name: 'Help Center', view: 'contact' },
      { name: 'Status', view: 'contact' }
    ],
    legal: [
      { name: 'Privacy', view: 'privacy' },
      { name: 'Terms', view: 'terms' },
      { name: 'Security', view: 'privacy' }
    ]
  };

  return (
    <footer className="border-t border-border bg-card/50 backdrop-blur-sm mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Logo & Description */}
          <div className="col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-primary/10 p-1.5 rounded-lg">
                <Layers className="w-5 h-5 text-primary" />
              </div>
              <span className="font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                VisionCraft
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Transform your photos into stunning 3D models with AI-powered photogrammetry.
            </p>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="mb-3">Product</h4>
            <ul className="space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <button
                    onClick={() => setCurrentView(link.view)}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="mb-3">Support</h4>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <button
                    onClick={() => setCurrentView(link.view)}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="mb-3">Legal</h4>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <button
                    onClick={() => setCurrentView(link.view)}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © 2025 VisionCraft. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Twitter
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              GitHub
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              LinkedIn
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
