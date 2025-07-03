"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { apiClient } from "@/lib/api/client";
import { useFileStore } from "@/lib/store/fileStore";
import { useChatStore } from "@/lib/store/chatStore";
import { useReply } from "@/hooks/useReply";
import { wsClient } from "@/lib/websocket/client";
import { usePersistenceStore } from "@/lib/store/persistenceStore";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { EmojiPicker } from "./EmojiPicker";
import { MentionAutocomplete } from "./MentionAutocomplete";
import { ReplyPreview } from "./ReplyPreview";
import { Send, Paperclip, Plus, X, FileText, Image, Video, Music, Reply } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { formatReplyMessage } from "@/lib/utils/replyUtils";

interface MessageInputProps {
  channelId: string;
  className?: string;
}

export const MessageInput = ({ channelId, className }: MessageInputProps) => {
  const [content, setContent] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [showMentionAutocomplete, setShowMentionAutocomplete] = useState(false);
  const [mentionPosition, setMentionPosition] = useState({ x: 0, y: 0 });

  // Get persistence store actions
  const { getDraftMessage, saveDraftMessage, clearDraftMessage } = usePersistenceStore();

  // Load draft message on mount
  useEffect(() => {
    if (channelId) {
      const draft = getDraftMessage(channelId);
      if (draft) {
        setContent(draft);
      }
    }
  }, [channelId, getDraftMessage]);
  
  const { 
    uploadQueue, 
    addToUploadQueue, 
    removeFromUploadQueue,
    isValidFileType,
    getFileType,
    getMaxFileSize 
  } = useFileStore();
  
  // Get channel members for mention autocomplete and reply context
  const { getChannelMembers } = useChatStore();
  const { replyTo, cancelReply } = useReply();
  const channelMembers = channelId ? getChannelMembers(channelId) : [];
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const sendTypingIndicator = useCallback((channelId: string, isTyping: boolean) => {
    if (wsClient.isConnected()) {
      return wsClient.sendTypingIndicator(channelId, isTyping);
    }
    return false;
  }, []);

  const handleTyping = useCallback((value: string) => {
    setContent(value);

    // Save draft message
    if (channelId) {
      saveDraftMessage(channelId, value);
    }

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }

    // Handle mention autocomplete
    const textarea = textareaRef.current;
    if (textarea) {
      const cursorPosition = textarea.selectionStart;
      const textBeforeCursor = value.slice(0, cursorPosition);
      const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
      
      if (mentionMatch) {
        const query = mentionMatch[1] || "";
        setMentionQuery(query);
        setShowMentionAutocomplete(true);
        
        // Calculate position for autocomplete dropdown
        const rect = textarea.getBoundingClientRect();
        const lineHeight = parseInt(getComputedStyle(textarea).lineHeight) || 20;
        const lines = textBeforeCursor.split('\n').length;
        
        setMentionPosition({
          x: rect.left + 10, // Small offset from left
          y: rect.top + (lines * lineHeight) - textarea.scrollTop
        });
      } else {
        setShowMentionAutocomplete(false);
        setMentionQuery("");
      }
    }

    // Handle typing indicator
    if (value && !isTyping) {
      setIsTyping(true);
      sendTypingIndicator(channelId, true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      sendTypingIndicator(channelId, false);
    }, 1000);
  }, [channelId, sendTypingIndicator, isTyping, saveDraftMessage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || loading) return;

    let messageContent = content.trim();
    
    // Format message as reply if reply context exists
    if (replyTo) {
      messageContent = formatReplyMessage(messageContent, replyTo);
    }
    
    setContent("");
    setLoading(true);

    // Clear draft message after sending
    if (channelId) {
      clearDraftMessage(channelId);
    }

    // Stop typing indicator
    if (isTyping) {
      setIsTyping(false);
      sendTypingIndicator(channelId, false);
    }

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    // Clear reply context after sending
    if (replyTo) {
      cancelReply();
    }

    try {
      await apiClient.sendMessage(messageContent, channelId);
    } catch (error) {
      console.error("Failed to send message:", error);
      toast({
        title: "Failed to send message",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
      // Restore message content on error
      setContent(content.trim());
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Don't handle Enter if mention autocomplete is open (let it handle navigation)
    if (showMentionAutocomplete && (e.key === "Enter" || e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === "Escape")) {
      return;
    }
    
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleMentionSelect = useCallback((username: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursorPosition = textarea.selectionStart;
    const textBeforeCursor = content.slice(0, cursorPosition);
    const textAfterCursor = content.slice(cursorPosition);
    
    // Find the @ symbol position
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
    if (mentionMatch) {
      const atPosition = cursorPosition - mentionMatch[0].length;
      const newContent = content.slice(0, atPosition) + `@${username} ` + textAfterCursor;
      
      setContent(newContent);
      setShowMentionAutocomplete(false);
      setMentionQuery("");
      
      // Set cursor position after the mention
      setTimeout(() => {
        textarea.focus();
        const newCursorPosition = atPosition + username.length + 2; // +2 for @ and space
        textarea.setSelectionRange(newCursorPosition, newCursorPosition);
      }, 0);
    }
  }, [content]);

  const handleMentionClose = useCallback(() => {
    setShowMentionAutocomplete(false);
    setMentionQuery("");
  }, []);

  const handleEmojiSelect = (emoji: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newContent = content.slice(0, start) + emoji + content.slice(end);
    
    setContent(newContent);
    
    // Focus and set cursor position after emoji
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + emoji.length, start + emoji.length);
    }, 0);
  };

  const handleFileUpload = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.multiple = true;
    fileInput.accept = 'image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.zip,.rar';
    
    fileInput.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        handleFilesSelected(Array.from(files));
      }
    };
    
    fileInput.click();
  };

  const handleFilesSelected = (files: File[]) => {
    const validFiles: File[] = [];
    const invalidFiles: string[] = [];

    files.forEach(file => {
      if (isValidFileType(file)) {
        validFiles.push(file);
      } else {
        const fileType = getFileType(file.type);
        const maxSize = getMaxFileSize(fileType);
        invalidFiles.push(`${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB > ${(maxSize / 1024 / 1024).toFixed(1)}MB)`);
      }
    });

    // Add valid files to upload queue
    validFiles.forEach(file => {
      addToUploadQueue(file, channelId);
    });

    // Show success message for valid files
    if (validFiles.length > 0) {
      toast({
        title: "Files uploading",
        description: `${validFiles.length} file(s) added to upload queue`,
      });
    }

    // Show error message for invalid files
    if (invalidFiles.length > 0) {
      toast({
        title: "Some files were rejected",
        description: invalidFiles.join(', '),
        variant: "destructive",
      });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFilesSelected(files);
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (mimeType.startsWith('video/')) return <Video className="h-4 w-4" />;
    if (mimeType.startsWith('audio/')) return <Music className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  return (
    <div className={cn("border-t bg-background/95 backdrop-blur", className)}>
      {/* Upload Queue */}
      {uploadQueue.length > 0 && (
        <div className="border-b bg-muted/30 p-3">
          <div className="space-y-2">
            {uploadQueue.map((upload) => (
              <div key={upload.id} className="flex items-center gap-3 p-2 bg-background rounded-lg">
                <div className="flex-shrink-0">
                  {getFileIcon('file')}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium truncate">
                      {upload.filename}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => removeFromUploadQueue(upload.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-1">
                    <Progress value={upload.progress} className="flex-1 h-1" />
                    <span className="text-xs text-muted-foreground">
                      {upload.status === 'uploading' && `${upload.progress.toFixed(0)}%`}
                      {upload.status === 'completed' && 'Done'}
                      {upload.status === 'error' && 'Failed'}
                    </span>
                  </div>
                  
                  {upload.error && (
                    <p className="text-xs text-destructive mt-1">{upload.error}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div 
        className="p-4"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* Reply Preview */}
        {replyTo && (
          <ReplyPreview
            replyTo={replyTo}
            onCancel={cancelReply}
          />
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Message Input Area */}
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => handleTyping(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message #${channelId.slice(0, 8)}... or drag files to upload`}
              className="min-h-[44px] max-h-32 resize-none pr-24 py-3"
              disabled={loading}
            />
            
            {/* Action buttons */}
            <div className="absolute right-2 bottom-2 flex items-center gap-1">
              {/* Emoji picker */}
              <EmojiPicker onEmojiSelect={handleEmojiSelect} />
              
              {/* File upload */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={handleFileUpload}
                disabled={loading}
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              
              {/* Send button */}
              <Button
                type="submit"
                size="sm"
                className="h-8 w-8 p-0"
                disabled={!content.trim() || loading}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </form>
      </div>
      
      {/* Mention Autocomplete */}
      {showMentionAutocomplete && (
        <MentionAutocomplete
          query={mentionQuery}
          position={mentionPosition}
          channelId={channelId}
          onSelect={handleMentionSelect}
          onClose={handleMentionClose}
        />
      )}
    </div>
  );
}; 