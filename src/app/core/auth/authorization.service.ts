import {
  Injectable,
  computed,
  signal,
} from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AuthorizationService {
  private readonly permissionsSignal =
    signal<ReadonlySet<string>>(
      new Set<string>(),
    );

  readonly permissions =
    this.permissionsSignal.asReadonly();

  readonly hasAnyPermission =
    computed(() =>
      this.permissionsSignal().size > 0,
    );

  setPermissions(
    permissions: readonly string[],
  ): void {
    this.permissionsSignal.set(
      new Set(permissions),
    );
  }

  clearPermissions(): void {
    this.permissionsSignal.set(
      new Set<string>(),
    );
  }

  hasPermission(
    permission: string,
  ): boolean {
    return this.permissionsSignal()
      .has(permission);
  }

  hasAny(
    permissions: readonly string[],
  ): boolean {
    return permissions.some(
      permission =>
        this.hasPermission(permission),
    );
  }

  hasAll(
    permissions: readonly string[],
  ): boolean {
    return permissions.every(
      permission =>
        this.hasPermission(permission),
    );
  }
}
