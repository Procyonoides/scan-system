export interface User {
  id_user: number;
  username: string;
  position: string;
  description?: string;
  permissions?: string[];
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  user: User;
}