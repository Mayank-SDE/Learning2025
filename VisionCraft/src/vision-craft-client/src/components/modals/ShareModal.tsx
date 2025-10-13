import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Link2, Mail, Copy, Check } from 'lucide-react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner';

interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  projectName?: string;
}

export function ShareModal({ open, onClose, projectName = 'Project' }: ShareModalProps) {
  const [linkCopied, setLinkCopied] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [expiration, setExpiration] = useState('never');
  const shareLink = `https://visioncraft.io/share/abc123xyz`;

  const handleCopyLink = async () => {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(shareLink);
    } else {
      // Fallback for non-secure contexts
      const ta = document.createElement('textarea');
      ta.value = shareLink;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setLinkCopied(true);
    toast.success('Link copied to clipboard');
  } catch {
    toast.error('Could not copy link');
  } finally {
    setTimeout(() => setLinkCopied(false), 2000);
  }
};

  const handleEmailShare = () => {
    window.location.href = `mailto:?subject=Check out this 3D model&body=View my project: ${shareLink}`;
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-card border border-border rounded-2xl shadow-elevation-3 w-full max-w-md"
        >
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div>
              <h2>Share Project</h2>
              <p className="text-sm text-muted-foreground mt-1">{projectName}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="public">Public Access</Label>
                <p className="text-xs text-muted-foreground">
                  Anyone with the link can view
                </p>
              </div>
              <Switch
                id="public"
                checked={isPublic}
                onCheckedChange={setIsPublic}
              />
            </div>

            {isPublic && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label>Link Expiration</Label>
                  <Select value={expiration} onValueChange={setExpiration}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="never">Never</SelectItem>
                      <SelectItem value="1h">1 hour</SelectItem>
                      <SelectItem value="24h">24 hours</SelectItem>
                      <SelectItem value="7d">7 days</SelectItem>
                      <SelectItem value="30d">30 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Share Link</Label>
                  <div className="flex gap-2">
                    <Input value={shareLink} readOnly />
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={handleCopyLink}
                    >
                      {linkCopied ? (
                        <Check className="w-4 h-4 text-accent" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 gap-2"
                    onClick={handleCopyLink}
                  >
                    <Link2 className="w-4 h-4" />
                    Copy Link
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 gap-2"
                    onClick={handleEmailShare}
                  >
                    <Mail className="w-4 h-4" />
                    Email
                  </Button>
                </div>
              </motion.div>
            )}

            {!isPublic && (
              <div className="text-center py-8 text-muted-foreground">
                <p>Enable public access to generate a shareable link</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
