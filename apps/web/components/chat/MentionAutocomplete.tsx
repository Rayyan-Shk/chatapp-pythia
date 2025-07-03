"use client";

import { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "@repo/types";
import { useChatStore } from "@/lib/store/chatStore";

interface MentionAutocompleteProps {
  onSelect: (username: string) => void;
  onClose: () => void;
  query: string;
  position: { x: number; y: number };
  channelId: string;
}

export const MentionAutocomplete = ({ onSelect, onClose, query, position, channelId }: MentionAutocompleteProps) => {
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { getChannelMembers } = useChatStore();
  const channelMembers = getChannelMembers(channelId);

  // Filter channel members based on query
  useEffect(() => {
    if (!query.trim()) {
      // Show all channel members when no query
      setFilteredUsers(channelMembers.slice(0, 10));
      setSelectedIndex(0);
      return;
    }

    // Filter members by username (case-insensitive)
    const filtered = channelMembers.filter(member =>
      member.username.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 10);
    
    setFilteredUsers(filtered);
    setSelectedIndex(0);
  }, [query, channelMembers, channelId]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (filteredUsers.length === 0) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % filteredUsers.length);
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + filteredUsers.length) % filteredUsers.length);
          break;
        case "Enter":
          e.preventDefault();
          if (filteredUsers[selectedIndex]) {
            onSelect(filteredUsers[selectedIndex].username);
          }
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [filteredUsers, selectedIndex, onSelect, onClose]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  if (filteredUsers.length === 0) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="fixed z-50 w-64 bg-background border border-border rounded-lg shadow-lg max-h-60 overflow-hidden"
      style={{
        left: position.x,
        top: position.y - 8, // Slight offset above cursor
        transform: "translateY(-100%)" // Position above the cursor
      }}
    >
      <div className="w-full max-h-60 overflow-y-auto">
        {filteredUsers.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No channel members found
          </div>
        ) : (
          <div>
            {filteredUsers.map((user, index) => (
              <div
                key={user.id}
                onClick={() => onSelect(user.username)}
                className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors ${
                  index === selectedIndex ? "bg-accent" : ""
                }`}
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback className="text-xs">
                    {user.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{user.username}</span>
                  <span className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}; 