"use client";

import { useEffect } from "react";
import { useNotificationStore } from "@/lib/store/notificationStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, Search, Upload, Settings } from "lucide-react";

export const Phase5Demo = () => {
  const { addNotification, requestPermission } = useNotificationStore();

  useEffect(() => {
    // Request notification permission on mount
    requestPermission();
  }, [requestPermission]);

  const addDemoNotifications = () => {
    // Add some demo notifications
    addNotification({
      type: 'mention',
      title: 'You were mentioned',
      message: 'John mentioned you in #general: "Hey @you, check this out!"',
      channel_id: 'general',
      channel_name: 'general',
      user_id: 'john_123',
      username: 'john_doe',
      message_id: 'msg_123',
      read: false,
      action_url: '/chat?channel=general&message=msg_123',
    });

    addNotification({
      type: 'file_shared',
      title: 'New file shared',
      message: 'Alice shared design-mockup.png in #design',
      channel_id: 'design',
      channel_name: 'design',
      user_id: 'alice_456',
      username: 'alice_smith',
      file_url: '/files/design-mockup.png',
      read: false,
      action_url: '/chat?channel=design',
    });

    addNotification({
      type: 'channel_invite',
      title: 'Channel invitation',
      message: 'You were invited to join #marketing by Bob',
      channel_id: 'marketing',
      channel_name: 'marketing',
      user_id: 'bob_789',
      username: 'bob_wilson',
      read: false,
      action_url: '/chat?channel=marketing',
    });

    addNotification({
      type: 'reaction_added',
      title: 'New reaction',
      message: 'Sarah reacted with 👍 to your message',
      channel_id: 'general',
      channel_name: 'general',
      user_id: 'sarah_101',
      username: 'sarah_jones',
      message_id: 'msg_456',
      read: false,
      action_url: '/chat?channel=general&message=msg_456',
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">🚀 Phase 5: Advanced Features</h1>
        <p className="text-muted-foreground">
          Enhanced search, notifications, file uploads, and channel management
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Global Search */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Search className="h-5 w-5" />
              Global Search
            </CardTitle>
            <CardDescription>
              Search across messages, channels, and users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Badge variant="secondary">⌘K shortcut</Badge>
              <Badge variant="secondary">Recent searches</Badge>
              <Badge variant="secondary">Filtered results</Badge>
              <p className="text-sm text-muted-foreground mt-2">
                Click the search icon in the header or press ⌘K to test
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Notifications */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>
              Smart notification system with preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="space-y-1">
                <Badge variant="secondary">Desktop notifications</Badge>
                <Badge variant="secondary">Sound alerts</Badge>
                <Badge variant="secondary">Channel-specific settings</Badge>
              </div>
              <Button 
                onClick={addDemoNotifications} 
                size="sm" 
                className="w-full"
              >
                Add Demo Notifications
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* File Upload */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Upload className="h-5 w-5" />
              File Upload
            </CardTitle>
            <CardDescription>
              Drag & drop file sharing with progress tracking
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Badge variant="secondary">Drag & drop</Badge>
              <Badge variant="secondary">Progress tracking</Badge>
              <Badge variant="secondary">File validation</Badge>
              <p className="text-sm text-muted-foreground mt-2">
                Try dragging files to the message input area
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Channel Management */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Settings className="h-5 w-5" />
              Channel Settings
            </CardTitle>
            <CardDescription>
              Advanced channel and user management
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Badge variant="secondary">Notification preferences</Badge>
              <Badge variant="secondary">Channel-specific settings</Badge>
              <Badge variant="secondary">User presence</Badge>
              <p className="text-sm text-muted-foreground mt-2">
                Check the channel header dropdown menu
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feature Status */}
      <Card>
        <CardHeader>
          <CardTitle>Phase 5 Implementation Status</CardTitle>
          <CardDescription>
            All advanced features are now implemented and ready for testing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-semibold">✅ Completed Features</h4>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="w-3 h-3 p-0 bg-green-500" />
                  Global search with keyboard shortcuts
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="w-3 h-3 p-0 bg-green-500" />
                  Enhanced notification system
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="w-3 h-3 p-0 bg-green-500" />
                  File upload with drag & drop
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="w-3 h-3 p-0 bg-green-500" />
                  Channel notification preferences
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="w-3 h-3 p-0 bg-green-500" />
                  Desktop notification support
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold">🔄 Ready for Backend Integration</h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div>• Search API endpoints</div>
                <div>• File upload API with storage</div>
                <div>• Notification preferences API</div>
                <div>• WebSocket notification events</div>
                <div>• Channel management API</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Architecture Benefits */}
      <Card>
        <CardHeader>
          <CardTitle>🏗️ DRY Architecture Benefits</CardTitle>
          <CardDescription>
            Phase 5 follows clean code principles and reuses existing patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">Shared Components</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Reused UI components</li>
                <li>• Consistent design system</li>
                <li>• Shared type definitions</li>
                <li>• Common utility functions</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">State Management</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Zustand stores with persistence</li>
                <li>• Centralized state logic</li>
                <li>• Computed properties</li>
                <li>• Clean separation of concerns</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Integration Ready</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Backend API interfaces defined</li>
                <li>• WebSocket event handling</li>
                <li>• Error handling patterns</li>
                <li>• Performance optimizations</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 