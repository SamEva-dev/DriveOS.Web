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

import { AuthService } from '../services/auth.service';
import { ThemeMode } from '../theme/theme-mode';
import { ThemeService } from '../theme/theme.service';

@Component({
  selector: 'driveos-app-topbar',
  standalone: true,
  imports: [TranslatePipe],
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

      <button
        type="button"
        class="hidden min-w-44 items-center gap-3 rounded-lg px-2 py-1.5 text-left hover:bg-[var(--driveos-surface-hover)] md:flex"
      >
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
          <span
            class="flex items-center gap-2 text-sm font-bold text-[var(--driveos-text-primary)]"
          >
            {{ 'layout.branchName' | translate }}
            <i
              class="ph ph-caret-down text-xs"
              aria-hidden="true"
            ></i>
          </span>
        </span>
      </button>

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
        <button
          type="button"
          class="driveos-topbar-icon relative"
          [attr.aria-label]="'layout.notifications' | translate"
        >
          <i
            class="ph ph-bell text-xl"
            aria-hidden="true"
          ></i>
          <span
            class="absolute right-0.5 top-0.5 flex size-4 items-center justify-center rounded-full bg-red-600 text-[0.6rem] font-bold text-white"
          >
            4
          </span>
        </button>

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
  readonly isSigningOut = signal(false);
  readonly initials = computed(() => {
    const source = this.auth.user()?.fullName?.trim() || this.auth.user()?.email || 'U';
    const words = source.split(/\s+/).filter(Boolean);
    return (words.length >= 2 ? `${words[0][0]}${words[1][0]}` : source.slice(0, 2)).toUpperCase();
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
    this.themeService.setMode((event.target as HTMLSelectElement).value as ThemeMode);
  }
}
