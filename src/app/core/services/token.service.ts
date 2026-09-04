import { Injectable } from '@angular/core';
import { AuthTokens, JwtPayload } from '../auth/models/auth.models';

const ACCESS = 'driveos.auth.access';
const LEGACY_REFRESH = 'driveos.auth.refresh';
const EXPIRES = 'driveos.auth.expires';
const REMEMBER = 'driveos.auth.remember';

@Injectable({ providedIn: 'root' })
export class TokenService {
  setRememberMe(value: boolean): void {
    if (value) localStorage.setItem(REMEMBER, '1');
    else localStorage.removeItem(REMEMBER);
  }

  getRememberMe(): boolean {
    return localStorage.getItem(REMEMBER) === '1';
  }

  save(tokens: AuthTokens): void {
    this.clearTokensOnly();
    sessionStorage.setItem(ACCESS, tokens.accessToken);
    if (tokens.expiresAtUtc) sessionStorage.setItem(EXPIRES, tokens.expiresAtUtc);
  }

  load(): AuthTokens | null {
    // One-time cleanup of tokens written by versions that used durable storage.
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(ACCESS);
      localStorage.removeItem(LEGACY_REFRESH);
      localStorage.removeItem(EXPIRES);
    }
    const accessToken = sessionStorage.getItem(ACCESS);
    if (!accessToken) return null;
    return {
      accessToken,
      expiresAtUtc: sessionStorage.getItem(EXPIRES) ?? undefined,
    };
  }

  clear(): void {
    this.clearTokensOnly();
    localStorage.removeItem(REMEMBER);
  }

  decode(token: string): JwtPayload | null {
    try {
      const payload = token.split('.')[1];
      if (!payload) return null;
      const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
      const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
      return JSON.parse(atob(padded)) as JwtPayload;
    } catch {
      return null;
    }
  }

  private clearTokensOnly(): void {
    for (const storage of [localStorage, sessionStorage]) {
      storage.removeItem(ACCESS);
      storage.removeItem(LEGACY_REFRESH);
      storage.removeItem(EXPIRES);
    }
  }
}
