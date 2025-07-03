"use client";

import { useState } from "react";
import { Channel, User } from "@repo/types";
import { useChatStore } from "@/lib/store/chatStore";
import { useWebSocketStore } from "@/lib/store/websocketStore";
import { useAuthStore } from "@/lib/store/authStore";
import { useUIStore } from "@/lib/store/uiStore";
import { wsClient } from "@/lib/websocket/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { 
  Hash, 
  Users, 
  Settings, 
  Search, 
  UserPlus,
  MoreHorizontal,
  Wifi,
  WifiOff,
  RefreshCw,
  Star,
  Pin,
  Bell,
  BellOff
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface ChannelHeaderProps {
  channel: Channel;
}

export const ChannelHeader = ({ channel }: ChannelHeaderProps) => {
  console.log("🏷️ ChannelHeader: Rendering with channel", { 
    name: channel.name, 
    is_public: channel.is_public,
    type: channel.is_public ? 'PUBLIC' : 'PRIVATE'
  });
  const { getChannelMembers } = useChatStore();
  const { connectionStatus } = useWebSocketStore();
  const { user: currentUser } = useAuthStore();
  const { openModal } = useUIStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isNotificationEnabled, setIsNotificationEnabled] = useState(true);

  const members = getChannelMembers(channel.id);
  const memberCount = members.length;
  
  const isConnected = connectionStatus === "connected";

  const handleReconnect = async () => {
    try {
      wsClient.disconnect();
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      if (useAuthStore.getState().token) {
        await wsClient.connect(useAuthStore.getState().token!);
      }
      toast({
        title: "Reconnecting...",
        description: "Attempting to reconnect to the server",
      });
    } catch (error) {
      toast({
        title: "Reconnection failed",
        description: "Could not reconnect to the server",
        variant: "destructive",
      });
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    // TODO: Implement search functionality
    toast({
      title: "Search",
      description: `Searching for: ${searchQuery}`,
    });
  };

  const toggleNotifications = () => {
    setIsNotificationEnabled(!isNotificationEnabled);
    toast({
      title: isNotificationEnabled ? "Notifications disabled" : "Notifications enabled",
      description: `Channel notifications are now ${isNotificationEnabled ? 'off' : 'on'}`,
    });
  };

  const handleAddUser = () => {
    openModal("addUser");
  };

  return (
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between p-4">
        {/* Left side - Channel info */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Hash className="h-5 w-5 text-muted-foreground" />
            <h1 className="font-semibold text-lg truncate">{channel.name}</h1>
            
            {/* Connection status indicator */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center">
                    {isConnected ? (
                      <Wifi className="h-4 w-4 text-success" />
                    ) : (
                      <WifiOff className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isConnected ? "Connected" : "Disconnected"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          {channel.description && (
            <span className="text-sm text-muted-foreground truncate">
              {channel.description}
            </span>
          )}
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-1">
          {/* Members dropdown */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1"
                    >
                      <Users className="h-4 w-4" />
                      <span className="text-sm">{memberCount}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64 max-h-80 overflow-y-auto">
                    <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground border-b">
                      Channel Members ({memberCount})
                    </div>
                    {members.length === 0 ? (
                      <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                        No members found
                      </div>
                    ) : (
                      members.map((member) => (
                        <DropdownMenuItem key={member.id} className="flex items-center gap-2 p-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={member.avatar} alt={member.username} />
                            <AvatarFallback className="text-xs">
                              {member.username.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                              <span className="text-sm font-medium truncate">
                                {member.username}
                              </span>
                              {member.id === currentUser?.id && (
                                <Badge variant="outline" className="text-xs px-1">
                                  You
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {member.email}
                            </div>
                          </div>
                        </DropdownMenuItem>
                      ))
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TooltipTrigger>
              <TooltipContent>
                <p>Show members ({memberCount})</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Search toggle */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchOpen(!searchOpen)}
                  className={cn(searchOpen && "bg-muted")}
                >
                  <Search className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Search in channel</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Notification toggle */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleNotifications}
                >
                  {isNotificationEnabled ? (
                    <Bell className="h-4 w-4" />
                  ) : (
                    <BellOff className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isNotificationEnabled ? "Disable notifications" : "Enable notifications"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Add User (only for private channels) */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleAddUser}
                >
                  <UserPlus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Add user to channel</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Theme toggle */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <ThemeToggle />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Toggle theme</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Reconnect button (only show when disconnected) */}
          {!isConnected && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleReconnect}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Reconnect</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* More options */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Pin className="h-4 w-4 mr-2" />
                Pin channel
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Star className="h-4 w-4 mr-2" />
                Add to favorites
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Settings className="h-4 w-4 mr-2" />
                Channel settings
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Search bar (collapsible) */}
      {searchOpen && (
        <div className="px-4 pb-4">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search in channel..."
              className="pl-9"
            />
          </form>
        </div>
      )}
    </div>
  );
}; 