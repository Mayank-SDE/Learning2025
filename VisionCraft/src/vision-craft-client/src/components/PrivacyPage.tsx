import { motion } from 'motion/react';
import { PublicNavBar } from './PublicNavBar';

export function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <PublicNavBar />
      
      <div className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="mb-4">Privacy Policy</h1>
            <p className="text-muted-foreground mb-8">Last updated: October 11, 2025</p>

            <div className="glass-panel rounded-2xl p-8 space-y-6">
              <section>
                <h2 className="mb-3">1. Introduction</h2>
                <p className="text-muted-foreground">
                  VisionCraft ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy
                  explains how we collect, use, disclose, and safeguard your information when you use our Service.
                </p>
              </section>

              <section>
                <h2 className="mb-3">2. Information We Collect</h2>
                <h4 className="mb-2">Personal Information</h4>
                <p className="text-muted-foreground mb-3">
                  We collect information that you provide directly to us, including:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                  <li>Name and email address</li>
                  <li>Payment information (processed securely through third-party providers)</li>
                  <li>Account preferences and settings</li>
                  <li>Communications with us</li>
                </ul>

                <h4 className="mb-2 mt-4">Usage Information</h4>
                <p className="text-muted-foreground mb-3">
                  We automatically collect certain information about your device and usage:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                  <li>Device information (browser type, operating system)</li>
                  <li>IP address and location data</li>
                  <li>Usage statistics and analytics</li>
                  <li>Cookies and similar technologies</li>
                </ul>
              </section>

              <section>
                <h2 className="mb-3">3. How We Use Your Information</h2>
                <p className="text-muted-foreground mb-3">We use your information to:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                  <li>Provide, maintain, and improve our Service</li>
                  <li>Process your transactions and manage your account</li>
                  <li>Send you technical notices and support messages</li>
                  <li>Respond to your comments and questions</li>
                  <li>Analyze usage patterns and optimize performance</li>
                  <li>Detect and prevent fraud and abuse</li>
                </ul>
              </section>

              <section>
                <h2 className="mb-3">4. Data Storage and Security</h2>
                <p className="text-muted-foreground">
                  We implement appropriate technical and organizational measures to protect your personal information.
                  Your uploaded images and generated 3D models are encrypted at rest and in transit. We use
                  industry-standard security protocols and regularly audit our systems.
                </p>
              </section>

              <section>
                <h2 className="mb-3">5. Data Retention</h2>
                <p className="text-muted-foreground">
                  We retain your personal information for as long as necessary to provide you with our Service and
                  as required by law. You can request deletion of your account and associated data at any time
                  through your account settings.
                </p>
              </section>

              <section>
                <h2 className="mb-3">6. Your Rights</h2>
                <p className="text-muted-foreground mb-3">You have the right to:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                  <li>Access your personal data</li>
                  <li>Correct inaccurate data</li>
                  <li>Request deletion of your data</li>
                  <li>Object to processing of your data</li>
                  <li>Export your data</li>
                  <li>Withdraw consent at any time</li>
                </ul>
              </section>

              <section>
                <h2 className="mb-3">7. Third-Party Services</h2>
                <p className="text-muted-foreground">
                  We may use third-party services for analytics, payment processing, and infrastructure. These
                  third parties have access to your information only to perform specific tasks on our behalf and
                  are obligated not to disclose or use it for other purposes.
                </p>
              </section>

              <section>
                <h2 className="mb-3">8. International Data Transfers</h2>
                <p className="text-muted-foreground">
                  Your information may be transferred to and processed in countries other than your country of
                  residence. We ensure appropriate safeguards are in place for such transfers.
                </p>
              </section>

              <section>
                <h2 className="mb-3">9. Children's Privacy</h2>
                <p className="text-muted-foreground">
                  Our Service is not intended for children under 13 years of age. We do not knowingly collect
                  personal information from children under 13.
                </p>
              </section>

              <section>
                <h2 className="mb-3">10. Changes to This Policy</h2>
                <p className="text-muted-foreground">
                  We may update this Privacy Policy from time to time. We will notify you of any changes by posting
                  the new Privacy Policy on this page and updating the "Last updated" date.
                </p>
              </section>

              <section>
                <h2 className="mb-3">11. Contact Us</h2>
                <p className="text-muted-foreground">
                  If you have questions about this Privacy Policy, please contact us at privacy@visioncraft.io
                </p>
              </section>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
