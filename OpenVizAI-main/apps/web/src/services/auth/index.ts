import { APIService } from "../apiService";

export type Tokens = {
  access_token: string;
  refresh_token: string;
};

export type AuthUser = {
  id: string;
  email: string;
  // Allow extra fields from backend without strict typing for now
  [key: string]: unknown;
};

export type LoginResponse = {
  tokens: Tokens;
  user: AuthUser;
};

export const loginWithEmail = (email: string): Promise<LoginResponse> => {
  return APIService.post<LoginResponse>("/api/auth/login", { email });
};

export const refreshToken = (refresh: string): Promise<Tokens> => {
  return APIService.post<Tokens>("/api/auth/token/refresh", { refresh });
};

export const getCurrentUser = (): Promise<AuthUser> => {
  return APIService.get<AuthUser>("/api/auth/me");
};

