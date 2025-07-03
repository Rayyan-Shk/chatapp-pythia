"use client";

import { useState } from "react";
import { useNotificationStore } from "@/lib/store/notificationStore";
import { useChatStore } from "@/lib/store/chatStore";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Bell,
  BellRing,
  Check,
  CheckCheck,
  MoreHorizontal,
  Settings,
  Trash,
  Hash,
  User,
  MessageSquare,
  UserPlus,
  UserMinus,
  FileText,
  Heart,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NotificationData } from "@repo/types";

interface NotificationPanelProps {
  children: React.ReactNode;
}

export const NotificationPanel = ({ children }: NotificationPanelProps) => {
  const {
    notifications,
    unreadCount,
    panelOpen,
    setPanelOpen,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
  } = useNotificationStore();

  const { setActiveChannelId } = useChatStore();
  const [selectedTab, setSelectedTab] = useState<'all' | 'unread'>('all');

  const filteredNotifications = selectedTab === 'unread' 
    ? notifications.filter(n => !n.read)
    : notifications;

  const handleNotificationClick = (notification: NotificationData) => {
    // Mark as read
    if (!notification.read) {
      markAsRead(notification.id);
    }

    // Navigate to relevant content
    if (notification.channel_id) {
      setActiveChannelId(notification.channel_id);
    }

    // Close panel on mobile
    if (window.innerWidth < 768) {
      setPanelOpen(false);
    }
  };

  const getNotificationIcon = (type: NotificationData['type']) => {
    switch (type) {
      case 'mention':
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case 'message':
        return <MessageSquare className="h-4 w-4 text-green-500" />;
      case 'channel_invite':
        return <Hash className="h-4 w-4 text-purple-500" />;
      case 'user_joined':
        return <UserPlus className="h-4 w-4 text-green-500" />;
      case 'user_left':
        return <UserMinus className="h-4 w-4 text-red-500" />;
      case 'file_shared':
        return <FileText className="h-4 w-4 text-orange-500" />;
      case 'reaction_added':
        return <Heart className="h-4 w-4 text-pink-500" />;
      default:
        return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const formatNotificationTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = (now.getTime() - date.getTime()) / (1000 * 60);
    
    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${Math.floor(diffInMinutes)}m ago`;
    } else if (diffInMinutes < 1440) { // 24 hours
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  return (
    <Sheet open={panelOpen} onOpenChange={setPanelOpen}>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      
      <SheetContent side="right" className="w-full sm:w-96 max-w-md p-0">
        <SheetHeader className="p-4 pb-0">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <BellRing className="h-5 w-5" />
              Notifications
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {unreadCount}
                </Badge>
              )}
            </SheetTitle>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={markAllAsRead} disabled={unreadCount === 0}>
                  <CheckCheck className="h-4 w-4 mr-2" />
                  Mark all as read
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={clearAllNotifications}
                  disabled={notifications.length === 0}
                  className="text-destructive"
                >
                  <Trash className="h-4 w-4 mr-2" />
                  Clear all
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings className="h-4 w-4 mr-2" />
                  Notification settings
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {/* Filter tabs */}
          <div className="flex border rounded-lg p-1 mt-3">
            <Button
              variant={selectedTab === 'all' ? 'secondary' : 'ghost'}
              size="sm"
              className="flex-1 h-8"
              onClick={() => setSelectedTab('all')}
            >
              All ({notifications.length})
            </Button>
            <Button
              variant={selectedTab === 'unread' ? 'secondary' : 'ghost'}
              size="sm"
              className="flex-1 h-8"
              onClick={() => setSelectedTab('unread')}
            >
              Unread ({unreadCount})
            </Button>
          </div>
        </SheetHeader>

        <Separator />

        <ScrollArea className="flex-1">
          <div className="p-4">
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  {selectedTab === 'unread' 
                    ? "No unread notifications"
                    : "No notifications yet"
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "group relative rounded-lg border p-3 cursor-pointer transition-colors hover:bg-muted/50",
                      !notification.read && "bg-blue-50/50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800"
                    )}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    {/* Unread indicator */}
                    {!notification.read && (
                      <div className="absolute left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full" />
                    )}
                    
                    <div className="flex items-start gap-3 pl-3">
                      {/* Icon */}
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium leading-tight">
                            {notification.title}
                          </p>
                          
                          {/* Actions */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                            {!notification.read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification.id);
                                }}
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeNotification(notification.id);
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        
                        <p className="text-sm text-muted-foreground leading-tight">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {notification.channel_name && (
                            <>
                              <Hash className="h-3 w-3" />
                              <span>{notification.channel_name}</span>
                            </>
                          )}
                          {notification.username && (
                            <>
                              <User className="h-3 w-3" />
                              <span>{notification.username}</span>
                            </>
                          )}
                          <span>•</span>
                          <span>{formatNotificationTime(notification.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}; 