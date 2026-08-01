import { Injectable } from '@angular/core';
import { AuthTokens, JwtPayload } from '../auth/models/auth.models';

const ACCESS = 'driveos.auth.access';
const REFRESH = 'driveos.auth.refresh';
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
    const target = this.getRememberMe() ? localStorage : sessionStorage;
    this.clearTokensOnly();
    target.setItem(ACCESS, tokens.accessToken);
    if (tokens.refreshToken) target.setItem(REFRESH, tokens.refreshToken);
    if (tokens.expiresAtUtc) target.setItem(EXPIRES, tokens.expiresAtUtc);
  }

  load(): AuthTokens | null {
    const source = sessionStorage.getItem(ACCESS) ? sessionStorage : localStorage;
    const accessToken = source.getItem(ACCESS);
    if (!accessToken) return null;
    return {
      accessToken,
      refreshToken: source.getItem(REFRESH) ?? undefined,
      expiresAtUtc: source.getItem(EXPIRES) ?? undefined,
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
      storage.removeItem(REFRESH);
      storage.removeItem(EXPIRES);
    }
  }
}
