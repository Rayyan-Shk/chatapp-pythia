// Authentication schemas
export * from './auth';

// Message schemas
export * from './message';

// Common utility schemas
import { z } from 'zod';

export const PaginationSchema = z.object({
  page: z.number().min(1, 'Page must be at least 1').default(1),
  limit: z.number().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(20),
});

export type PaginationInput = z.infer<typeof PaginationSchema>;

// Auth schemas
export { LoginSchema, RegisterSchema } from './auth';

// Message schemas
export { MessageCreateSchema, MessageUpdateSchema, TypingIndicatorSchema } from './message';

// Search schemas - Phase 5
export { SearchFiltersSchema, SearchQuerySchema } from './search';
export type { SearchFiltersInput, SearchQueryInput } from './search'; 