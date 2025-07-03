"use client";

import { useEffect, useState } from "react";
import { useChatStore } from "@/lib/store/chatStore";
import { useAuth } from "@/hooks/useAuth";
import { apiClient } from "@/lib/api/client";
import { useUIStore } from "@/lib/store/uiStore";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  Hash, 
  Plus, 
  Users, 
  Search,
  LogOut,
  Settings,
  MessageSquare,
  AlertCircle
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Channel } from "@repo/types";

export const ChannelSidebar = () => {
  const {
    channels,
    activeChannelId,
    setChannels,
    setActiveChannelId,
    setChannelMembers,
    initializeFromPersistence
  } = useChatStore();
  
  const { user, logout } = useAuth();
  const { openModal } = useUIStore();
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [publicChannels, setPublicChannels] = useState<Channel[]>([]);
  const [publicChannelsError, setPublicChannelsError] = useState<string | null>(null);

  console.log("📺 ChannelSidebar: Rendering with state", {
    channelsCount: channels.length,
    activeChannelId,
    hasUser: !!user,
    loading,
    publicChannelsCount: publicChannels.length,
    hasError: !!publicChannelsError
  });

  useEffect(() => {
    console.log("📺 ChannelSidebar: Component mounted, loading channels");
    // Initialize from persistence first
    initializeFromPersistence();
    loadChannels();
    loadPublicChannels();

    // Listen for channel refresh events from WebSocket
    const handleRefreshChannels = () => {
      console.log("📺 ChannelSidebar: Refreshing channels due to WebSocket event");
      loadChannels();
      loadPublicChannels();
    };

    const handleRefreshChannelMembers = (event: CustomEvent) => {
      const { channelId } = event.detail;
      console.log("📺 ChannelSidebar: Refreshing members for channel", channelId);
      // Refresh the specific channel's member data
      loadChannelMembers(channelId);
    };

    // Add event listeners
    window.addEventListener('refreshChannels', handleRefreshChannels);
    window.addEventListener('refreshChannelMembers', handleRefreshChannelMembers as EventListener);

    // Cleanup
    return () => {
      window.removeEventListener('refreshChannels', handleRefreshChannels);
      window.removeEventListener('refreshChannelMembers', handleRefreshChannelMembers as EventListener);
    };
  }, []);

  const loadChannels = async () => {
    try {
      console.log("📺 ChannelSidebar: Loading user channels");
      setLoading(true);
      const channelData = await apiClient.getMyChannels();
      console.log("📺 ChannelSidebar: Got user channels", { count: channelData.length });
      
      // Extract channel info and member data
      const channels = channelData.map(({ members, member_count, ...channel }) => channel);
      console.log("📺 ChannelSidebar: Processed channels", channels.map(c => ({ 
        name: c.name, 
        id: c.id
      })));
      setChannels(channels);
      
      // Store member data for each channel
      channelData.forEach(channelWithMembers => {
        console.log("📺 ChannelSidebar: Setting members for channel", {
          channelId: channelWithMembers.id,
          memberCount: channelWithMembers.members.length
        });
        setChannelMembers(channelWithMembers.id, channelWithMembers.members);
      });
      
      // Set first channel as active if none selected and no persisted channel
      if (!activeChannelId && channelData.length > 0) {
        console.log("📺 ChannelSidebar: Setting first channel as active", channelData[0]?.id);
        setActiveChannelId(channelData[0]?.id || "");
      }
    } catch (error) {
      console.error("📺 ChannelSidebar: Failed to load user channels:", error);
      toast({
        title: "Error",
        description: "Failed to load your channels",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadPublicChannels = async () => {
    try {
      console.log("📺 ChannelSidebar: Loading public channels");
      const publicChannelData = await apiClient.getChannels();
      console.log("📺 ChannelSidebar: Got public channels", { count: publicChannelData.length });
      setPublicChannels(publicChannelData);
      setPublicChannelsError(null);
    } catch (error) {
      console.error("📺 ChannelSidebar: Failed to load public channels:", error);
      setPublicChannelsError("Failed to load available channels");
      // Don't show toast for this error as it's not critical for the main functionality
    }
  };

  const loadChannelMembers = async (channelId: string) => {
    try {
      console.log("📺 ChannelSidebar: Loading members for channel", channelId);
      const channelData = await apiClient.getChannel(channelId);
      console.log("📺 ChannelSidebar: Got channel members", { 
        channelId, 
        memberCount: channelData.members.length 
      });
      
      // Update the channel members in the store
      setChannelMembers(channelId, channelData.members);
      
      // Also update the channel info in the channels list if it exists
      const existingChannel = channels.find(c => c.id === channelId);
      if (existingChannel) {
        // Update the channel with the new member count
        setChannels(channels.map(channel => 
          channel.id === channelId 
            ? { ...channel, member_count: channelData.members.length }
            : channel
        ));
      }
    } catch (error) {
      console.error("📺 ChannelSidebar: Failed to load channel members:", error);
      // Don't show toast for this error as it's not critical
    }
  };

  const handleChannelSelect = (channelId: string) => {
    console.log("📺 ChannelSidebar: Selecting channel", channelId);
    setActiveChannelId(channelId);
  };

  const handleJoinChannel = async (channelId: string) => {
    try {
      console.log("📺 ChannelSidebar: Joining channel", channelId);
      await apiClient.joinChannel(channelId);
      await loadChannels(); // Refresh user's channels
      await loadPublicChannels(); // Refresh available channels
      toast({
        title: "Joined channel",
        description: "Successfully joined the channel",
      });
    } catch (error) {
      console.error("📺 ChannelSidebar: Failed to join channel:", error);
      toast({
        title: "Error",
        description: "Failed to join channel",
        variant: "destructive",
      });
    }
  };

  const handleCreateChannel = () => {
    console.log("📺 ChannelSidebar: Opening create channel dialog");
    openModal("createChannel");
  };

  const filteredPublicChannels = publicChannels.filter(
    (channel) =>
      !channels.some((myChannel) => myChannel.id === channel.id) &&
      channel.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Don't render if user is not available yet
  if (!user) {
    console.log("📺 ChannelSidebar: No user, showing loading state");
    return (
      <div className="w-64 bg-card/50 backdrop-blur-sm border-r flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-sm text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  console.log("📺 ChannelSidebar: Rendering full sidebar");

  return (
    <div className="w-64 bg-card/50 backdrop-blur-sm border-r flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 gradient-bg rounded-lg flex items-center justify-center shadow-md">
            <MessageSquare className="h-4 w-4 text-white" />
          </div>
          <h2 className="font-semibold text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Pythia</h2>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search channels..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
      </div>

      {/* Channel Lists */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-4">
          {/* My Channels */}
          <div>
            <div className="flex items-center justify-between px-2 py-1 mb-2">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                My Channels
              </h3>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0"
                onClick={handleCreateChannel}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-1">
              {channels.map((channel) => {
                return (
                  <Button
                    key={channel.id}
                    variant={activeChannelId === channel.id ? "secondary" : "ghost"}
                    className={`w-full justify-start h-8 px-2 ${activeChannelId === channel.id ? "channel-active" : ""}`}
                    onClick={() => handleChannelSelect(channel.id)}
                  >
                    <Hash className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="flex-1 text-left truncate text-sm">
                      {channel.name}
                    </span>
                    {(channel as any).member_count && (channel as any).member_count > 0 && (
                      <Badge variant="secondary" className="ml-2 h-5 text-xs">
                        {(channel as any).member_count}
                      </Badge>
                    )}
                  </Button>
                );
              })}
            </div>
            {channels.length === 0 && !loading && (
              <div className="text-center py-4 text-sm text-muted-foreground">
                No channels joined yet
              </div>
            )}
            {loading && (
              <div className="text-center py-4 text-sm text-muted-foreground">
                Loading channels...
              </div>
            )}
          </div>

          {/* Available Channels */}
          <div>
            <div className="flex items-center justify-between px-2 py-1 mb-2">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Available Channels
              </h3>
            </div>
            <div className="space-y-1">
              {filteredPublicChannels.map((channel) => (
                <div
                  key={channel.id}
                  className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center flex-1 min-w-0">
                    <Hash className="h-4 w-4 mr-2 flex-shrink-0 text-muted-foreground" />
                    <span className="text-sm truncate">{channel.name}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => handleJoinChannel(channel.id)}
                  >
                    Join
                  </Button>
                </div>
              ))}
            </div>
            {filteredPublicChannels.length === 0 && !publicChannelsError && (
              <div className="text-center py-4 text-sm text-muted-foreground">
                No available channels to join
              </div>
            )}
            {publicChannelsError && (
              <div className="text-center py-4 text-sm text-destructive">
                {publicChannelsError}
              </div>
            )}
          </div>
        </div>
      </ScrollArea>

      {/* User Profile */}
      <div className="p-3 border-t bg-muted/20">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.avatar || undefined} />
            <AvatarFallback className="text-xs">
              {user.username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{user.username}</div>
            <div className="text-xs text-muted-foreground truncate">{user.email}</div>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <Settings className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={logout}>
              <LogOut className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}; 