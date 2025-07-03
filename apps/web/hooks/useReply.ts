import { useChatStore } from "@/lib/store/chatStore";
import { ReplyContext } from "@/lib/utils/replyUtils";

/**
 * Custom hook for managing reply functionality
 */
export const useReply = () => {
  const { replyTo, setReplyTo, clearReply } = useChatStore();

  const startReply = (messageId: string, content: string, username: string) => {
    console.log("💬 useReply: Starting reply to message", messageId);
    setReplyTo({
      messageId,
      content,
      username
    });
    
    // Focus the message input
    const messageInput = document.querySelector('textarea[placeholder*="Message"]') as HTMLTextAreaElement;
    if (messageInput) {
      messageInput.focus();
    }
  };

  const cancelReply = () => {
    console.log("💬 useReply: Canceling reply");
    clearReply();
  };

  const isReplying = () => {
    return replyTo !== null;
  };

  return {
    replyTo,
    startReply,
    cancelReply,
    isReplying
  };
}; 