"use client";

import { 
  ApiResponse, 
  ApiErrorData,
  AuthResponse, 
  User, 
  UserCreate, 
  UserLogin,
  Channel,
  ChannelWithMembers,
  ChannelCreate,
  MessageWithDetails,
  MessageWithUser,
  MessageCreate
} from "@repo/types";
import { LoginInput, RegisterData } from "@/lib/schemas/auth";

export class ApiClient {
  private baseURL: string;
  private token: string | null = null;
  private timeout = 10000; // 10 seconds
  private retries = 3;

  constructor() {
    this.baseURL = 
      (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000") + 
      (process.env.NEXT_PUBLIC_API_VERSION || "/api/v1");
  }

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const url = `${this.baseURL}${endpoint}`;
      console.log(`🔄 API Request: ${options.method || 'GET'} ${url}`);
      
      if (options.body) {
        console.log(`📤 Request Body:`, JSON.parse(options.body as string));
      }

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          ...(this.token && { Authorization: `Bearer ${this.token}` }),
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`❌ API Error: ${response.status}`, errorData);
        
        if (response.status === 401 && retryCount === 0) {
          // Token might be expired, clear tokens and redirect to login
          this.token = null;
          if (typeof window !== "undefined") {
            localStorage.removeItem("pythia-auth-token");
            // Clear cookie
            document.cookie = "pythia-auth-token=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;";
            window.location.href = "/login";
          }
          throw new Error("Authentication failed");
        }

        throw new Error(
          errorData.detail || errorData.message || `HTTP ${response.status}`
        );
      }

      const data = await response.json();
      console.log(`✅ API Response: ${options.method || 'GET'} ${url}`, data);
      return data;
    } catch (error: unknown) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === "AbortError") {
        console.error(`⏱️ API Timeout: ${endpoint}`);
        throw new Error("Request timeout");
      }

      // Only retry on server errors (5xx) or network errors, not on client errors (4xx)
      const shouldRetry = retryCount < this.retries && (
        // Retry on server errors (5xx)
        (error instanceof Error && error.message && error.message.includes('HTTP 5')) ||
        // Retry on network errors (no HTTP status)
        (!(error instanceof Error) || !error.message || !error.message.includes('HTTP'))
      );

      if (shouldRetry) {
        console.log(`🔄 Retrying API request (${retryCount + 1}/${this.retries}): ${endpoint}`);
        await new Promise((resolve) => setTimeout(resolve, 1000 * (retryCount + 1)));
        return this.request(endpoint, options, retryCount + 1);
      }

      console.error(`❌ API Request Failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Authentication methods
  async login(credentials: LoginInput): Promise<AuthResponse> {
    return this.request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  }

  async register(userData: RegisterData): Promise<AuthResponse> {
    return this.request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  }

  async getCurrentUser(): Promise<User> {
    return this.request<User>("/auth/me");
  }

  // Channel methods
  async getChannels(): Promise<Channel[]> {
    return this.request<Channel[]>("/channels/");
  }

  async getMyChannels(): Promise<ChannelWithMembers[]> {
    return this.request<ChannelWithMembers[]>("/channels/my");
  }

  async createChannel(channelData: ChannelCreate): Promise<Channel> {
    return this.request<Channel>("/channels/", {
      method: "POST",
      body: JSON.stringify({
        name: channelData.name,
        description: channelData.description,
      }),
    });
  }

  async getChannel(channelId: string): Promise<ChannelWithMembers> {
    return this.request<ChannelWithMembers>(`/channels/${channelId}`);
  }

  async joinChannel(channelId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>("/channels/join", {
      method: "POST",
      body: JSON.stringify({ channel_id: channelId }),
    });
  }

  async leaveChannel(channelId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/channels/${channelId}/leave`, {
      method: "DELETE",
    });
  }

  async addUserToChannel(channelId: string, userId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/channels/${channelId}/add-user`, {
      method: "POST",
      body: JSON.stringify({ user_id: userId }),
    });
  }

  async getAvailableUsers(): Promise<User[]> {
    return this.request<User[]>("/channels/users/available");
  }

  // Message methods
  async getChannelMessages(
    channelId: string,
    page = 1,
    limit = 50
  ): Promise<MessageWithDetails[]> {
    const offset = (page - 1) * limit; // Convert page to offset
    return this.request<MessageWithDetails[]>(
      `/messages/channel/${channelId}?offset=${offset}&limit=${limit}`
    );
  }

  async sendMessage(
    content: string,
    channelId: string
  ): Promise<MessageWithUser> {
    return this.request("/messages/", {
      method: "POST",
      body: JSON.stringify({ content, channel_id: channelId }),
    });
  }

  async editMessage(messageId: string, content: string): Promise<MessageWithUser> {
    return this.request(`/messages/${messageId}`, {
      method: "PUT",
      body: JSON.stringify({ content }),
    });
  }

  async deleteMessage(messageId: string): Promise<void> {
    return this.request(`/messages/${messageId}`, {
      method: "DELETE",
    });
  }

  async addReaction(messageId: string, emoji: string): Promise<void> {
    return this.request("/messages/reactions", {
      method: "POST",
      body: JSON.stringify({ message_id: messageId, emoji }),
    });
  }

  async removeReaction(reactionId: string): Promise<void> {
    return this.request(`/messages/reactions/${reactionId}`, {
      method: "DELETE",
    });
  }

  async getMyMentions(
    page = 1,
    limit = 20
  ): Promise<MessageWithDetails[]> {
    return this.request<MessageWithDetails[]>(
      `/messages/mentions/my?page=${page}&limit=${limit}`
    );
  }

  async validateMessageFormatting(content: string): Promise<{
    valid: boolean;
    error: string | null;
    formatting: any;
    sanitized_content: string;
    mentions: string[];
  }> {
    return this.request("/messages/format/validate", {
      method: "POST",
      body: JSON.stringify({ content }),
    });
  }

  // User methods
  async getUsers(): Promise<User[]> {
    return this.request("/users/");
  }

  async getUserById(userId: string): Promise<User> {
    return this.request(`/users/${userId}`);
  }

  async updateUserProfile(userId: string, updates: Partial<User>): Promise<User> {
    return this.request(`/users/${userId}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  }
}

// Custom error class
export class ApiError extends Error {
  constructor(
    message: string,
    public code: string = "UNKNOWN",
    public details?: any
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// Singleton instance
export const apiClient = new ApiClient(); 