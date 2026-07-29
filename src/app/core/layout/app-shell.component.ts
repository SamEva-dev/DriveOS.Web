import {
  ChangeDetectionStrategy,
  Component,
  signal,
} from '@angular/core';

import {
  NavigationEnd,
  Router,
  RouterOutlet,
} from '@angular/router';

import {
  filter,
} from 'rxjs';

import {
  takeUntilDestroyed,
} from '@angular/core/rxjs-interop';


import {
  AppSidebarComponent,
} from './app-sidebar.component';

import {
  AppTopbarComponent,
} from './app-topbar.component';
import { DriveOsDrawerComponent } from '../../shared/ui';

@Component({
  selector: 'driveos-app-shell',
  standalone: true,
  imports: [
    RouterOutlet,
  DriveOsDrawerComponent,
  AppSidebarComponent,
  AppTopbarComponent,
  ],
  template: `
    <div
      class="min-h-screen
             bg-[var(--driveos-surface-ground)]
             text-[var(--driveos-text-color)]"
    >
      <div
        class="fixed inset-y-0 left-0
               z-30 hidden w-72 lg:block"
      >
        <driveos-app-sidebar />
      </div>

      <dos-drawer
        ariaLabel="Navigation principale"
        [open]="mobileMenuVisible()"
        (closeRequested)="
          mobileMenuVisible.set(false)
        "
      >
        <driveos-app-sidebar />
      </dos-drawer>

      <div class="min-h-screen lg:pl-72">
        <div class="sticky top-0 z-20">
          <driveos-app-topbar
            (menuRequested)="openMobileMenu()"
          />
        </div>

        <main class="p-4 md:p-6">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class AppShellComponent {
  readonly mobileMenuVisible =
    signal(false);

  constructor(router: Router) {
    router.events
      .pipe(
        filter(
          event =>
            event instanceof NavigationEnd,
        ),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        this.mobileMenuVisible.set(false);
      });
  }

  openMobileMenu(): void {
    this.mobileMenuVisible.set(true);
  }
}
