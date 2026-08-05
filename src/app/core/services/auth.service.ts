import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { TokenService } from './token.service';
import { AuthApiService } from '../auth/data-access/auth-api.service';
import { AuthorizationService } from '../auth/authorization.service';
import { environment } from '../../../environments/environment';
import { AuthUser } from '../auth/models/auth-user.model';
import {
  AuthTokens,
  RegisterRequest,
  RegisterResponse,
  LoginResponse,
  JwtPayload,
} from '../auth/models/auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(AuthApiService);
  private readonly tokens = inject(TokenService);
  private readonly authorization = inject(AuthorizationService);

  private readonly userSignal = signal<AuthUser | null>(null);
  private readonly tokensSignal = signal<AuthTokens | null>(null);
  private refreshPromise: Promise<boolean> | null = null;

  readonly user = this.userSignal.asReadonly();
  readonly isAuthenticated = computed(
    () => !!this.userSignal() && !!this.tokensSignal()?.accessToken,
  );
  readonly accessToken = computed(() => this.tokensSignal()?.accessToken ?? null);
  readonly hasStoredRefreshToken = computed(() => !!this.tokensSignal()?.refreshToken);

  constructor() {
    this.bootstrapFromStorage();
  }

  setRememberMe(value: boolean): void {
    this.tokens.setRememberMe(value);
  }
  getRememberMe(): boolean {
    return this.tokens.getRememberMe();
  }

  async preLogin(email: string) {
    return firstValueFrom(this.api.preLogin(email.trim().toLowerCase()));
  }

  async login(email: string, password: string): Promise<void> {
    const response = await firstValueFrom(
      this.api.login({
        clientId: environment.AUTH_CLIENT_ID,
        email: email.trim().toLowerCase(),
        password,
        deviceFingerprint: this.createDeviceFingerprint(),
      }),
    );

    if (response.requiresMfa) {
      throw new Error('MFA_REQUIRED');
    }

    this.applyLogin(response);
  }

  async register(request: RegisterRequest): Promise<RegisterResponse> {
    const response = await firstValueFrom(this.api.register(request));
    if (response.accessToken && response.refreshToken) {
      this.applyLogin({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        expiresIn: 900,
        requiresMfa: false,
      });
    }
    return response;
  }

  hasRefreshToken(): boolean {
    return this.hasStoredRefreshToken();
  }

  async refresh(): Promise<boolean> {
    if (this.refreshPromise) return this.refreshPromise;
    this.refreshPromise = this.executeRefresh().finally(() => (this.refreshPromise = null));
    return this.refreshPromise;
  }

  async checkAuth(): Promise<boolean> {
    const current = this.tokensSignal();
    if (!current?.accessToken) return false;
    if (current.expiresAtUtc && new Date(current.expiresAtUtc).getTime() <= Date.now() + 15_000) {
      return this.refresh();
    }
    return !!this.userSignal();
  }

  logout(): void {
    this.tokens.clear();
    this.tokensSignal.set(null);
    this.userSignal.set(null);
    this.authorization.clearPermissions();
  }

  getBackendErrorMessage(error: unknown): string | null {
    const value = error as {
      error?: { message?: string; error?: string; title?: string } | string;
      message?: string;
    };
    if (typeof value?.error === 'string') return value.error;
    return (
      value?.error?.message ?? value?.error?.error ?? value?.error?.title ?? value?.message ?? null
    );
  }

  private async executeRefresh(): Promise<boolean> {
    const refreshToken = this.tokensSignal()?.refreshToken;
    if (!refreshToken) return false;
    try {
      this.applyLogin(await firstValueFrom(this.api.refresh(refreshToken)));
      return true;
    } catch {
      this.logout();
      return false;
    }
  }

  private bootstrapFromStorage(): void {
    const stored = this.tokens.load();
    if (!stored) return;
    const user = this.buildUser(stored.accessToken);
    if (!user) {
      this.logout();
      return;
    }
    this.tokensSignal.set(stored);
    this.userSignal.set(user);
    this.authorization.setPermissions(user.permissions);
  }

  private applyLogin(response: LoginResponse): void {
    const authTokens: AuthTokens = {
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      expiresAtUtc: new Date(Date.now() + response.expiresIn * 1000).toISOString(),
    };
    const user = this.buildUser(response.accessToken, response);
    if (!user) throw new Error('INVALID_ACCESS_TOKEN');
    this.tokens.save(authTokens);
    this.tokensSignal.set(authTokens);
    this.userSignal.set(user);
    this.authorization.setPermissions(user.permissions);
  }

  private buildUser(accessToken: string, response?: LoginResponse): AuthUser | null {
    const payload = this.tokens.decode(accessToken);
    if (!payload?.sub || !payload.email) return null;
    const roles = this.toArray(payload.roles ?? payload.role);
    const permissions = this.toArray(payload.permissions ?? payload.permission);
    const responseUser = response?.user;
    const fullName = responseUser?.fullName ?? payload.full_name ?? payload.name ?? payload.email;
    return {
      id: payload.sub,
      email: payload.email,
      firstName: responseUser?.firstName ?? null,
      lastName: responseUser?.lastName ?? null,
      fullName,
      organizationId:
        payload.organization_id ?? payload.tenant_id ?? responseUser?.organizationId ?? null,
      phoneNumber: responseUser?.phoneNumber ?? null,
      isActive: responseUser?.isActive ?? true,
      roles,
      permissions,
      mfaEnabled: responseUser?.mfaEnabled ?? this.toBoolean(payload.mfa_enabled ?? payload.mfa),
      emailConfirmed: responseUser?.emailConfirmed ?? false,
      createdAtUtc: responseUser?.createdAtUtc ?? '',
      lastLoginAtUtc: responseUser?.lastLoginAtUtc ?? null,
    };
  }

  private toArray(value: JwtPayload['roles']): string[] {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  }

  private toBoolean(value: boolean | string | undefined): boolean {
    return value === true || value === 'true';
  }

  private createDeviceFingerprint(): string {
    const source = navigator.userAgent || 'unknown';
    try {
      return btoa(source);
    } catch {
      return source;
    }
  }
}
