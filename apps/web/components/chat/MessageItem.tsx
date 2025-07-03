"use client";

import { useState } from "react";
import { MessageWithDetails } from "@repo/types";
import { useAuthStore } from "@/lib/store/authStore";
import { useChatStore } from "@/lib/store/chatStore";
import { useReply } from "@/hooks/useReply";
import { apiClient } from "@/lib/api/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  MoreHorizontal, 
  Reply, 
  Edit, 
  Trash2, 
  Copy,
  Smile,
  Check,
  X
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmojiPicker } from "./EmojiPicker";
import { ReplyMessage } from "./ReplyMessage";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { formatMessageContent } from "@/lib/utils";
import { isReplyMessage } from "@/lib/utils/replyUtils";

interface MessageItemProps {
  message: MessageWithDetails;
  isConsecutive?: boolean;
}

export const MessageItem = ({ message, isConsecutive = false }: MessageItemProps) => {
  const { user: currentUser } = useAuthStore();
  const { updateMessage, removeMessage } = useChatStore();
  const { startReply } = useReply();
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [loading, setLoading] = useState(false);
  
  const isOwnMessage = currentUser?.id === message.user_id;

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Message Actions
  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      toast({
        title: "Copied to clipboard",
        description: "Message content copied successfully",
      });
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Could not copy message to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleReply = () => {
    console.log("💬 MessageItem: Setting reply to message", message.id);
    startReply(message.id, message.content, message.user.username);
  };

  const handleEditStart = () => {
    setIsEditing(true);
    setEditContent(message.content);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditContent(message.content);
  };

  const handleEditSave = async () => {
    if (!editContent.trim() || editContent === message.content) {
      setIsEditing(false);
      return;
    }

    setLoading(true);
    try {
      await apiClient.editMessage(message.id, editContent.trim());
      
      // Update local state
      updateMessage(message.channel_id, message.id, {
        content: editContent.trim(),
        is_edited: true,
        updated_at: new Date().toISOString(),
      });
      
      setIsEditing(false);
      toast({
        title: "Message updated",
        description: "Your message has been edited successfully",
      });
    } catch (error) {
      console.error("Failed to edit message:", error);
      toast({
        title: "Failed to edit message",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this message?")) {
      return;
    }

    setLoading(true);
    try {
      await apiClient.deleteMessage(message.id);
      
      // Remove from local state
      removeMessage(message.channel_id, message.id);
      
      toast({
        title: "Message deleted",
        description: "Your message has been deleted successfully",
      });
    } catch (error) {
      console.error("Failed to delete message:", error);
      toast({
        title: "Failed to delete message",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Reaction Actions
  const handleReactionAdd = async (emoji: string) => {
    try {
      console.log("🔄 Adding reaction:", { messageId: message.id, emoji });
      await apiClient.addReaction(message.id, emoji);
      console.log("✅ API call successful for reaction");
      toast({
        title: "Reaction added",
        description: `Added ${emoji} reaction`,
      });
    } catch (error) {
      console.error("Failed to add reaction:", error);
      toast({
        title: "Failed to add reaction",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleReactionToggle = async (reactionId: string, emoji: string) => {
    try {
      await apiClient.removeReaction(reactionId);
      toast({
        title: "Reaction removed",
        description: `Removed ${emoji} reaction`,
      });
    } catch (error) {
      console.error("Failed to remove reaction:", error);
      toast({
        title: "Failed to remove reaction",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  return (
    <div
      className={cn(
        "group relative flex gap-3 px-4 py-3 rounded-lg message-hover",
        isConsecutive && "mt-1"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Avatar (hidden when consecutive) */}
      <div className={cn("flex-shrink-0", isConsecutive ? "w-10" : "")}>
        {!isConsecutive && (
          <Avatar className="h-10 w-10">
            <AvatarImage src={message.user.avatar} />
            <AvatarFallback className="text-sm">
              {message.user.username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        )}
      </div>

      {/* Message Content */}
      <div className="flex-1 min-w-0">
        {/* Header (hidden when consecutive) */}
        {!isConsecutive && (
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm">
              {message.user.username}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatTime(message.created_at)}
            </span>
            {message.is_edited && (
              <Badge variant="secondary" className="text-xs h-4">
                edited
              </Badge>
            )}
          </div>
        )}

        {/* Message Text or Edit Input */}
        {isEditing ? (
          <div className="space-y-2">
            <Input
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleEditSave();
                } else if (e.key === "Escape") {
                  handleEditCancel();
                }
              }}
              disabled={loading}
              autoFocus
            />
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={handleEditSave}
                disabled={loading || !editContent.trim()}
              >
                <Check className="h-3 w-3 mr-1" />
                Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleEditCancel}
                disabled={loading}
              >
                <X className="h-3 w-3 mr-1" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            {isReplyMessage(message.content) ? (
              <ReplyMessage content={message.content} />
            ) : (
              <div 
                className="text-sm break-words leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: formatMessageContent(message.content)
                }}
              />
            )}
          </>
        )}

        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {message.reactions.map((reaction) => {
              const userReacted = reaction.user_id === currentUser?.id;
              return (
                <Button
                  key={reaction.id}
                  variant={userReacted ? "default" : "outline"}
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => userReacted ? handleReactionToggle(reaction.id, reaction.emoji) : handleReactionAdd(reaction.emoji)}
                >
                  {reaction.emoji} 1
                </Button>
              );
            })}
          </div>
        )}
        
        {/* Debug info - remove in production */}
        {process.env.NODE_ENV === 'development' && (
          <div className="text-xs text-muted-foreground mt-1">
            Reactions: {message.reactions?.length || 0}
          </div>
        )}
        
        {/* Debug: Show reaction count */}
        {process.env.NODE_ENV === 'development' && (
          <div className="text-xs text-muted-foreground mt-1">
            Reactions: {message.reactions?.length || 0}
          </div>
        )}
      </div>

      {/* Message Actions */}
      {isHovered && !isEditing && (
        <div className="absolute top-2 right-2 flex items-center gap-1 bg-background border rounded-md shadow-sm">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={handleReply}
          >
            <Reply className="h-3 w-3" />
          </Button>
          
          <EmojiPicker
            onEmojiSelect={handleReactionAdd}
            trigger={
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                <Smile className="h-3 w-3" />
              </Button>
            }
          />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={handleCopyMessage}>
                <Copy className="mr-2 h-3 w-3" />
                Copy Text
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleReply}>
                <Reply className="mr-2 h-3 w-3" />
                Reply
              </DropdownMenuItem>
              {isOwnMessage && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleEditStart}>
                    <Edit className="mr-2 h-3 w-3" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={handleDelete}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-3 w-3" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Grouped message timestamp */}
      {isConsecutive && isHovered && (
        <div className="absolute left-3 top-2 text-xs text-muted-foreground">
          {formatTime(message.created_at)}
        </div>
      )}
    </div>
  );
}; 