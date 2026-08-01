import type { AuthUser } from './auth-user.model';

export type { AuthUser } from './auth-user.model';

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAtUtc?: string;
}

export interface PreLoginResponse {
  nextStep: string;
  error?: string;
}

export interface LoginRequest {
  clientId: string;
  email: string;
  password: string;
  deviceFingerprint?: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  requiresMfa: boolean;
  mfaToken?: string;
  user?: Partial<AuthUser>;
}

export interface RegisterRequest {
  clientId?: string;
  email: string;
  password: string;
  organizationName: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export interface RegisterResponse {
  userId: string;
  email: string;
  message?: string;
  status?: string;
  accessToken?: string;
  refreshToken?: string;
}

export interface JwtPayload {
  sub?: string;
  email?: string;
  name?: string;
  full_name?: string;
  organization_id?: string;
  tenant_id?: string;
  role?: string | string[];
  roles?: string | string[];
  permission?: string | string[];
  permissions?: string | string[];
  mfa_enabled?: boolean | string;
  mfa?: boolean | string;
  exp?: number;
}
