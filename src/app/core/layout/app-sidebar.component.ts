import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { filter, startWith } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

import { AuthorizationService } from '../auth/authorization.service';
import { CRM_PERMISSIONS } from '../../features/crm/domain/crm-permissions';
import { STUDENT_PERMISSIONS } from '../../features/students/domain/student-permissions';
import { PEDAGOGY_PERMISSIONS } from '../../features/pedagogy/domain/pedagogy-permissions';
import { EXAMS_PERMISSIONS } from '../../features/exams/domain/exams-permissions';
import { SCHEDULING_PERMISSIONS } from '../../features/scheduling/domain/scheduling-permissions';
import { TRAINING_DELIVERY_PERMISSIONS } from '../../features/training-delivery/domain/training-delivery-permissions';
import { WORKFORCE_PERMISSIONS } from '../../features/workforce/domain/workforce-permissions';
import { PROFESSIONAL_MARKETPLACE_PERMISSIONS } from '../../features/professional-marketplace/domain/professional-marketplace-permissions';
import { NavigationItem } from './navigation-item';

interface NavigationGroup {
  readonly labelKey: string;
  readonly items: readonly NavigationItem[];
  readonly collapsible?: boolean;
  readonly id?: 'crm' | 'students' | 'workforce' | 'marketplace';
  readonly icon?: string;
}

