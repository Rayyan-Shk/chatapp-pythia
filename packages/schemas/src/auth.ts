import { z } from 'zod';

// User registration schema
export const CreateUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be less than 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  avatar: z.string().url('Invalid avatar URL').optional(),
});

// Registration form schema with password confirmation
export const RegisterSchema = CreateUserSchema.extend({
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// User login schema (backend expects username, not email)
export const LoginSchema = z.object({
  username: z
    .string()
    .min(1, 'Username is required')
    .min(3, 'Username must be at least 3 characters'),
  password: z.string().min(1, 'Password is required'),
});

// Update user profile schema
export const UpdateUserSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be less than 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
    .optional(),
  avatar: z.string().url('Invalid avatar URL').optional(),
});

// Type inference from schemas
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>; 