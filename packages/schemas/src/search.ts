import { z } from 'zod';

export const SearchFiltersSchema = z.object({
  query: z.string().min(1, 'Search query is required').max(500, 'Query too long'),
  type: z.enum(['message', 'channel', 'user', 'all']).optional(),
  channel_id: z.string().cuid('Invalid channel ID').optional(),
  user_id: z.string().cuid('Invalid user ID').optional(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
  has_attachments: z.boolean().optional(),
  has_mentions: z.boolean().optional(),
});

export const SearchQuerySchema = z.object({
  ...SearchFiltersSchema.shape,
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export type SearchFiltersInput = z.infer<typeof SearchFiltersSchema>;
export type SearchQueryInput = z.infer<typeof SearchQuerySchema>; 