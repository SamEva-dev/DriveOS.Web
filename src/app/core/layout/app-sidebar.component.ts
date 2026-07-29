import {
  ChangeDetectionStrategy,
  Component,
} from '@angular/core';

import {
  RouterLink,
  RouterLinkActive,
} from '@angular/router';

import {
  TranslatePipe,
} from '@ngx-translate/core';

import {
  NavigationItem,
} from './navigation-item';

@Component({
  selector: 'driveos-app-sidebar',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    TranslatePipe,
  ],
  template: `
    <aside
      class="flex h-full flex-col
             border-r
             border-[var(--driveos-surface-border)]
             bg-[var(--driveos-surface-card)]"
    >
      <div
        class="flex h-16 items-center gap-3
               border-b
               border-[var(--driveos-surface-border)]
               px-5"
      >
        <div
          class="flex size-10 items-center
                 justify-center rounded-xl
                 bg-[var(--driveos-primary)]
                 text-lg font-bold text-white"
        >
          D
        </div>

        <div>
          <p class="text-lg font-bold">
            DriveOS
          </p>

          <p
            class="text-xs
                   text-[var(--driveos-text-muted)]"
          >
            Driving School OS
          </p>
        </div>
      </div>

      <nav
        class="flex-1 space-y-1 overflow-y-auto p-3"
        aria-label="Navigation principale"
      >
        @for (item of navigationItems; track item.routerLink) {
          <a
            [routerLink]="item.routerLink"
            routerLinkActive="driveos-navigation-active"
            [routerLinkActiveOptions]="{
              exact: item.exact ?? false
            }"
            class="flex items-center gap-3
                   rounded-xl px-3 py-2.5
                   text-sm font-medium
                   text-[var(--driveos-text-muted)]
                   transition-colors
                   hover:bg-surface-100
                   hover:text-[var(--driveos-text-color)]
                   dark:hover:bg-surface-800"
          >
            <i
              [class]="item.icon"
              aria-hidden="true"
            ></i>

            <span>
              {{ item.labelKey | translate }}
            </span>
          </a>
        }
      </nav>

      <div
        class="border-t
               border-[var(--driveos-surface-border)]
               p-3"
      >
        <div
          class="rounded-xl
                 bg-surface-100 p-3
                 dark:bg-surface-800"
        >
          <p class="text-sm font-semibold">
            DriveOS
          </p>

          <p
            class="mt-1 text-xs
                   text-[var(--driveos-text-muted)]"
          >
            Environnement de développement
          </p>
        </div>
      </div>
    </aside>
  `,
  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class AppSidebarComponent {
  readonly navigationItems:
  readonly NavigationItem[] = [
  {
    labelKey: 'navigation.dashboard',
    icon: 'ph ph-house',
    routerLink: '/dashboard',
    exact: true,
  },
  {
    labelKey: 'navigation.organizations',
    icon: 'ph ph-buildings',
    routerLink: '/organizations',
  },
  {
    labelKey: 'navigation.students',
    icon: 'ph ph-users',
    routerLink: '/students',
  },
  {
    labelKey: 'navigation.planning',
    icon: 'ph ph-calendar-dots',
    routerLink: '/planning',
  },
  {
    labelKey: 'navigation.instructors',
    icon: 'ph ph-identification-card',
    routerLink: '/instructors',
  },
  {
    labelKey: 'navigation.vehicles',
    icon: 'ph ph-car',
    routerLink: '/vehicles',
  },
  {
    labelKey: 'navigation.billing',
    icon: 'ph ph-wallet',
    routerLink: '/billing',
  },
  {
    labelKey: 'navigation.settings',
    icon: 'ph ph-gear',
    routerLink: '/settings',
  },
];
}
