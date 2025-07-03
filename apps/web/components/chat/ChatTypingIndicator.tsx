"use client";

import { useChatStore } from "@/lib/store/chatStore";
import { useAuthStore } from "@/lib/store/authStore";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface ChatTypingIndicatorProps {
  channelId: string;
}

export const ChatTypingIndicator = ({ channelId }: ChatTypingIndicatorProps) => {
  const { getTypingUsers } = useChatStore();
  const { user: currentUser } = useAuthStore();
  
  const typingUsers = getTypingUsers(channelId);
  
  // Filter out current user from typing indicators
  const otherTypingUsers = typingUsers.filter(user => user.userId !== currentUser?.id);

  if (otherTypingUsers.length === 0) {
    return null;
  }

  const renderTypingText = () => {
    const count = otherTypingUsers.length;
    
    if (count === 1) {
      return `${otherTypingUsers[0]?.username || 'Someone'} is typing`;
    } else if (count === 2) {
      return `${otherTypingUsers[0]?.username || 'Someone'} and ${otherTypingUsers[1]?.username || 'someone'} are typing`;
    } else {
      return `${otherTypingUsers[0]?.username || 'Someone'} and ${count - 1} others are typing`;
    }
  };

  return (
    <div className="px-4 py-2 bg-muted/30 border-b">
      <div className="flex items-center gap-2">
        {/* Typing users avatars */}
        <div className="flex -space-x-1">
          {otherTypingUsers.slice(0, 3).map((user) => (
            <Avatar key={user.userId} className="h-5 w-5 border border-background">
              <AvatarFallback className="text-xs">
                {user.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          ))}
        </div>
        
        {/* Typing text and animation */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{renderTypingText()}</span>
          
          {/* Animated dots */}
          <div className="flex gap-1">
            <div 
              className={cn(
                "w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce",
                "animation-delay-0"
              )}
            />
            <div 
              className={cn(
                "w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce",
                "animation-delay-100"
              )}
            />
            <div 
              className={cn(
                "w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce",
                "animation-delay-200"
              )}
            />
          </div>
        </div>
      </div>
    </div>
  );
}; 