import { useState } from 'react';
import { motion } from 'motion/react';
import {
  PanelsTopLeft,
  Bell,
  Settings,
  Sparkles,
  ChevronDown,
  LogOut,
  Download,
  Link2,
  Keyboard,
  Plus,
} from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { useApp } from './AppContext';
import { useAuth } from './AuthContext';
import { ProjectListModal } from './ProjectListModal';
import { toast } from 'sonner';

type TopBarProps = {
  onExport?: () => void;
  onShare?: () => void;
  onShortcuts?: () => void;
  onStartTour?: () => void;
};

export function TopBar({
  onExport = () => {},
  onShare = () => {},
  onShortcuts = () => {},
  onStartTour = () => {},
}: TopBarProps) {
  const { setCurrentView, notifications, clearNotifications } = useApp();
  const { user, logout } = useAuth?.() ?? { user: undefined, logout: () => {} };
  const [projectsOpen, setProjectsOpen] = useState(false);

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="h-14 border-b border-border bg-card/70 backdrop-blur sticky top-0 z-40"
      >
        <div className="h-full max-w-screen-2xl mx-auto px-3 flex items-center gap-3">
          {/* Brand / Home */}
          <button
            onClick={() => setCurrentView('dashboard')}
            className="flex items-center gap-2 group"
            aria-label="Go to Dashboard"
          >
            <Sparkles className="w-5 h-5 text-primary group-hover:rotate-12 transition-transform" />
            <span className="font-semibold">VisionCraft</span>
          </button>

          {/* Quick search (local for now) */}
          <div className="hidden md:flex items-center ml-4 flex-1 max-w-xl">
            <Input placeholder="Search projects, files, jobs…" />
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* All Projects */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setProjectsOpen(true)}
              className="gap-2"
            >
              <PanelsTopLeft className="w-4 h-4" />
              All Projects
            </Button>

            {/* New Project */}
            <Button
              size="sm"
              className="gap-2"
              onClick={() => setCurrentView('create-project')}
            >
              <Plus className="w-4 h-4" />
              New
            </Button>

            {/* Export */}
            <Button variant="ghost" size="icon" onClick={onExport} className="rounded-full">
              <Download className="w-5 h-5" />
            </Button>

            {/* Share */}
            <Button variant="ghost" size="icon" onClick={onShare} className="rounded-full">
              <Link2 className="w-5 h-5" />
            </Button>

            {/* Shortcuts */}
            <Button variant="ghost" size="icon" onClick={onShortcuts} className="rounded-full">
              <Keyboard className="w-5 h-5" />
            </Button>

            {/* Tour */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onStartTour}
              className="rounded-full"
              title="Start interactive tour"
            >
              <Sparkles className="w-5 h-5" />
            </Button>

            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative rounded-full">
                  <Bell className="w-5 h-5" />
                  {unread > 0 && (
                    <Badge
                      variant="secondary"
                      className="absolute -top-1 -right-1 h-5 min-w-5 px-1 py-0 text-[10px] leading-5 rounded-full bg-primary text-white border-none"
                    >
                      {unread}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.length === 0 ? (
                  <div className="p-3 text-sm text-muted-foreground">
                    No notifications yet
                  </div>
                ) : (
                  <>
                    <div className="max-h-64 overflow-auto">
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          className="p-3 border-b last:border-0 border-border/60"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">{n.title}</span>
                            <Badge
                              variant={
                                n.type === 'success'
                                  ? 'secondary'
                                  : n.type === 'error'
                                  ? 'destructive'
                                  : 'outline'
                              }
                              className="text-[10px]"
                            >
                              {n.type}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {n.message}
                          </p>
                        </div>
                      ))}
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => {
                        clearNotifications();
                        toast.info('Cleared notifications');
                      }}
                      className="text-destructive focus:text-destructive"
                    >
                      Clear all
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Settings */}
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={() => setCurrentView('settings')}
            >
              <Settings className="w-5 h-5" />
            </Button>

            {/* Account */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/15 grid place-items-center">
                    {(user?.name?.[0] ?? 'U').toUpperCase()}
                  </div>
                  <span className="hidden sm:inline text-sm">
                    {user?.name ?? 'User'}
                  </span>
                  <ChevronDown className="w-4 h-4 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setCurrentView('settings')}>
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    logout?.();
                    toast.success('Signed out');
                    setCurrentView('landing');
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </motion.header>

      {/* All Projects modal */}
      <ProjectListModal open={projectsOpen} onClose={() => setProjectsOpen(false)} />
    </>
  );
}
