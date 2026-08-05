import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { AUTH_API_CONFIG } from '../auth-api-config';
import { environment } from '../../../../environments/environment';
import {
  LoginRequest,
  LoginResponse,
  PreLoginResponse,
  RegisterRequest,
  RegisterResponse,
} from '../models/auth.models';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(AUTH_API_CONFIG);
  private readonly baseUrl = `${this.config.baseUrl.replace(/\/$/, '')}/api`;

  preLogin(email: string) {
    return this.http.post<PreLoginResponse>(`${this.baseUrl}/Auth/prelogin`, {
      email,
      clientId: environment.AUTH_CLIENT_ID,
    });
  }

  login(request: LoginRequest) {
    return this.http.post<LoginResponse>(`${this.baseUrl}/Auth/login`, request);
  }

  register(request: RegisterRequest) {
    return this.http.post<RegisterResponse>(`${this.baseUrl}/Auth/register-with-tenant`, {
      ...request,
      clientId: environment.AUTH_CLIENT_ID,
    });
  }

  refresh(refreshToken: string) {
    return this.http.post<LoginResponse>(`${this.baseUrl}/Auth/refresh`, { refreshToken });
  }

  requestPasswordReset(email: string) {
    return this.http.post<void>(`${this.baseUrl}/PasswordReset/request`, {
      email,
      clientId: environment.AUTH_CLIENT_ID,
    });
  }

  resetPassword(email: string, token: string, newPassword: string, confirmPassword: string) {
    return this.http.post<void>(`${this.baseUrl}/PasswordReset/reset`, {
      email,
      token,
      newPassword,
      confirmPassword,
    });
  }

  validateEmail(email: string, token: string) {
    return this.http.post<void>(`${this.baseUrl}/Auth/validate-email`, { email, token });
  }

  resendEmailConfirmation(email: string) {
    return this.http.post<void>(`${this.baseUrl}/Auth/resend-confirm-email`, {
      email,
      clientId: environment.AUTH_CLIENT_ID,
    });
  }
}
