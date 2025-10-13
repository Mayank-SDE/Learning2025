import { useState } from 'react';
import { motion } from 'motion/react';
import { User, Bell, Shield, CreditCard, Save } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Separator } from './ui/separator';
import { TopBar } from './TopBar';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

export function SettingsPage() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [notifications, setNotifications] = useState({
    projectComplete: true,
    teamActivity: true,
    newsletter: false,
    productUpdates: true
  });

  const handleSaveProfile = () => {
    toast.success('Profile updated successfully!');
  };

  const handleSaveNotifications = () => {
    toast.success('Notification preferences saved!');
  };

  return (
    <div className="h-screen w-full flex flex-col bg-background">
      <TopBar />

      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="mb-2">Settings</h1>
            <p className="text-muted-foreground mb-8">
              Manage your account settings and preferences
            </p>

            <Tabs defaultValue="profile" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="profile" className="gap-2">
                  <User className="w-4 h-4" />
                  Profile
                </TabsTrigger>
                <TabsTrigger value="notifications" className="gap-2">
                  <Bell className="w-4 h-4" />
                  Notifications
                </TabsTrigger>
                <TabsTrigger value="security" className="gap-2">
                  <Shield className="w-4 h-4" />
                  Security
                </TabsTrigger>
                <TabsTrigger value="billing" className="gap-2">
                  <CreditCard className="w-4 h-4" />
                  Billing
                </TabsTrigger>
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile" className="space-y-6">
                <div className="glass-panel rounded-xl p-6">
                  <h3 className="mb-4">Personal Information</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    <Button onClick={handleSaveProfile} className="gap-2">
                      <Save className="w-4 h-4" />
                      Save Changes
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* Notifications Tab */}
              <TabsContent value="notifications" className="space-y-6">
                <div className="glass-panel rounded-xl p-6">
                  <h3 className="mb-4">Notification Preferences</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="project-complete">Project Completion</Label>
                        <p className="text-sm text-muted-foreground">
                          Notify when 3D processing is complete
                        </p>
                      </div>
                      <Switch
                        id="project-complete"
                        checked={notifications.projectComplete}
                        onCheckedChange={(checked) =>
                          setNotifications({ ...notifications, projectComplete: checked })
                        }
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="team-activity">Team Activity</Label>
                        <p className="text-sm text-muted-foreground">
                          Notify about team comments and changes
                        </p>
                      </div>
                      <Switch
                        id="team-activity"
                        checked={notifications.teamActivity}
                        onCheckedChange={(checked) =>
                          setNotifications({ ...notifications, teamActivity: checked })
                        }
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="newsletter">Newsletter</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive monthly product updates
                        </p>
                      </div>
                      <Switch
                        id="newsletter"
                        checked={notifications.newsletter}
                        onCheckedChange={(checked) =>
                          setNotifications({ ...notifications, newsletter: checked })
                        }
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="product-updates">Product Updates</Label>
                        <p className="text-sm text-muted-foreground">
                          New features and improvements
                        </p>
                      </div>
                      <Switch
                        id="product-updates"
                        checked={notifications.productUpdates}
                        onCheckedChange={(checked) =>
                          setNotifications({ ...notifications, productUpdates: checked })
                        }
                      />
                    </div>
                    <Button onClick={handleSaveNotifications} className="gap-2 mt-4">
                      <Save className="w-4 h-4" />
                      Save Preferences
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* Security Tab */}
              <TabsContent value="security" className="space-y-6">
                <div className="glass-panel rounded-xl p-6">
                  <h3 className="mb-4">Change Password</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="current-password">Current Password</Label>
                      <Input id="current-password" type="password" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <Input id="new-password" type="password" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm New Password</Label>
                      <Input id="confirm-password" type="password" />
                    </div>
                    <Button>Update Password</Button>
                  </div>
                </div>

                <div className="glass-panel rounded-xl p-6">
                  <h3 className="mb-4">Two-Factor Authentication</h3>
                  <p className="text-muted-foreground mb-4">
                    Add an extra layer of security to your account
                  </p>
                  <Button variant="outline">Enable 2FA</Button>
                </div>
              </TabsContent>

              {/* Billing Tab */}
              <TabsContent value="billing" className="space-y-6">
                <div className="glass-panel rounded-xl p-6">
                  <h3 className="mb-4">Current Plan</h3>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4>Pro Plan</h4>
                      <p className="text-muted-foreground">$49/month</p>
                    </div>
                    <Button variant="outline">Change Plan</Button>
                  </div>
                  <Separator className="my-4" />
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Next billing date</span>
                      <span>November 11, 2025</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Payment method</span>
                      <span>•••• •••• •••• 4242</span>
                    </div>
                  </div>
                </div>

                <div className="glass-panel rounded-xl p-6">
                  <h3 className="mb-4">Billing History</h3>
                  <div className="space-y-3">
                    {[
                      { date: 'Oct 11, 2025', amount: '$49.00', status: 'Paid' },
                      { date: 'Sep 11, 2025', amount: '$49.00', status: 'Paid' },
                      { date: 'Aug 11, 2025', amount: '$49.00', status: 'Paid' }
                    ].map((invoice, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                        <div>
                          <p className="font-medium">{invoice.date}</p>
                          <p className="text-sm text-muted-foreground">{invoice.amount}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-accent">{invoice.status}</span>
                          <Button variant="ghost" size="sm">Download</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
