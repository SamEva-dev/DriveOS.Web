import { InjectionToken } from '@angular/core';

export interface AuthApiConfig {
  readonly baseUrl: string;
  readonly clientId: string;
}

export const AUTH_API_CONFIG = new InjectionToken<AuthApiConfig>('AUTH_API_CONFIG');
