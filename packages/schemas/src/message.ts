import { z } from 'zod';

// Create message schema
export const CreateMessageSchema = z.object({
  content: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(1000, 'Message must be less than 1000 characters'),
  channelId: z.string().cuid('Invalid channel ID'),
  mentions: z.array(z.string().cuid('Invalid user ID')).optional(),
});

// Update message schema
export const UpdateMessageSchema = z.object({
  content: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(1000, 'Message must be less than 1000 characters'),
});

// Message reaction schema
export const CreateReactionSchema = z.object({
  messageId: z.string().cuid('Invalid message ID'),
  emoji: z.string().min(1, 'Emoji is required').max(10, 'Invalid emoji'),
});

// Typing indicator schema
export const TypingIndicatorSchema = z.object({
  channelId: z.string().cuid('Invalid channel ID'),
  isTyping: z.boolean(),
});

// Message pagination schema
export const MessagePaginationSchema = z.object({
  channelId: z.string().cuid('Invalid channel ID'),
  page: z.number().min(1, 'Page must be at least 1').default(1),
  limit: z.number().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(50),
  before: z.string().cuid('Invalid message ID').optional(),
  after: z.string().cuid('Invalid message ID').optional(),
});

// Type inference from schemas
export type CreateMessageInput = z.infer<typeof CreateMessageSchema>;
export type UpdateMessageInput = z.infer<typeof UpdateMessageSchema>;
export type CreateReactionInput = z.infer<typeof CreateReactionSchema>;
export type TypingIndicatorInput = z.infer<typeof TypingIndicatorSchema>;
export type MessagePaginationInput = z.infer<typeof MessagePaginationSchema>; 