export interface SearchResult {
  id: string;
  type: 'message' | 'channel' | 'user';
  title: string;
  content: string;
  channel_id?: string;
  channel_name?: string;
  user_id?: string;
  username?: string;
  created_at: string;
  highlighted_content?: string;
}

export interface SearchFilters {
  query: string;
  type?: 'message' | 'channel' | 'user' | 'all';
  channel_id?: string;
  user_id?: string;
  date_from?: string;
  date_to?: string;
  has_attachments?: boolean;
  has_mentions?: boolean;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  page: number;
  limit: number;
  filters: SearchFilters;
}

export interface SearchSuggestion {
  id: string;
  type: 'channel' | 'user' | 'command';
  title: string;
  subtitle?: string;
  icon?: string;
} 