import { Injectable, signal } from '@angular/core';

const ORGANIZATION_KEY = 'driveos.context.organization';
const BRANCH_KEY = 'driveos.context.branch';

@Injectable({ providedIn: 'root' })
export class TenantContextService {
  private readonly organizationIdSignal = signal<string | null>(
    this.readSessionValue(ORGANIZATION_KEY),
  );
  private readonly branchIdSignal = signal<string | null>(this.readSessionValue(BRANCH_KEY));

  readonly organizationId = this.organizationIdSignal.asReadonly();
  readonly branchId = this.branchIdSignal.asReadonly();

  setOrganization(organizationId: string | null): void {
    const normalized = this.normalizeIdentifier(organizationId);
    if (normalized === this.organizationIdSignal()) return;

    this.organizationIdSignal.set(normalized);
    this.writeSessionValue(ORGANIZATION_KEY, normalized);
    this.setBranch(null);
  }

  setBranch(branchId: string | null): void {
    const normalized = this.normalizeIdentifier(branchId);
    this.branchIdSignal.set(normalized);
    this.writeSessionValue(BRANCH_KEY, normalized);
  }

  clear(): void {
    this.organizationIdSignal.set(null);
    this.branchIdSignal.set(null);
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(ORGANIZATION_KEY);
      sessionStorage.removeItem(BRANCH_KEY);
    }
  }

  private normalizeIdentifier(value: string | null | undefined): string | null {
    const normalized = value?.trim() ?? '';
    return normalized.length > 0 ? normalized : null;
  }

  private readSessionValue(key: string): string | null {
    return typeof sessionStorage === 'undefined' ? null : sessionStorage.getItem(key);
  }

  private writeSessionValue(key: string, value: string | null): void {
    if (typeof sessionStorage === 'undefined') return;
    if (value) sessionStorage.setItem(key, value);
    else sessionStorage.removeItem(key);
  }
}
