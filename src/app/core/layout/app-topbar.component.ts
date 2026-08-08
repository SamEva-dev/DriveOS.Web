import { ChangeDetectionStrategy, Component, computed, inject, output, signal } from '@angular/core';

import { TranslatePipe } from '@ngx-translate/core';
import { Router } from '@angular/router';

import { ThemeService } from '../theme/theme.service';

import { ThemeMode } from '../theme/theme-mode';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'driveos-app-topbar',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <header
      class="flex h-16 items-center
             justify-between gap-4
             border-b
             border-[var(--driveos-surface-border)]
             bg-[var(--driveos-surface-card)]
             px-4 md:px-6"
    >
      <div class="flex items-center gap-3">
        <button
          type="button"
          class="
            flex size-10 items-center
            justify-center rounded-lg
            text-slate-600
            transition-colors
            hover:bg-slate-100
            hover:text-slate-900
            focus-visible:outline-none
            focus-visible:ring-2
            focus-visible:ring-blue-700
            lg:hidden
            dark:text-slate-300
            dark:hover:bg-slate-800
            dark:hover:text-white
          "
          aria-label="Ouvrir le menu"
          (click)="menuRequested.emit()"
        >
          <i
            class="ph ph-list text-xl"
            aria-hidden="true"
          ></i>
        </button>

        <div>
          <p class="font-semibold">DriveOS</p>

          <p
            class="hidden text-xs
                   text-[var(--driveos-text-muted)]
                   sm:block"
          >
            {{ 'layout.workspace' | translate }}
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <label
          for="themeMode"
          class="sr-only"
        >
          {{ 'theme.label' | translate }}
        </label>

        <select
          id="themeMode"
          class="h-10 rounded-lg
                 border
                 border-[var(--driveos-surface-border)]
                 bg-[var(--driveos-surface-card)]
                 px-3 text-sm"
          [value]="themeService.currentMode()"
          (change)="changeTheme($event)"
        >
          <option value="system">
            {{ 'theme.system' | translate }}
          </option>

          <option value="light">
            {{ 'theme.light' | translate }}
          </option>

          <option value="dark">
            {{ 'theme.dark' | translate }}
          </option>
        </select>

        <button
          type="button"
          class="
              flex size-10 items-center
              justify-center rounded-lg
              text-slate-600
              transition-colors
              hover:bg-slate-100
              hover:text-slate-900
              focus-visible:outline-none
              focus-visible:ring-2
              focus-visible:ring-blue-700
              dark:text-slate-300
              dark:hover:bg-slate-800
              dark:hover:text-white
            "
          aria-label="Notifications"
        >
          <i
            class="ph ph-bell text-xl"
            aria-hidden="true"
          ></i>
        </button>

        <div class="hidden text-right md:block">
          <p class="max-w-48 truncate text-sm font-medium">
            {{ auth.user()?.fullName ?? auth.user()?.email }}
          </p>
          <p class="max-w-48 truncate text-xs text-[var(--driveos-text-muted)]">
            {{ auth.user()?.email }}
          </p>
        </div>

        <div
          class="flex size-10 items-center
                 justify-center rounded-full
                 bg-[var(--driveos-primary)]
                 font-semibold text-white"
          [attr.aria-label]="'layout.userProfile' | translate"
        >
          {{ initials() }}
        </div>

        <button
          type="button"
          class="flex h-10 items-center gap-2 rounded-lg
                 px-3 text-sm font-medium text-slate-600
                 transition-colors hover:bg-slate-100 hover:text-slate-900
                 focus-visible:outline-none focus-visible:ring-2
                 focus-visible:ring-blue-700 disabled:cursor-not-allowed
                 disabled:opacity-60 dark:text-slate-300
                 dark:hover:bg-slate-800 dark:hover:text-white"
          [disabled]="isSigningOut()"
          (click)="signOut()"
        >
          <i
            class="ph ph-sign-out text-lg"
            aria-hidden="true"
          ></i>
          <span class="hidden sm:inline">
            {{ (isSigningOut() ? 'auth.signingOut' : 'auth.logout') | translate }}
          </span>
        </button>
      </div>
    </header>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppTopbarComponent {
  readonly menuRequested = output<void>();

  readonly themeService = inject(ThemeService);
  readonly auth = inject(AuthService);

  private readonly router = inject(Router);
  readonly isSigningOut = signal(false);
  readonly initials = computed(() => {
    const user = this.auth.user();
    const source = user?.fullName?.trim() || user?.email || 'U';
    const words = source.split(/\s+/).filter(Boolean);

    if (words.length >= 2) {
      return `${words[0][0]}${words[1][0]}`.toUpperCase();
    }

    return source.slice(0, 2).toUpperCase();
  });

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
    const select = event.target as HTMLSelectElement;

    const mode = select.value as ThemeMode;

    this.themeService.setMode(mode);
  }
}
