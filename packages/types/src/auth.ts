export interface AuthResponse {
  access_token: string;
  token_type: "bearer";
  user: User;
}

export interface User {
  id: string;
  email: string;
  username: string;
  avatar?: string;
  status: "ACTIVE" | "SUSPENDED" | "BANNED";
  banned_until?: string;
  created_at: string;
  updated_at: string;
}

export interface UserCreate {
  email: string;
  username: string;
  password: string;
  avatar?: string;
}

export interface UserLogin {
  username: string;
  password: string;
}

export interface UserPresence {
  user_id: string;
  username: string;
  status: 'online' | 'offline' | 'away';
  last_seen?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
} 