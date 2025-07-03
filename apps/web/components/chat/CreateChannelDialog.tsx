"use client";

import { useState } from "react";
import { useChatStore } from "@/lib/store/chatStore";
import { useUIStore } from "@/lib/store/uiStore";
import { apiClient } from "@/lib/api/client";
import { ChannelCreate } from "@repo/types";
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
import { Textarea } from "@/components/ui/textarea";

import { Hash, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export const CreateChannelDialog = () => {
  const { addChannel, setActiveChannelId } = useChatStore();
  const { modals, closeModal } = useUIStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ChannelCreate>({
    name: "",
    description: "",
  });

  const isOpen = modals.createChannel;

  const handleClose = () => {
    closeModal("createChannel");
    // Reset form
    setFormData({
      name: "",
      description: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Channel name is required",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const newChannel = await apiClient.createChannel(formData);
      addChannel(newChannel);
      setActiveChannelId(newChannel.id);
      toast({
        title: "Channel created",
        description: `Successfully created #${newChannel.name}`,
      });
      handleClose();
    } catch (error: any) {
      console.error("Failed to create channel:", error);
      
      // Handle specific error cases
      let errorMessage = "Failed to create channel";
      if (error.message?.includes("already exists")) {
        errorMessage = "A channel with this name already exists";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ChannelCreate, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5" />
            Create New Channel
          </DialogTitle>
          <DialogDescription>
            Create a new channel for your team to collaborate and communicate.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Channel Name</Label>
            <Input
              id="name"
              placeholder="e.g., general, random, announcements"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              disabled={loading}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="What is this channel about?"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              disabled={loading}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.name.trim()}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Channel"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 