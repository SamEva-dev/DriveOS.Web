import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { filter, startWith } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

import { AuthorizationService } from '../auth/authorization.service';
import { CRM_PERMISSIONS } from '../../features/crm/domain/crm-permissions';
import { NavigationItem } from './navigation-item';

interface NavigationGroup {
  readonly labelKey: string;
  readonly items: readonly NavigationItem[];
  readonly collapsible?: boolean;
}

@Component({
  selector: 'driveos-app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TranslatePipe],
  template: `
    <aside class="flex h-full min-h-0 flex-col border-r border-[var(--driveos-border)] bg-[var(--driveos-surface-card)]">
      <div class="flex h-[4.5rem] shrink-0 items-center gap-3 border-b border-[var(--driveos-border)] px-4">
        <div class="flex size-9 items-center justify-center rounded-lg bg-[var(--driveos-primary-800)] text-white shadow-sm">
          <i class="ph ph-car-profile text-xl" aria-hidden="true"></i>
        </div>
        <div class="min-w-0">
          <p class="truncate text-sm font-extrabold text-[var(--driveos-text-primary)]">DriveOS</p>
          <p class="truncate text-xs text-[var(--driveos-text-secondary)]">{{ 'layout.schoolName' | translate }}</p>
        </div>
      </div>

      <div class="shrink-0 border-b border-[var(--driveos-border)] px-4 py-2 text-xs text-[var(--driveos-text-secondary)]">
        {{ 'layout.branchLabel' | translate }} :
        <strong class="text-[var(--driveos-text-primary)]">{{ 'layout.branchName' | translate }}</strong>
      </div>

      <nav class="min-h-0 flex-1 overflow-y-auto px-2 py-3" [attr.aria-label]="'layout.mainNavigation' | translate">
        @for (group of visibleGroups(); track group.labelKey) {
          @if (group.collapsible) {
            <button type="button" class="mb-1 flex min-h-9 w-full items-center gap-2 rounded-lg px-2.5 text-left text-sm font-bold text-[var(--driveos-text-primary)] hover:bg-[var(--driveos-surface-hover)]" [attr.aria-expanded]="crmExpanded()" aria-controls="driveos-crm-navigation" (click)="toggleCrm()"><i class="ph ph-funnel text-lg"></i><span class="min-w-0 flex-1 truncate">{{ group.labelKey | translate }}</span><i class="ph text-sm" [class.ph-caret-up]="crmExpanded()" [class.ph-caret-down]="!crmExpanded()"></i></button>
          } @else {
            <p class="px-2 pb-1 pt-1 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[var(--driveos-text-tertiary)]">{{ group.labelKey | translate }}</p>
          }

          <div class="mb-3 space-y-0.5" [id]="group.collapsible ? 'driveos-crm-navigation' : null" [hidden]="group.collapsible && !crmExpanded()">
            @for (item of group.items; track item.routerLink) {
              <a
                [routerLink]="item.routerLink"
                routerLinkActive="driveos-navigation-active"
                [routerLinkActiveOptions]="{ exact: item.exact ?? false }"
                class="flex min-h-9 items-center gap-2.5 rounded-lg px-2.5 text-sm font-medium text-[var(--driveos-text-secondary)] transition-colors hover:bg-[var(--driveos-surface-hover)] hover:text-[var(--driveos-text-primary)]"
                [class.opacity-55]="item.disabled"
                [attr.aria-disabled]="item.disabled || null"
                [attr.tabindex]="item.disabled ? -1 : null"
                (click)="preventDisabledNavigation($event, item)"
              >
                <i [class]="item.icon + ' shrink-0 text-lg'" aria-hidden="true"></i>
                <span class="min-w-0 flex-1 truncate">{{ item.labelKey | translate }}</span>
                @if (item.badgeKey) {
                  <span class="rounded bg-[var(--driveos-surface-subtle)] px-1.5 py-0.5 text-[0.58rem] font-bold uppercase tracking-wide text-[var(--driveos-text-tertiary)]">
                    {{ item.badgeKey | translate }}
                  </span>
                }
              </a>
            }
          </div>
        }
      </nav>
    </aside>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppSidebarComponent {
  private readonly authorization = inject(AuthorizationService);
  private readonly router = inject(Router);
  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      startWith(new NavigationEnd(0, this.router.url, this.router.url)),
    ),
    { initialValue: new NavigationEnd(0, this.router.url, this.router.url) },
  );
  readonly crmExpanded = signal(sessionStorage.getItem('driveos.sidebar.crm.expanded') !== 'false'
    || this.router.url.startsWith('/crm'));

  constructor() {
    effect(() => {
      if (this.currentUrl().urlAfterRedirects.startsWith('/crm')) this.crmExpanded.set(true);
    });
  }

  private readonly mainItems: readonly NavigationItem[] = [
    { labelKey: 'navigation.dashboard', icon: 'ph ph-squares-four', routerLink: '/dashboard', exact: true },
    { labelKey: 'navigation.organizations', icon: 'ph ph-buildings', routerLink: '/organizations' },
    { labelKey: 'navigation.students', icon: 'ph ph-student', routerLink: '/students' },
    { labelKey: 'navigation.planning', icon: 'ph ph-calendar-dots', routerLink: '/planning' },
    { labelKey: 'navigation.instructors', icon: 'ph ph-identification-card', routerLink: '/instructors' },
    { labelKey: 'navigation.vehicles', icon: 'ph ph-car', routerLink: '/vehicles' },
    { labelKey: 'navigation.billing', icon: 'ph ph-wallet', routerLink: '/billing' },
    { labelKey: 'navigation.settings', icon: 'ph ph-gear', routerLink: '/settings' },
  ];

  private readonly crmItems: readonly NavigationItem[] = [
    { labelKey: 'navigation.crm.dashboard', icon: 'ph ph-user-plus', routerLink: '/crm/dashboard', exact: true },
    { labelKey: 'navigation.crm.prospects', icon: 'ph ph-users', routerLink: '/crm/leads' },
    { labelKey: 'navigation.crm.activities', icon: 'ph ph-waveform', routerLink: '/crm/activities' },
    { labelKey: 'navigation.crm.appointments', icon: 'ph ph-calendar-check', routerLink: '/crm/appointments', disabled: true },
    { labelKey: 'navigation.crm.tasks', icon: 'ph ph-check-square', routerLink: '/crm/tasks' },
    { labelKey: 'navigation.crm.pipeline', icon: 'ph ph-git-branch', routerLink: '/crm/pipeline' },
    { labelKey: 'navigation.crm.offers', icon: 'ph ph-file-text', routerLink: '/crm/offers', disabled: true },
    { labelKey: 'navigation.crm.communications', icon: 'ph ph-chat-centered', routerLink: '/crm/communications', disabled: true },
    { labelKey: 'navigation.crm.acquisition', icon: 'ph ph-target', routerLink: '/crm/acquisition', disabled: true },
    { labelKey: 'navigation.crm.duplicates', icon: 'ph ph-copy', routerLink: '/crm/duplicates', disabled: true, badgeKey: 'common.soon' },
    { labelKey: 'navigation.crm.conversions', icon: 'ph ph-seal-check', routerLink: '/crm/conversions', disabled: true, badgeKey: 'common.soon' },
    { labelKey: 'navigation.crm.losses', icon: 'ph ph-user-minus', routerLink: '/crm/losses', disabled: true, badgeKey: 'common.soon' },
    { labelKey: 'navigation.crm.analytics', icon: 'ph ph-chart-pie-slice', routerLink: '/crm/analytics', disabled: true, badgeKey: 'common.soon' },
  ];

  readonly visibleGroups = computed<readonly NavigationGroup[]>(() => {
    this.authorization.permissions();
    this.currentUrl();
    const canReadDashboard = this.authorization.hasPermission(CRM_PERMISSIONS.dashboard.read);
    const canReadLeads = this.authorization.hasPermission(CRM_PERMISSIONS.leads.read);
    const visibleCrmItems = this.crmItems.filter((item) => {
      if (item.disabled) return false;
      if (item.routerLink === '/crm/dashboard') return canReadDashboard;
      if (item.routerLink === '/crm/leads' || item.routerLink === '/crm/pipeline') return canReadLeads;
      if (item.routerLink === '/crm/activities') return this.authorization.hasPermission(CRM_PERMISSIONS.activities.read);
      if (item.routerLink === '/crm/tasks') return this.authorization.hasPermission(CRM_PERMISSIONS.tasks.read);
      return true;
    });

    return canReadDashboard || canReadLeads
      ? [{ labelKey: 'navigation.crm.label', items: visibleCrmItems, collapsible: true },
        { labelKey: 'navigation.groups.platform', items: this.mainItems }]
      : [{ labelKey: 'navigation.groups.platform', items: this.mainItems }];
  });

  toggleCrm(): void {
    const expanded = !this.crmExpanded();
    this.crmExpanded.set(expanded);
    sessionStorage.setItem('driveos.sidebar.crm.expanded', `${expanded}`);
  }

  preventDisabledNavigation(event: Event, item: NavigationItem): void {
    if (item.disabled) event.preventDefault();
  }
}
