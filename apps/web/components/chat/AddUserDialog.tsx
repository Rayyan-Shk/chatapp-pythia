"use client";

import { useState, useEffect } from "react";
import { useUIStore } from "@/lib/store/uiStore";
import { apiClient } from "@/lib/api/client";
import { User } from "@repo/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Check, Search, Loader2, UserPlus } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface AddUserDialogProps {
  channelId: string;
  channelName: string;
  existingMembers: User[];
}

export const AddUserDialog = ({ channelId, channelName, existingMembers }: AddUserDialogProps) => {
  const { modals, closeModal } = useUIStore();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [loadingUsers, setLoadingUsers] = useState(false);

  const isOpen = modals.addUser;

  const handleClose = () => {
    closeModal("addUser");
    setSearchQuery("");
    setSelectedUsers(new Set());
  };

  const loadAvailableUsers = async () => {
    try {
      setLoadingUsers(true);
      const availableUsers = await apiClient.getAvailableUsers();
      
      // Filter out users who are already members
      const existingMemberIds = new Set(existingMembers.map(member => member.id));
      const filteredUsers = availableUsers.filter(user => !existingMemberIds.has(user.id));
      
      setUsers(filteredUsers);
    } catch (error) {
      console.error("Failed to load available users:", error);
      toast({
        title: "Error",
        description: "Failed to load available users",
        variant: "destructive",
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadAvailableUsers();
    }
  }, [isOpen]);

  const handleUserToggle = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleAddUsers = async () => {
    if (selectedUsers.size === 0) return;

    setLoading(true);
    try {
      const promises = Array.from(selectedUsers).map(userId =>
        apiClient.addUserToChannel(channelId, userId)
      );
      
      await Promise.all(promises);
      
      toast({
        title: "Success",
        description: `Added ${selectedUsers.size} user${selectedUsers.size > 1 ? 's' : ''} to ${channelName}`,
      });
      
      handleClose();
    } catch (error) {
      console.error("Failed to add users:", error);
      
      // Check if it's the specific error about public channels
      const errorMessage = error instanceof Error ? error.message : "Failed to add users to channel";
      const isPublicChannelError = errorMessage.includes("Cannot add users to public channels");
      
      toast({
        title: "Error",
        description: isPublicChannelError 
          ? "This is a public channel. Only private channels allow manual user addition. Users can join public channels themselves."
          : errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add Users to {channelName}
          </DialogTitle>
          <DialogDescription>
            Select users to add to this private channel. Only you can add users as the channel creator.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 flex flex-col">
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Users List */}
          <ScrollArea className="flex-1 border rounded-md">
            {loadingUsers ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading users...</span>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                {searchQuery ? "No users found matching your search" : "No users available to add"}
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className={`flex items-center gap-3 p-3 rounded-md cursor-pointer transition-colors ${
                      selectedUsers.has(user.id)
                        ? "bg-primary/10 border border-primary/20"
                        : "hover:bg-muted/50"
                    }`}
                    onClick={() => handleUserToggle(user.id)}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar || undefined} />
                        <AvatarFallback className="text-xs">
                          {user.username.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          {user.username}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {user.email}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {user.status}
                      </Badge>
                      {selectedUsers.has(user.id) && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        <DialogFooter className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {selectedUsers.size > 0 && `${selectedUsers.size} user${selectedUsers.size > 1 ? 's' : ''} selected`}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddUsers}
              disabled={loading || selectedUsers.size === 0}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add {selectedUsers.size > 0 ? `(${selectedUsers.size})` : ''}
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 