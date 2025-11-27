export interface User {
  user_id: number;
  username: string;
  full_name: string;
  email?: string;
  role: 'SERVER' | 'IT' | 'MANAGEMENT' | 'SHIPPING' | 'RECEIVING';
  status: 'ACTIVE' | 'INACTIVE';
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}