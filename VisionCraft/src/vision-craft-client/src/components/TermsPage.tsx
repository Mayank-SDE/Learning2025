import { motion } from 'motion/react';
import { PublicNavBar } from './PublicNavBar';
import { ScrollArea } from './ui/scroll-area';

export function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <PublicNavBar />
      
      <div className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="mb-4">Terms of Service</h1>
            <p className="text-muted-foreground mb-8">Last updated: October 11, 2025</p>

            <div className="glass-panel rounded-2xl p-8 space-y-6">
              <section>
                <h2 className="mb-3">1. Acceptance of Terms</h2>
                <p className="text-muted-foreground">
                  By accessing and using VisionCraft ("the Service"), you accept and agree to be bound by the
                  terms and provision of this agreement. If you do not agree to these Terms of Service, please
                  do not use the Service.
                </p>
              </section>

              <section>
                <h2 className="mb-3">2. Use License</h2>
                <p className="text-muted-foreground mb-3">
                  Permission is granted to temporarily access and use the Service for personal or commercial purposes
                  subject to these Terms of Service. This is the grant of a license, not a transfer of title.
                </p>
                <p className="text-muted-foreground">
                  Under this license, you may not:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 mt-2 ml-4">
                  <li>Modify or copy the Service materials</li>
                  <li>Use the materials for any commercial purpose without proper licensing</li>
                  <li>Attempt to decompile or reverse engineer any software contained in the Service</li>
                  <li>Remove any copyright or other proprietary notations</li>
                </ul>
              </section>

              <section>
                <h2 className="mb-3">3. User Accounts</h2>
                <p className="text-muted-foreground">
                  When you create an account with us, you must provide accurate, complete, and current information.
                  Failure to do so constitutes a breach of the Terms. You are responsible for safeguarding the
                  password and for all activities that occur under your account.
                </p>
              </section>

              <section>
                <h2 className="mb-3">4. Intellectual Property</h2>
                <p className="text-muted-foreground">
                  The Service and its original content, features, and functionality are owned by VisionCraft and
                  are protected by international copyright, trademark, patent, trade secret, and other intellectual
                  property laws. You retain all rights to the 3D models you create using our Service.
                </p>
              </section>

              <section>
                <h2 className="mb-3">5. User Content</h2>
                <p className="text-muted-foreground">
                  You retain ownership of any content you upload to VisionCraft. By uploading content, you grant us
                  a license to use, store, and process your content solely for the purpose of providing the Service.
                  We will not use your content for any other purpose without your explicit consent.
                </p>
              </section>

              <section>
                <h2 className="mb-3">6. Payment Terms</h2>
                <p className="text-muted-foreground">
                  Certain aspects of the Service may be provided for a fee. You agree to pay all fees in accordance
                  with the pricing and payment terms presented to you for that Service. We reserve the right to change
                  our pricing with 30 days notice.
                </p>
              </section>

              <section>
                <h2 className="mb-3">7. Termination</h2>
                <p className="text-muted-foreground">
                  We may terminate or suspend your account immediately, without prior notice, for any breach of these
                  Terms. Upon termination, your right to use the Service will immediately cease. You may terminate
                  your account at any time through the Settings page.
                </p>
              </section>

              <section>
                <h2 className="mb-3">8. Limitation of Liability</h2>
                <p className="text-muted-foreground">
                  In no event shall VisionCraft be liable for any indirect, incidental, special, consequential or
                  punitive damages arising out of your use or inability to use the Service.
                </p>
              </section>

              <section>
                <h2 className="mb-3">9. Contact Information</h2>
                <p className="text-muted-foreground">
                  If you have any questions about these Terms, please contact us at legal@visioncraft.io
                </p>
              </section>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
