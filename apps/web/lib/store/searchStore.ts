import { create } from 'zustand';
import { SearchResult, SearchFilters, SearchResponse } from '@repo/types';

interface SearchState {
  // Search state
  isSearchOpen: boolean;
  query: string;
  filters: SearchFilters;
  results: SearchResult[];
  loading: boolean;
  error: string | null;
  
  // Pagination
  currentPage: number;
  totalPages: number;
  totalResults: number;
  
  // Recent searches
  recentSearches: string[];
  
  // Actions
  setSearchOpen: (open: boolean) => void;
  setQuery: (query: string) => void;
  setFilters: (filters: Partial<SearchFilters>) => void;
  setResults: (response: SearchResponse) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
  
  // Search actions
  performSearch: () => Promise<void>;
  clearSearch: () => void;
  reset: () => void;
  
  // Computed getters
  hasResults: boolean;
  hasError: boolean;
  canLoadMore: boolean;
}

export const useSearchStore = create<SearchState>((set, get) => ({
  // Initial state
  isSearchOpen: false,
  query: '',
  filters: { query: '' },
  results: [],
  loading: false,
  error: null,
  currentPage: 1,
  totalPages: 0,
  totalResults: 0,
  recentSearches: [],
  
  // Computed properties
  get hasResults() {
    return get().results.length > 0;
  },
  
  get hasError() {
    return get().error !== null;
  },
  
  get canLoadMore() {
    const state = get();
    return state.currentPage < state.totalPages;
  },
  
  // Actions
  setSearchOpen: (open) => {
    set({ isSearchOpen: open });
    // Clear search when closing
    if (!open) {
      get().clearSearch();
    }
  },
  
  setQuery: (query) => set({ query }),
  
  setFilters: (filters) => set((state) => ({
    filters: { ...state.filters, ...filters }
  })),
  
  setResults: (response) => set({
    results: response.results,
    currentPage: response.page,
    totalResults: response.total,
    totalPages: Math.ceil(response.total / response.limit),
    error: null,
  }),
  
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  
  addRecentSearch: (query) => {
    if (!query.trim()) return;
    
    set((state) => {
      const trimmedQuery = query.trim();
      const filtered = state.recentSearches.filter(q => q !== trimmedQuery);
      return {
        recentSearches: [trimmedQuery, ...filtered].slice(0, 10) // Keep last 10
      };
    });
  },
  
  clearRecentSearches: () => set({ recentSearches: [] }),
  
  performSearch: async () => {
    const state = get();
    if (!state.query.trim()) return;
    
    set({ loading: true, error: null });
    
    try {
      // This will be implemented when we add the API client method
      // const response = await apiClient.search(state.filters);
      // get().setResults(response);
      // get().addRecentSearch(state.query);
      
      // For now, simulate search
      console.log('Performing search:', state.filters);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock results
      const mockResults: SearchResult[] = [
        {
          id: '1',
          type: 'message',
          title: 'Message result',
          content: `Found: ${state.query}`,
          channel_id: 'channel_1',
          channel_name: 'general',
          user_id: 'user_1',
          username: 'john_doe',
          created_at: new Date().toISOString(),
          highlighted_content: `Found: <mark>${state.query}</mark>`,
        }
      ];
      
      get().setResults({
        results: mockResults,
        total: mockResults.length,
        page: 1,
        limit: 20,
        filters: state.filters,
      });
      
      get().addRecentSearch(state.query);
    } catch (error) {
      console.error('Search failed:', error);
      set({ error: 'Search failed. Please try again.' });
    } finally {
      set({ loading: false });
    }
  },
  
  clearSearch: () => set({
    query: '',
    results: [],
    error: null,
    currentPage: 1,
    totalPages: 0,
    totalResults: 0,
  }),
  
  reset: () => set({
    isSearchOpen: false,
    query: '',
    filters: { query: '' },
    results: [],
    loading: false,
    error: null,
    currentPage: 1,
    totalPages: 0,
    totalResults: 0,
    recentSearches: [],
  }),
})); 