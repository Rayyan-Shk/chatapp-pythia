"use client";

import { useEffect, useState } from "react";
import { useChatStore } from "@/lib/store/chatStore";
import { apiClient } from "@/lib/api/client";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { ChannelHeader } from "./ChannelHeader";
import { ChatTypingIndicator } from "./ChatTypingIndicator";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { AddUserDialog } from "./AddUserDialog";

interface MessageAreaProps {
  channelId: string;
}

export const MessageArea = ({ channelId }: MessageAreaProps) => {
  const {
    getChannelMessages,
    setMessages,
    messageLoading,
    setMessageLoading,
    getActiveChannel,
    getChannelMembers
  } = useChatStore();
  
  const [error, setError] = useState<string | null>(null);

  const channel = getActiveChannel();
  const messages = getChannelMessages(channelId);
  const members = getChannelMembers(channelId);

  useEffect(() => {
    if (channelId) {
      loadMessages();
    }
  }, [channelId]);

  const loadMessages = async () => {
    try {
      setError(null);
      setMessageLoading(true);
      const channelMessages = await apiClient.getChannelMessages(channelId);
      // Store messages directly - we'll cast for now to avoid type issues
      setMessages(channelId, channelMessages as any);
      
      // Ensure we scroll to the latest message after loading
      setTimeout(() => {
        const messageContainer = document.querySelector('.overflow-y-auto');
        if (messageContainer) {
          messageContainer.scrollTop = messageContainer.scrollHeight;
        }
      }, 100);
    } catch (error) {
      console.error("Failed to load messages:", error);
      setError("Failed to load messages. Please try again.");
    } finally {
      setMessageLoading(false);
    }
  };

  if (!channel) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Channel not found</h3>
          <p className="text-muted-foreground">
            The selected channel could not be loaded.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Main Chat Area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Channel Header */}
        <ChannelHeader channel={channel} />
        
        {/* Typing Indicator */}
        <ChatTypingIndicator channelId={channelId} />
        
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="m-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {/* Messages Area - Takes remaining space */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {messageLoading ? (
            <div className="flex items-center justify-center h-full">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <MessageList channelId={channelId} messages={messages as any} />
          )}
        </div>
        
        {/* Message Input - Fixed at bottom */}
        <div className="flex-shrink-0">
          <MessageInput channelId={channelId} />
        </div>
      </div>

      {/* Add User Dialog */}
      <AddUserDialog 
        channelId={channelId}
        channelName={channel.name}
        existingMembers={members}
      />
    </div>
  );
}; 