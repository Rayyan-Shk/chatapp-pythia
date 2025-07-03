"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchStore } from "@/lib/store/searchStore";
import { useChatStore } from "@/lib/store/chatStore";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Search, 
  Clock, 
  Hash, 
  User, 
  MessageSquare,
  X,
  Filter,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SearchResult } from "@repo/types";

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const GlobalSearch = ({ open, onOpenChange }: GlobalSearchProps) => {
  const {
    query,
    results,
    loading,
    error,
    recentSearches,
    hasResults,
    setQuery,
    performSearch,
    clearSearch,
    addRecentSearch,
  } = useSearchStore();

  const { setActiveChannelId } = useChatStore();
  const [localQuery, setLocalQuery] = useState("");

  // Sync local query with store
  useEffect(() => {
    setLocalQuery(query);
  }, [query]);

  // Handle search on Enter
  const handleSearch = useCallback(async () => {
    if (!localQuery.trim()) return;
    
    setQuery(localQuery);
    await performSearch();
  }, [localQuery, setQuery, performSearch]);

  // Handle result click
  const handleResultClick = (result: SearchResult) => {
    switch (result.type) {
      case 'message':
        if (result.channel_id) {
          setActiveChannelId(result.channel_id);
          // TODO: Scroll to specific message
        }
        break;
      case 'channel':
        setActiveChannelId(result.id);
        break;
      case 'user':
        // TODO: Open user profile or start DM
        break;
    }
    onOpenChange(false);
  };

  // Handle recent search click
  const handleRecentSearchClick = (searchQuery: string) => {
    setLocalQuery(searchQuery);
    setQuery(searchQuery);
    performSearch();
  };

  // Clear search when dialog closes
  useEffect(() => {
    if (!open) {
      setLocalQuery("");
      clearSearch();
    }
  }, [open, clearSearch]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onOpenChange(true);
      }
      
      if (e.key === 'Escape' && open) {
        onOpenChange(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange]);

  const getResultIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'message':
        return <MessageSquare className="h-4 w-4" />;
      case 'channel':
        return <Hash className="h-4 w-4" />;
      case 'user':
        return <User className="h-4 w-4" />;
      default:
        return <Search className="h-4 w-4" />;
    }
  };

  const formatResultDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl sm:max-w-lg w-[95vw] sm:w-full p-0 gap-0">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="sr-only">Search</DialogTitle>
          
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
              placeholder="Search messages, channels, and users..."
              className="pl-10 pr-20 h-12 text-base border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              autoFocus
            />
            
            {/* Search button and shortcuts */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {localQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setLocalQuery("");
                    clearSearch();
                  }}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
              <kbd className="hidden sm:inline-flex h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs font-medium text-muted-foreground">
                <span className="text-xs">⌘</span>K
              </kbd>
            </div>
          </div>
        </DialogHeader>

        <Separator />

        <ScrollArea className="max-h-96">
          <div className="p-4">
            {/* Loading state */}
            {loading && (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  <span>Searching...</span>
                </div>
              </div>
            )}

            {/* Error state */}
            {error && (
              <div className="text-center py-8">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* No query state - show recent searches */}
            {!localQuery && !loading && recentSearches.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Recent searches
                </div>
                <div className="space-y-1">
                  {recentSearches.map((search, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      className="w-full justify-start h-auto p-2 text-left"
                      onClick={() => handleRecentSearchClick(search)}
                    >
                      <Search className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="truncate">{search}</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Search results */}
            {hasResults && !loading && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Search className="h-4 w-4" />
                    Search results
                  </div>
                  <Button variant="ghost" size="sm" className="h-6 px-2">
                    <Filter className="h-3 w-3 mr-1" />
                    Filter
                  </Button>
                </div>
                
                <div className="space-y-1">
                  {results.map((result) => (
                    <Button
                      key={result.id}
                      variant="ghost"
                      className="w-full justify-start h-auto p-3 text-left hover:bg-muted/50"
                      onClick={() => handleResultClick(result)}
                    >
                      <div className="flex items-start gap-3 w-full">
                        <div className="flex-shrink-0 mt-0.5">
                          {getResultIcon(result.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">
                              {result.title}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {result.type}
                            </Badge>
                          </div>
                          
                          <div 
                            className="text-sm text-muted-foreground line-clamp-2"
                            dangerouslySetInnerHTML={{
                              __html: result.highlighted_content || result.content
                            }}
                          />
                          
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {result.channel_name && (
                              <>
                                <Hash className="h-3 w-3" />
                                <span>{result.channel_name}</span>
                              </>
                            )}
                            {result.username && (
                              <>
                                <User className="h-3 w-3" />
                                <span>{result.username}</span>
                              </>
                            )}
                            <span>•</span>
                            <span>{formatResultDate(result.created_at)}</span>
                          </div>
                        </div>
                        
                        <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* No results state */}
            {!hasResults && !loading && localQuery && (
              <div className="text-center py-8">
                <Search className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  No results found for "{localQuery}"
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Try different keywords or check your spelling
                </p>
              </div>
            )}

            {/* Empty state */}
            {!localQuery && !loading && recentSearches.length === 0 && (
              <div className="text-center py-8">
                <Search className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Search for messages, channels, and users
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Use <kbd className="px-1 py-0.5 bg-muted rounded text-xs">⌘K</kbd> to open search anytime
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}; 