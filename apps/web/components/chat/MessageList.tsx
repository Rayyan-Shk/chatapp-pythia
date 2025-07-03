"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageItem } from "./MessageItem";
import { MessageWithDetails } from "@repo/types";
import { ArrowDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageListProps {
  channelId: string;
  messages: MessageWithDetails[];
  loading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export const MessageList = ({ 
  channelId, 
  messages, 
  loading = false,
  onLoadMore,
  hasMore = false
}: MessageListProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const lastMessageCountRef = useRef(messages.length);
  const lastChannelIdRef = useRef(channelId);

  // Auto-scroll to bottom when new messages arrive (if user isn't scrolling)
  useEffect(() => {
    const messageCountChanged = messages.length !== lastMessageCountRef.current;
    const channelChanged = channelId !== lastChannelIdRef.current;
    
    lastMessageCountRef.current = messages.length;
    lastChannelIdRef.current = channelId;

    // Always scroll to bottom when channel changes or when new messages arrive and user isn't scrolling
    if ((messageCountChanged && !isUserScrolling) || channelChanged) {
      // Use a small delay to ensure DOM is updated
      setTimeout(() => {
        scrollToBottom(false);
      }, 100);
    }
  }, [messages.length, channelId, isUserScrolling]);

  // Handle scroll events
  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    
    // Check if user is near the bottom (within 100px)
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShowScrollButton(!isNearBottom);
    
    // Check if user is actively scrolling up
    const isScrollingUp = scrollTop < scrollHeight - clientHeight - 100;
    setIsUserScrolling(isScrollingUp);

    // Load more messages when scrolled to top
    if (scrollTop < 50 && hasMore && onLoadMore && !loading) {
      onLoadMore();
    }
  };

  const scrollToBottom = (smooth = true) => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: smooth ? "smooth" : "auto"
      });
    }
    setIsUserScrolling(false);
    setShowScrollButton(false);
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups: { [key: string]: MessageWithDetails[] }, message) => {
    const date = new Date(message.created_at).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", { 
        weekday: "long", 
        year: "numeric", 
        month: "long", 
        day: "numeric" 
      });
    }
  };

  if (loading && messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex-1 h-full">
      {/* Scrollable messages container */}
      <div 
        ref={scrollContainerRef}
        className="h-full overflow-y-auto overflow-x-hidden scroll-smooth"
        onScroll={handleScroll}
        style={{ scrollbarWidth: 'thin' }}
      >
        <div className="p-4 space-y-4 min-h-full flex flex-col">
          {/* Loading indicator at top */}
          {loading && hasMore && (
            <div className="flex justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Welcome message for empty channels */}
          {messages.length === 0 && !loading && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-4 max-w-md">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                  <span className="text-2xl">#</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    Welcome to this channel!
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    This is the beginning of your conversation. Send a message to get started.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Messages grouped by date */}
          <div className="flex-1 space-y-4">
            {Object.entries(groupedMessages).map(([date, dateMessages]) => (
              <div key={date} className="space-y-4">
                {/* Date separator */}
                <div className="flex items-center justify-center py-2">
                  <div className="bg-muted px-3 py-1 rounded-full">
                    <span className="text-xs font-medium text-muted-foreground">
                      {formatDate(date)}
                    </span>
                  </div>
                </div>

                {/* Messages for this date */}
                <div className="space-y-3">
                  {dateMessages.map((message, index) => {
                    const prevMessage = index > 0 ? dateMessages[index - 1] : null;
                    const isConsecutive = Boolean(
                      prevMessage && 
                      prevMessage.user_id === message.user_id &&
                      new Date(message.created_at).getTime() - new Date(prevMessage.created_at).getTime() < 300000 // 5 minutes
                    );

                    return (
                      <MessageItem
                        key={message.id}
                        message={message}
                        isConsecutive={isConsecutive}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Scroll anchor */}
          <div ref={messagesEndRef} className="h-0" />
        </div>
      </div>

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <Button
          variant="secondary"
          size="sm"
          className={cn(
            "absolute bottom-4 right-4 rounded-full h-10 w-10 p-0 shadow-lg z-10",
            "hover:shadow-xl transition-all duration-200",
            "bg-background border border-border"
          )}
          onClick={() => scrollToBottom()}
        >
          <ArrowDown className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}; 