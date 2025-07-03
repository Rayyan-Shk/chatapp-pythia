"use client";

import { useState } from "react";
import { useChatStore } from "@/lib/store/chatStore";
import { apiClient } from "@/lib/api/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  MessageSquare, 
  Hash, 
  Plus, 
  Users,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Zap,
  Heart,
  Star
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface WelcomeScreenProps {
  onWelcomeComplete?: () => void;
}

export const WelcomeScreen = ({ onWelcomeComplete }: WelcomeScreenProps) => {
  const { 
    channels, 
    setChannels, 
    setActiveChannelId 
  } = useChatStore();
  const [loading, setLoading] = useState(false);
  const [availableChannels, setAvailableChannels] = useState<any[]>([]);
  const [showAvailable, setShowAvailable] = useState(false);

  const loadAvailableChannels = async () => {
    setLoading(true);
    try {
      const allChannels = await apiClient.getChannels();
      setAvailableChannels(allChannels);
      setShowAvailable(true);
    } catch (error) {
      console.error("Failed to load available channels:", error);
      toast({
        title: "Error",
        description: "Failed to load available channels",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const joinChannel = async (channelId: string) => {
    setLoading(true);
    try {
      await apiClient.joinChannel(channelId);
      
      // Refresh user's channels
      const userChannels = await apiClient.getMyChannels();
      setChannels(userChannels);
      
      // Set the joined channel as active
      setActiveChannelId(channelId);
      
      // Mark welcome as complete
      onWelcomeComplete?.();
      
      toast({
        title: "Success",
        description: "Joined channel successfully!",
      });
    } catch (error) {
      console.error("Failed to join channel:", error);
      toast({
        title: "Error",
        description: "Failed to join channel",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshChannels = async () => {
    setLoading(true);
    try {
      const userChannels = await apiClient.getMyChannels();
      setChannels(userChannels);
      
      if (userChannels.length > 0) {
        setActiveChannelId(userChannels[0]?.id || "");
        // Mark welcome as complete if user has channels
        onWelcomeComplete?.();
      }
    } catch (error) {
      console.error("Failed to refresh channels:", error);
      toast({
        title: "Error",
        description: "Failed to refresh channels",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6 gradient-bg-muted relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-transparent"></div>
      <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-accent/10 rounded-full blur-2xl"></div>
      
      <div className="w-full max-w-4xl space-y-8 relative z-10">
        {/* Welcome Header */}
        <div className="text-center space-y-6">
          <div className="mx-auto w-20 h-20 gradient-bg rounded-3xl flex items-center justify-center shadow-2xl animate-bounce-subtle">
            <MessageSquare className="h-10 w-10 text-white" />
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Welcome to Pythia Conversations
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Connect, collaborate, and communicate with your team in real-time
            </p>
          </div>
          
          {/* Feature highlights */}
          <div className="flex flex-wrap justify-center gap-4 mt-8">
            <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Real-time messaging</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-accent/10 rounded-full">
              <Users className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium">Team collaboration</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-success/10 rounded-full">
              <Heart className="h-4 w-4 text-success" />
              <span className="text-sm font-medium">Modern interface</span>
            </div>
          </div>
        </div>

        {/* No Channels State */}
        {channels.length === 0 && (
          <Card className="border-dashed border-2 bg-card/50 backdrop-blur-sm shadow-xl">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-muted to-muted-foreground/20 rounded-2xl flex items-center justify-center mb-6">
                <Hash className="h-8 w-8 text-muted-foreground" />
              </div>
              <CardTitle className="text-2xl">No channels yet</CardTitle>
              <CardDescription className="text-base">
                You haven't joined any channels yet. Explore available channels or create your own to get started.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={loadAvailableChannels}
                  disabled={loading}
                  className="flex-1 h-12 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {loading ? (
                    <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="h-5 w-5 mr-2" />
                  )}
                  Explore Channels
                </Button>
                <Button 
                  variant="outline" 
                  onClick={refreshChannels}
                  disabled={loading}
                  className="flex-1 h-12 border-2 hover:bg-muted/50"
                >
                  <RefreshCw className="h-5 w-5 mr-2" />
                  Refresh
                </Button>
              </div>
              
              {/* Skip Welcome Button */}
              <div className="text-center">
                <Button 
                  variant="ghost" 
                  onClick={() => onWelcomeComplete?.()}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Skip welcome screen
                </Button>
              </div>

              {/* Available Channels */}
              {showAvailable && availableChannels.length > 0 && (
                <div className="mt-8 animate-slide-up">
                  <div className="flex items-center gap-2 mb-4">
                    <Star className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Available Channels</h3>
                  </div>
                  <ScrollArea className="h-80 rounded-lg border bg-background/50">
                    <div className="space-y-3 p-4">
                      {availableChannels.map((channel) => (
                        <div 
                          key={channel.id}
                          className="group flex items-center justify-between p-4 rounded-xl border bg-card hover:bg-muted/50 transition-all duration-200 hover:shadow-md"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl flex items-center justify-center group-hover:from-primary/30 group-hover:to-accent/30 transition-all duration-200">
                              <Hash className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <div className="font-semibold text-base">{channel.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {channel.description || "No description"}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Badge variant="secondary" className="px-3 py-1">
                              <Users className="h-3 w-3 mr-1" />
                              {channel.member_count || 0}
                            </Badge>
                            <Button 
                              size="sm"
                              onClick={() => joinChannel(channel.id)}
                              disabled={loading}
                              className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-md hover:shadow-lg transition-all duration-200"
                            >
                              Join
                              <ArrowRight className="h-3 w-3 ml-1" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              {showAvailable && availableChannels.length === 0 && (
                <div className="text-center py-12 animate-fade-in">
                  <div className="w-16 h-16 bg-muted/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Hash className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                  <p className="text-muted-foreground text-lg">No channels available to join</p>
                  <p className="text-sm text-muted-foreground/70 mt-2">
                    Contact your administrator to create new channels
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Has Channels State */}
        {channels.length > 0 && (
          <Card className="bg-card/50 backdrop-blur-sm shadow-xl">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-success/20 to-success/10 rounded-2xl flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-success" />
              </div>
              <CardTitle className="text-2xl">You're all set!</CardTitle>
              <CardDescription className="text-base">
                Select a channel from the sidebar to start chatting with your team.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="flex flex-wrap justify-center gap-2">
                {channels.slice(0, 3).map((channel) => (
                  <Badge key={channel.id} variant="secondary" className="px-3 py-1">
                    <Hash className="h-3 w-3 mr-1" />
                    {channel.name}
                  </Badge>
                ))}
                {channels.length > 3 && (
                  <Badge variant="outline" className="px-3 py-1">
                    +{channels.length - 3} more
                  </Badge>
                )}
              </div>
              <Button 
                onClick={() => {
                  setActiveChannelId(channels[0]?.id || "");
                  onWelcomeComplete?.();
                }}
                className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                Start Chatting
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}; 