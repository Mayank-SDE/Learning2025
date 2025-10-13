import { Bell } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { useApp } from './AppContext';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';
import { formatDistanceToNow } from 'date-fns';

export function NotificationBell() {
  const { notifications, markNotificationRead } = useApp();
  const unreadCount = notifications.filter((n) => !n.read).length;

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-accent';
      case 'error':
        return 'text-destructive';
      case 'warning':
        return 'text-yellow-500';
      default:
        return 'text-primary';
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-white text-xs rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary">{unreadCount} new</Badge>
            )}
          </div>
        </div>
        <ScrollArea className="h-96">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => markNotificationRead(notification.id)}
                  className={`
                    w-full p-4 text-left hover:bg-muted/50 transition-colors
                    ${!notification.read ? 'bg-primary/5' : ''}
                  `}
                >
                  <div className="flex gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${getNotificationColor(notification.type)}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="text-sm">{notification.title}</h4>
                        {!notification.read && (
                          <span className="w-2 h-2 bg-primary rounded-full shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {notification.message}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
