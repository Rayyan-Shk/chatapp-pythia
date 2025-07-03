"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ReplyContext, truncateMessageForPreview } from "@/lib/utils/replyUtils";

interface ReplyPreviewProps {
  replyTo: ReplyContext;
  onCancel: () => void;
  className?: string;
}

export const ReplyPreview = ({ replyTo, onCancel, className }: ReplyPreviewProps) => {
  const truncatedContent = truncateMessageForPreview(replyTo.content);

  return (
    <div className={cn(
      "mb-3 p-3 bg-muted/50 rounded-lg border-l-4 border-l-primary",
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-primary">Replying to</span>
            <span className="text-xs font-semibold">@{replyTo.username}</span>
          </div>
          <div className="text-sm text-muted-foreground truncate">
            {truncatedContent}
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 ml-2"
          onClick={onCancel}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}; 