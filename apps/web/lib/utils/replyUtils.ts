/**
 * Utility functions for handling reply functionality
 */

export interface ReplyContext {
  messageId: string;
  content: string;
  username: string;
}

/**
 * Formats a reply message by prepending the original message content
 */
export function formatReplyMessage(userMessage: string, replyContext: ReplyContext): string {
  const originalMessage = replyContext.content;
  const username = replyContext.username;
  
  // Format: > @username: original message content
  // 
  // user's reply message
  const replyPrefix = `> @${username}: ${originalMessage}`;
  
  return `${replyPrefix}\n\n${userMessage}`;
}

/**
 * Extracts reply context from a formatted reply message
 */
export function extractReplyContext(formattedMessage: string): {
  originalMessage: string;
  username: string;
  userMessage: string;
} | null {
  const lines = formattedMessage.split('\n');
  
  // Check if it starts with a reply prefix
  const firstLine = lines[0];
  const replyMatch = firstLine.match(/^> @(\w+): (.+)$/);
  
  if (!replyMatch) {
    return null;
  }
  
  const username = replyMatch[1];
  const originalMessage = replyMatch[2];
  
  // Find the user's message (after the double newline)
  const doubleNewlineIndex = formattedMessage.indexOf('\n\n');
  if (doubleNewlineIndex === -1) {
    return null;
  }
  
  const userMessage = formattedMessage.slice(doubleNewlineIndex + 2);
  
  return {
    originalMessage,
    username,
    userMessage
  };
}

/**
 * Checks if a message is a reply
 */
export function isReplyMessage(content: string): boolean {
  return content.startsWith('> @') && content.includes('\n\n');
}

/**
 * Truncates message content for preview
 */
export function truncateMessageForPreview(content: string, maxLength: number = 100): string {
  if (content.length <= maxLength) {
    return content;
  }
  return `${content.slice(0, maxLength)}...`;
} 