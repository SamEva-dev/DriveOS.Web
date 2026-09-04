import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  output,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { AuthorizationService } from '../auth/authorization.service';
import { CommunicationNotificationService } from '../notifications/communication-notification.service';
import { NotificationCenterDrawerComponent } from '../notifications/notification-center-drawer.component';

import { AuthService } from '../services/auth.service';
import { ThemeMode } from '../theme/theme-mode';
import { ThemeService } from '../theme/theme.service';
import { TenantContextService } from '../tenancy/tenant-context.service';
import { BranchesApiService } from '../../features/organizations/branches/data-access/branches-api.service';
import { BranchListItem } from '../../features/organizations/branches/models/branch-list-item';

@Component({
  selector: 'driveos-app-topbar',
  standalone: true,
  imports: [TranslatePipe, NotificationCenterDrawerComponent],
  template: `
    <header
      class="flex h-[4.5rem] items-center gap-3 border-b border-[var(--driveos-border)] bg-[var(--driveos-surface-card)] px-3 md:px-5"
    >
      <button
        type="button"
        class="driveos-topbar-icon lg:hidden"
        [attr.aria-label]="'layout.openMenu' | translate"
        (click)="menuRequested.emit()"
      >
        <i
          class="ph ph-list text-xl"
          aria-hidden="true"
        ></i>
      </button>

      <button
        type="button"
        class="hidden size-9 shrink-0 items-center justify-center rounded-lg text-[var(--driveos-text-secondary)] hover:bg-[var(--driveos-surface-hover)] lg:flex"
        [attr.aria-label]="'layout.collapseMenu' | translate"
        (click)="sidebarToggleRequested.emit()"
      >
        <i
          class="ph ph-sidebar-simple text-lg"
          aria-hidden="true"
        ></i>
      </button>

      <div class="hidden min-w-52 items-center gap-3 rounded-lg px-2 py-1.5 md:flex">
        <span
          class="flex size-9 items-center justify-center rounded-lg bg-[var(--driveos-primary-50)] text-[var(--driveos-primary-800)] dark:bg-blue-950/50 dark:text-blue-200"
        >
          <i
            class="ph ph-stack text-xl"
            aria-hidden="true"
          ></i>
        </span>
        <span class="min-w-0">
          <span
            class="block text-[0.65rem] font-bold uppercase tracking-wide text-[var(--driveos-text-tertiary)]"
          >
            {{ 'layout.branchLabel' | translate }}
          </span>
          <select
            class="max-w-44 bg-transparent text-sm font-bold text-[var(--driveos-text-primary)] outline-none"
            [value]="tenantContext.branchId() ?? ''"
            [disabled]="branchesLoading() || branches().length === 0"
            [attr.aria-label]="'layout.branchLabel' | translate"
            (change)="changeBranch($event)"
          >
            <option value="">{{ 'layout.allBranches' | translate }}</option>
            @for (branch of branches(); track branch.id) {
              <option [value]="branch.id">{{ branch.name }} ({{ branch.code }})</option>
            }
          </select>
        </span>
      </div>

      <label class="relative hidden max-w-md flex-1 xl:block">
        <span class="sr-only">{{ 'layout.globalSearch' | translate }}</span>
        <i
          class="ph ph-magnifying-glass pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg text-[var(--driveos-text-tertiary)]"
          aria-hidden="true"
        ></i>
        <input
          type="search"
          class="h-10 w-full rounded-lg border border-[var(--driveos-border)] bg-[var(--driveos-surface-subtle)] pl-10 pr-16 text-sm text-[var(--driveos-text-primary)] outline-none transition focus:border-[var(--driveos-primary-700)] focus:ring-2 focus:ring-blue-700/10"
          [placeholder]="'layout.searchPlaceholder' | translate"
        />
        <kbd
          class="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-[var(--driveos-border)] bg-[var(--driveos-surface-card)] px-1.5 py-0.5 text-[0.65rem] text-[var(--driveos-text-tertiary)]"
        >
          Ctrl K
        </kbd>
      </label>

      <div class="ml-auto flex items-center gap-1 sm:gap-2">
        <span
          class="hidden items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 lg:flex dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
        >
          <i
            class="ph ph-wifi-high"
            aria-hidden="true"
          ></i>
          {{ 'layout.online' | translate }}
        </span>

        <button
          type="button"
          class="driveos-topbar-icon xl:hidden"
          [attr.aria-label]="'layout.globalSearch' | translate"
        >
          <i
            class="ph ph-magnifying-glass text-xl"
            aria-hidden="true"
          ></i>
        </button>
        @if (canReadNotifications()) {
          <button
            type="button"
            class="driveos-topbar-icon relative"
            [attr.aria-label]="'layout.notifications' | translate"
            (click)="openNotifications()"
          >
            <i
              class="ph ph-bell text-xl"
              aria-hidden="true"
            ></i>
            @if (unreadNotifications() > 0) {
              <span
                class="absolute right-0.5 top-0.5 flex min-w-4 h-4 items-center justify-center rounded-full bg-red-600 px-1 text-[0.6rem] font-bold text-white"
              >
                {{ unreadNotifications() > 99 ? '99+' : unreadNotifications() }}
              </span>
            }
          </button>
        }

        <label
          class="sr-only"
          for="themeMode"
        >
          {{ 'theme.label' | translate }}
        </label>
        <select
          id="themeMode"
          class="driveos-topbar-icon appearance-none text-center text-xs"
          [value]="themeService.currentMode()"
          (change)="changeTheme($event)"
          [attr.aria-label]="'theme.label' | translate"
        >
          <option value="system">◐</option>
          <option value="light">☀</option>
          <option value="dark">☾</option>
        </select>

        <button
          type="button"
          class="flex items-center gap-2 rounded-lg p-1 hover:bg-[var(--driveos-surface-hover)]"
          [attr.aria-label]="'layout.userProfile' | translate"
        >
          <span
            class="flex size-9 items-center justify-center rounded-full bg-[var(--driveos-primary-50)] text-xs font-bold text-[var(--driveos-primary-800)] dark:bg-blue-950/50 dark:text-blue-200"
          >
            {{ initials() }}
          </span>
          <i
            class="ph ph-caret-down hidden text-xs text-[var(--driveos-text-secondary)] sm:block"
            aria-hidden="true"
          ></i>
        </button>

        <button
          type="button"
          class="driveos-topbar-icon"
          [disabled]="isSigningOut()"
          [attr.aria-label]="'layout.logout' | translate"
          (click)="signOut()"
        >
          <i
            class="ph ph-sign-out text-lg"
            aria-hidden="true"
          ></i>
        </button>
      </div>
    </header>
    <driveos-notification-center-drawer
      [open]="notificationsOpen()"
      (closeRequested)="notificationsOpen.set(false)"
      (countChanged)="unreadNotifications.set($event)"
    />
  `,
  styles: `
    .driveos-topbar-icon {
      display: inline-flex;
      width: 2.5rem;
      height: 2.5rem;
      align-items: center;
      justify-content: center;
      border-radius: 0.5rem;
      color: var(--driveos-text-secondary);
      transition:
        background-color 150ms,
        color 150ms;
    }
    .driveos-topbar-icon:hover {
      background: var(--driveos-surface-hover);
      color: var(--driveos-text-primary);
    }
    .driveos-topbar-icon:focus-visible {
      outline: 2px solid var(--driveos-primary-700);
      outline-offset: 2px;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppTopbarComponent {
  readonly menuRequested = output<void>();
  readonly sidebarToggleRequested = output<void>();
  readonly themeService = inject(ThemeService);
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly authorization = inject(AuthorizationService);
  private readonly notifications = inject(CommunicationNotificationService);
  readonly tenantContext = inject(TenantContextService);
  private readonly branchesApi = inject(BranchesApiService);
  readonly isSigningOut = signal(false);
  readonly notificationsOpen = signal(false);
  readonly unreadNotifications = signal(0);
  readonly branches = signal<readonly BranchListItem[]>([]);
  readonly branchesLoading = signal(false);
  readonly canReadNotifications = computed(() =>
    this.authorization.hasPermission('Communication.Notifications.Read'),
  );
  constructor() {
    void this.loadUnreadCount();
    void this.loadBranches();
  }

  readonly initials = computed(() => {
    const source = this.auth.user()?.fullName?.trim() || this.auth.user()?.email || 'U';
    const words = source.split(/\s+/).filter(Boolean);
    return (words.length >= 2 ? `${words[0][0]}${words[1][0]}` : source.slice(0, 2)).toUpperCase();
  });

  openNotifications(): void {
    this.notificationsOpen.set(true);
  }

  private async loadUnreadCount(): Promise<void> {
    if (!this.canReadNotifications()) return;
    try {
      const result = await firstValueFrom(this.notifications.unreadCount());
      this.unreadNotifications.set(result.count);
    } catch {
      this.unreadNotifications.set(0);
    }
  }

  async signOut(): Promise<void> {
    if (this.isSigningOut()) return;
    this.isSigningOut.set(true);
    try {
      await this.auth.signOut();
      await this.router.navigate(['/login']);
    } finally {
      this.isSigningOut.set(false);
    }
  }

  changeTheme(event: Event): void {
    this.themeService.setMode((event.target as HTMLSelectElement).value as ThemeMode);
  }

  changeBranch(event: Event): void {
    const branchId = (event.target as HTMLSelectElement).value || null;
    if (branchId === this.tenantContext.branchId()) return;
    this.tenantContext.setBranch(branchId);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('driveos:tenant-context-changed'));
      window.location.reload();
    }
  }

  private async loadBranches(): Promise<void> {
    const organizationId = this.tenantContext.organizationId();
    if (!organizationId || this.branchesLoading()) return;
    this.branchesLoading.set(true);
    try {
      const response = await firstValueFrom(
        this.branchesApi.getPaged(organizationId, {
          pageNumber: 1,
          pageSize: 100,
          search: '',
          sortBy: 'name',
          sortDirection: 'asc',
        }),
      );
      const selectable = response.items.filter((branch) => branch.status === 'Active');
      this.branches.set(selectable);
      const selected = this.tenantContext.branchId();
      if (selected && !selectable.some((branch) => branch.id === selected)) {
        this.tenantContext.setBranch(null);
      }
    } catch {
      this.branches.set([]);
    } finally {
      this.branchesLoading.set(false);
    }
  }
}
