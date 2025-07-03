"use client";

import { Reply } from "lucide-react";
import { cn } from "@/lib/utils";
import { extractReplyContext } from "@/lib/utils/replyUtils";

interface ReplyMessageProps {
  content: string;
  className?: string;
}

export const ReplyMessage = ({ content, className }: ReplyMessageProps) => {
  const replyContext = extractReplyContext(content);
  
  if (!replyContext) {
    return null;
  }

  const { originalMessage, username, userMessage } = replyContext;

  return (
    <div className={cn("space-y-2", className)}>
      {/* Reply Header */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Reply className="h-3 w-3" />
        <span>Replying to @{username}</span>
      </div>
      
      {/* Original Message */}
      <div className="pl-4 border-l-2 border-muted-foreground/30">
        <div className="text-sm text-muted-foreground">
          <span className="font-medium">@{username}:</span> {originalMessage}
        </div>
      </div>
      
      {/* User's Reply */}
      <div className="text-sm">
        {userMessage}
      </div>
    </div>
  );
}; 