@Component({
  selector: 'driveos-app-sidebar',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  template: `
    <aside
      class="flex h-full min-h-0 flex-col border-r border-[var(--driveos-border)] bg-[var(--driveos-surface-card)]"
    >
      <div
        class="flex h-[4.5rem] shrink-0 items-center gap-3 border-b border-[var(--driveos-border)] px-4"
      >
        <div
          class="flex size-9 items-center justify-center rounded-lg bg-[var(--driveos-primary-800)] text-white shadow-sm"
        >
          <i class="ph ph-car-profile text-xl" aria-hidden="true"></i>
        </div>
        <div class="min-w-0">
          <p class="truncate text-sm font-extrabold text-[var(--driveos-text-primary)]">DriveOS</p>
          <p class="truncate text-xs text-[var(--driveos-text-secondary)]">
            {{ 'layout.schoolName' | translate }}
          </p>
        </div>
      </div>

      <div
        class="shrink-0 border-b border-[var(--driveos-border)] px-4 py-2 text-xs text-[var(--driveos-text-secondary)]"
      >
        {{ 'layout.branchLabel' | translate }} :
        <strong class="text-[var(--driveos-text-primary)]">
          {{ 'layout.branchName' | translate }}
        </strong>
      </div>

      <nav
        class="min-h-0 flex-1 overflow-y-auto px-2 py-3"
        [attr.aria-label]="'layout.mainNavigation' | translate"
      >
        @for (group of visibleGroups(); track group.id ?? group.labelKey ?? $index) {
          @if (group.collapsible) {
            <button
              type="button"
              class="mb-1 flex min-h-10 w-full items-center gap-2 rounded-lg border-l-2 border-transparent px-2.5 text-left text-sm font-semibold text-[var(--driveos-text-secondary)] transition-colors hover:bg-[var(--driveos-surface-hover)] hover:text-[var(--driveos-text-primary)]"
              [class.border-l-[var(--driveos-primary-800)]]="isGroupActive(group)"
              [class.bg-[var(--driveos-primary-50)]]="isGroupActive(group)"
              [class.text-[var(--driveos-primary-800)]]="isGroupActive(group)"
              [attr.aria-expanded]="isExpanded(group)"
              [attr.aria-controls]="group.id ? 'driveos-' + group.id + '-navigation' : null"
              (click)="toggleGroup(group)"
            >
              <i
                [class]="(group.icon ?? 'ph ph-folder') + ' shrink-0 text-lg'"
                aria-hidden="true"
              ></i>
              <span class="min-w-0 flex-1 truncate">{{ group.labelKey | translate }}</span>
              <i
                class="ph text-sm"
                [class.ph-caret-up]="isExpanded(group)"
                [class.ph-caret-down]="!isExpanded(group)"
                aria-hidden="true"
              ></i>
            </button>
          } @else if (group.labelKey) {
            <p
              class="px-3 pb-1.5 pt-3 text-[0.67rem] font-extrabold uppercase tracking-[0.12em] text-[var(--driveos-text-tertiary)] first:pt-0"
            >
              {{ group.labelKey | translate }}
            </p>
          }

          <div
            class="mb-3 space-y-0.5"
            [class.ml-4]="group.collapsible"
            [class.border-l]="group.collapsible"
            [class.border-[var(--driveos-border)]]="group.collapsible"
            [class.pl-2]="group.collapsible"
            [id]="group.collapsible && group.id ? 'driveos-' + group.id + '-navigation' : null"
            [hidden]="group.collapsible && !isExpanded(group)"
          >
            @for (item of group.items; track item.routerLink) {
              <a
                [routerLink]="item.routerLink"
                class="flex min-h-10 items-center gap-2.5 rounded-lg border-l-2 border-transparent px-2.5 text-sm font-medium text-[var(--driveos-text-secondary)] transition-colors hover:bg-[var(--driveos-surface-hover)] hover:text-[var(--driveos-text-primary)]"
                [class.border-l-[var(--driveos-primary-800)]]="isItemActive(item)"
                [class.bg-[var(--driveos-primary-50)]]="isItemActive(item)"
                [class.font-semibold]="isItemActive(item)"
                [class.text-[var(--driveos-primary-800)]]="isItemActive(item)"
                [class.opacity-55]="item.disabled"
                [attr.aria-current]="isItemActive(item) ? 'page' : null"
                [attr.aria-disabled]="item.disabled || null"
                [attr.tabindex]="item.disabled ? -1 : null"
                (click)="preventDisabledNavigation($event, item)"
              >
                <i
                  [class]="item.icon + ' shrink-0 ' + (group.collapsible ? 'text-base' : 'text-lg')"
                  aria-hidden="true"
                ></i>
                <span class="min-w-0 flex-1 truncate">{{ item.labelKey | translate }}</span>
                @if (item.badgeKey) {
                  <span
                    class="rounded bg-[var(--driveos-surface-subtle)] px-1.5 py-0.5 text-[0.58rem] font-bold uppercase tracking-wide text-[var(--driveos-text-tertiary)]"
                  >
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

  private readonly currentNavigation = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      startWith(new NavigationEnd(0, this.router.url, this.router.url)),
    ),
    { initialValue: new NavigationEnd(0, this.router.url, this.router.url) },
  );

  readonly crmExpanded = signal(
    sessionStorage.getItem('driveos.sidebar.crm.expanded') !== 'false' ||
      this.router.url.startsWith('/crm'),
  );
  readonly studentsExpanded = signal(
    sessionStorage.getItem('driveos.sidebar.students.expanded') !== 'false' ||
      this.router.url.startsWith('/students'),
  );
  readonly workforceExpanded = signal(
    sessionStorage.getItem('driveos.sidebar.workforce.expanded') !== 'false' ||
      this.router.url.startsWith('/workforce'),
  );
  readonly marketplaceExpanded = signal(
    sessionStorage.getItem('driveos.sidebar.marketplace.expanded') !== 'false' ||
      this.router.url.startsWith('/marketplace'),
  );

  constructor() {
    effect(() => {
      const url = this.currentPath();
      if (url.startsWith('/crm')) this.crmExpanded.set(true);
      if (url.startsWith('/students')) this.studentsExpanded.set(true);
      if (url.startsWith('/workforce')) this.workforceExpanded.set(true);
      if (url.startsWith('/marketplace')) this.marketplaceExpanded.set(true);
    });
  }

  private currentPath(): string {
    const url = this.currentNavigation().urlAfterRedirects || this.router.url;
    return url.split('?')[0].split('#')[0] || '/';
  }

  private readonly pilotageItems: readonly NavigationItem[] = [
    {
      labelKey: 'navigation.dashboard',
      icon: 'ph ph-squares-four',
      routerLink: '/dashboard',
      exact: true,
    },
    {
      labelKey: 'navigation.organizations',
      icon: 'ph ph-buildings',
      routerLink: '/organizations',
    },
  ];

  private readonly operationItems: readonly NavigationItem[] = [
    { labelKey: 'navigation.planning', icon: 'ph ph-calendar-dots', routerLink: '/planning' },
    { labelKey: 'navigation.pedagogy', icon: 'ph ph-books', routerLink: '/pedagogy' },
    { labelKey: 'navigation.training', icon: 'ph ph-steering-wheel', routerLink: '/training' },
    { labelKey: 'navigation.exams', icon: 'ph ph-exam', routerLink: '/exams' },
  ];

  private readonly managementItems: readonly NavigationItem[] = [
    { labelKey: 'navigation.vehicles', icon: 'ph ph-car', routerLink: '/vehicles' },
    { labelKey: 'navigation.billing', icon: 'ph ph-wallet', routerLink: '/billing' },
  ];

  private readonly platformItems: readonly NavigationItem[] = [
    { labelKey: 'navigation.settings', icon: 'ph ph-gear', routerLink: '/settings' },
  ];

  private readonly studentItems: readonly NavigationItem[] = [
    {
      labelKey: 'navigation.studentsMenu.dashboard',
      icon: 'ph ph-squares-four',
      routerLink: '/students/dashboard',
      exact: true,
    },
    {
      labelKey: 'navigation.studentsMenu.list',
      icon: 'ph ph-users-three',
      routerLink: '/students/list',
      exact: true,
    },
    {
      labelKey: 'navigation.studentsMenu.newEnrollment',
      icon: 'ph ph-user-plus',
      routerLink: '/students/enrollments/new',
      exact: true,
    },
  ];

  private readonly workforceItems: readonly NavigationItem[] = [
    {
      labelKey: 'navigation.workforce.dashboard',
      icon: 'ph ph-squares-four',
      routerLink: '/workforce/dashboard',
      exact: true,
    },
    {
      labelKey: 'navigation.workforce.employees',
      icon: 'ph ph-users-three',
      routerLink: '/workforce/employees',
    },
    {
      labelKey: 'navigation.workforce.jobPositions',
      icon: 'ph ph-briefcase',
      routerLink: '/workforce/job-positions',
    },
    {
      labelKey: 'navigation.workforce.analytics',
      icon: 'ph ph-chart-line-up',
      routerLink: '/workforce/analytics',
    },
  ];

  private readonly marketplaceItems: readonly NavigationItem[] = [
    {
      labelKey: 'professionalMarketplace.navigation.dashboard',
      icon: 'ph ph-squares-four',
      routerLink: '/marketplace/dashboard',
      exact: true,
    },
    {
      labelKey: 'professionalMarketplace.navigation.professionals',
      icon: 'ph ph-magnifying-glass',
      routerLink: '/marketplace/professionals',
    },
    {
      labelKey: 'professionalMarketplace.navigation.opportunities',
      icon: 'ph ph-briefcase',
      routerLink: '/marketplace/opportunities',
    },
    {
      labelKey: 'professionalMarketplace.navigation.analytics',
      icon: 'ph ph-chart-line-up',
      routerLink: '/marketplace/analytics',
    },
    {
      labelKey: 'professionalMarketplace.navigation.myDashboard',
      icon: 'ph ph-gauge',
      routerLink: '/marketplace/my-dashboard',
      exact: true,
    },
    {
      labelKey: 'professionalMarketplace.navigation.myMissions',
      icon: 'ph ph-briefcase-metal',
      routerLink: '/marketplace/my-missions',
    },
    {
      labelKey: 'professionalMarketplace.navigation.myStudents',
      icon: 'ph ph-student',
      routerLink: '/marketplace/my-students',
    },
    {
      labelKey: 'professionalMarketplace.navigation.myServiceEntries',
      icon: 'ph ph-receipt',
      routerLink: '/marketplace/my-service-entries',
    },
  ];

  private readonly crmItems: readonly NavigationItem[] = [
    {
      labelKey: 'navigation.crm.dashboard',
      icon: 'ph ph-user-plus',
      routerLink: '/crm/dashboard',
      exact: true,
    },
    { labelKey: 'navigation.crm.prospects', icon: 'ph ph-users', routerLink: '/crm/leads' },
    {
      labelKey: 'navigation.crm.activities',
      icon: 'ph ph-waveform',
      routerLink: '/crm/activities',
    },
    { labelKey: 'navigation.crm.tasks', icon: 'ph ph-check-square', routerLink: '/crm/tasks' },
    { labelKey: 'navigation.crm.pipeline', icon: 'ph ph-git-branch', routerLink: '/crm/pipeline' },
  ];

  readonly visibleGroups = computed<readonly NavigationGroup[]>(() => {
    this.authorization.permissions();
    this.currentNavigation();

    const canReadDashboard = this.authorization.hasPermission(CRM_PERMISSIONS.dashboard.read);
    const canReadLeads = this.authorization.hasPermission(CRM_PERMISSIONS.leads.read);
    const visibleCrmItems = this.crmItems.filter((item) => {
      if (item.routerLink === '/crm/dashboard') return canReadDashboard;
      if (item.routerLink === '/crm/leads' || item.routerLink === '/crm/pipeline') return canReadLeads;
      if (item.routerLink === '/crm/activities') {
        return this.authorization.hasPermission(CRM_PERMISSIONS.activities.read);
      }
      if (item.routerLink === '/crm/tasks') {
        return this.authorization.hasPermission(CRM_PERMISSIONS.tasks.read);
      }
      return true;
    });

    const visibleStudentItems = this.studentItems.filter((item) => {
      if (item.routerLink === '/students/enrollments/new') {
        return (
          this.authorization.hasPermission(STUDENT_PERMISSIONS.create) &&
          this.authorization.hasPermission(STUDENT_PERMISSIONS.enrollmentCreate)
        );
      }
      return this.authorization.hasPermission(STUDENT_PERMISSIONS.read);
    });

    const visibleOperationItems = this.operationItems.filter((item) => {
      if (item.routerLink === '/pedagogy') {
        return this.authorization.hasPermission(PEDAGOGY_PERMISSIONS.curricula.read);
      }
      if (item.routerLink === '/planning') {
        return this.authorization.hasAny([
          SCHEDULING_PERMISSIONS.bookings.read,
          SCHEDULING_PERMISSIONS.availability.read,
          SCHEDULING_PERMISSIONS.conflicts.read,
          SCHEDULING_PERMISSIONS.waitingList.read,
          SCHEDULING_PERMISSIONS.resources.read,
          SCHEDULING_PERMISSIONS.capacity.read,
        ]);
      }
      if (item.routerLink === '/training') {
        return this.authorization.hasAny([
          TRAINING_DELIVERY_PERMISSIONS.sessions.read,
          TRAINING_DELIVERY_PERMISSIONS.incidents.read,
        ]);
      }
      if (item.routerLink === '/exams') {
        return this.authorization.hasAny([
          EXAMS_PERMISSIONS.analytics.read,
          EXAMS_PERMISSIONS.readiness.read,
          EXAMS_PERMISSIONS.places.read,
          EXAMS_PERMISSIONS.registrations.read,
          EXAMS_PERMISSIONS.results.read,
        ]);
      }
      return true;
    });

    const visibleWorkforceItems = this.workforceItems.filter((item) => {
      if (item.routerLink === '/workforce/dashboard') {
        return this.authorization.hasPermission(WORKFORCE_PERMISSIONS.dashboard.read);
      }
      if (item.routerLink === '/workforce/job-positions') {
        return this.authorization.hasPermission(WORKFORCE_PERMISSIONS.jobPositions.read);
      }
      if (item.routerLink === '/workforce/analytics') {
        return this.authorization.hasPermission(WORKFORCE_PERMISSIONS.analytics.read);
      }
      return this.authorization.hasPermission(WORKFORCE_PERMISSIONS.employees.read);
    });

    const visibleMarketplaceItems = this.marketplaceItems.filter((item) => {
      if (item.routerLink === '/marketplace/dashboard' || item.routerLink === '/marketplace/my-dashboard') {
        return this.authorization.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.dashboard.read);
      }
      if (item.routerLink === '/marketplace/professionals') {
        return this.authorization.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.search.read);
      }
      if (item.routerLink === '/marketplace/opportunities') {
        return this.authorization.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.opportunities.read);
      }
      if (item.routerLink === '/marketplace/analytics') {
        return this.authorization.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.analytics.read);
      }
      if (item.routerLink === '/marketplace/my-missions') {
        return this.authorization.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.missions.read);
      }
      if (item.routerLink === '/marketplace/my-students') {
        return this.authorization.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.studentAssignments.read);
      }
      if (item.routerLink === '/marketplace/my-service-entries') {
        return this.authorization.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.serviceEntries.read);
      }
      return false;
    });

    const groups: NavigationGroup[] = [
      { labelKey: 'navigation.groups.pilotage', items: this.pilotageItems },
      { labelKey: 'navigation.groups.operations', items: [] },
    ];

    if (visibleCrmItems.length) {
      groups.push({
        id: 'crm',
        labelKey: 'navigation.crm.label',
        icon: 'ph ph-funnel',
        items: visibleCrmItems,
        collapsible: true,
      });
    }

    if (visibleStudentItems.length) {
      groups.push({
        id: 'students',
        labelKey: 'navigation.studentsMenu.label',
        icon: 'ph ph-student',
        items: visibleStudentItems,
        collapsible: true,
      });
    }

    if (visibleOperationItems.length) {
      groups.push({ labelKey: '', items: visibleOperationItems });
    }

    groups.push({ labelKey: 'navigation.groups.management', items: [] });

    if (visibleWorkforceItems.length) {
      groups.push({
        id: 'workforce',
        labelKey: 'navigation.workforce.label',
        icon: 'ph ph-users-four',
        items: visibleWorkforceItems,
        collapsible: true,
      });
    }

    if (visibleMarketplaceItems.length) {
      groups.push({
        id: 'marketplace',
        labelKey: 'professionalMarketplace.navigation.label',
        icon: 'ph ph-handshake',
        items: visibleMarketplaceItems,
        collapsible: true,
      });
    }

    groups.push({ labelKey: '', items: this.managementItems });
    groups.push({ labelKey: 'navigation.groups.platform', items: this.platformItems });
    return groups;
  });

  isItemActive(item: NavigationItem): boolean {
    const current = this.currentPath();
    const target = item.routerLink.split('?')[0].split('#')[0];
    if (item.exact) return current === target;
    return current === target || current.startsWith(`${target}/`);
  }

  isGroupActive(group: NavigationGroup): boolean {
    return group.items.some((item) => this.isItemActive(item));
  }

  isExpanded(group: NavigationGroup): boolean {
    if (group.id === 'crm') return this.crmExpanded();
    if (group.id === 'students') return this.studentsExpanded();
    if (group.id === 'workforce') return this.workforceExpanded();
    if (group.id === 'marketplace') return this.marketplaceExpanded();
    return true;
  }

  toggleGroup(group: NavigationGroup): void {
    if (group.id === 'crm') {
      const expanded = !this.crmExpanded();
      this.crmExpanded.set(expanded);
      sessionStorage.setItem('driveos.sidebar.crm.expanded', `${expanded}`);
      return;
    }
    if (group.id === 'students') {
      const expanded = !this.studentsExpanded();
      this.studentsExpanded.set(expanded);
      sessionStorage.setItem('driveos.sidebar.students.expanded', `${expanded}`);
      return;
    }
    if (group.id === 'workforce') {
      const expanded = !this.workforceExpanded();
      this.workforceExpanded.set(expanded);
      sessionStorage.setItem('driveos.sidebar.workforce.expanded', `${expanded}`);
      return;
    }
    if (group.id === 'marketplace') {
      const expanded = !this.marketplaceExpanded();
      this.marketplaceExpanded.set(expanded);
      sessionStorage.setItem('driveos.sidebar.marketplace.expanded', `${expanded}`);
    }
  }

  preventDisabledNavigation(event: Event, item: NavigationItem): void {
    if (item.disabled) event.preventDefault();
  }
}
