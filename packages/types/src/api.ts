export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiErrorData {
  message: string;
  code?: string;
  details?: any;
}

// Request/Response wrappers
export interface ApiRequest<T = any> {
  endpoint: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  data?: T;
  params?: Record<string, any>;
}

export interface ApiConfig {
  baseURL: string;
  timeout?: number;
  retries?: number;
} 