import { Injectable, computed, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AuthorizationService {
  private readonly permissionsSignal = signal<ReadonlySet<string>>(new Set<string>());
  private readonly platformAdministratorSignal = signal(false);

  readonly permissions = this.permissionsSignal.asReadonly();

  readonly hasAnyPermission = computed(
    () => this.platformAdministratorSignal() || this.permissionsSignal().size > 0,
  );

  setPermissions(permissions: readonly string[]): void {
    const normalized = permissions
      .map((permission) => permission.trim())
      .filter((permission) => permission.length > 0);

    this.permissionsSignal.set(new Set(normalized));
  }

  setAuthorizationContext(permissions: readonly string[], roles: readonly string[]): void {
    this.setPermissions(permissions);
    this.platformAdministratorSignal.set(
      roles.some((role) =>
        ['driveos.platformadministrator', 'platformadmin', 'superadmin'].includes(
          role.trim().toLowerCase(),
        ),
      ),
    );
  }

  clearPermissions(): void {
    this.permissionsSignal.set(new Set<string>());
    this.platformAdministratorSignal.set(false);
  }

  hasPermission(permission: string): boolean {
    return this.platformAdministratorSignal() || this.permissionsSignal().has(permission);
  }

  hasAny(permissions: readonly string[]): boolean {
    return permissions.some((permission) => this.hasPermission(permission));
  }

  hasAll(permissions: readonly string[]): boolean {
    return permissions.every((permission) => this.hasPermission(permission));
  }
}
