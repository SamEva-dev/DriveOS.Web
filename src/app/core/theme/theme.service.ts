import {
  DOCUMENT,
  isPlatformBrowser,
} from '@angular/common';
import {
  Injectable,
  PLATFORM_ID,
  inject,
  signal,
} from '@angular/core';

import { ThemeMode } from './theme-mode';

const THEME_STORAGE_KEY = 'driveos.theme';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);

  private readonly currentModeSignal =
    signal<ThemeMode>('system');

  readonly currentMode =
    this.currentModeSignal.asReadonly();

  initialize(): void {
  if (!isPlatformBrowser(this.platformId)) {
    return;
  }

  this.systemThemeQuery =
    window.matchMedia(
      '(prefers-color-scheme: dark)',
    );

  this.systemThemeQuery.addEventListener(
    'change',
    this.systemThemeListener,
  );

  const storedMode =
    localStorage.getItem(
      THEME_STORAGE_KEY,
    );

  const mode =
    this.isThemeMode(storedMode)
      ? storedMode
      : 'system';

  this.setMode(mode);
}

  setMode(mode: ThemeMode): void {
  this.currentModeSignal.set(mode);

  if (!isPlatformBrowser(this.platformId)) {
    return;
  }

  localStorage.setItem(
    THEME_STORAGE_KEY,
    mode,
  );

  this.applyMode(mode);
}

private applyMode(mode: ThemeMode): void {
  const prefersDark =
    this.systemThemeQuery?.matches ??
    false;

  const shouldUseDarkMode =
    mode === 'dark' ||
    (
      mode === 'system' &&
      prefersDark
    );

  this.document.documentElement
    .classList.toggle(
      'driveos-dark',
      shouldUseDarkMode,
    );
}

  private isThemeMode(
    value: string | null,
  ): value is ThemeMode {
    return value === 'system' ||
      value === 'light' ||
      value === 'dark';
  }

  private systemThemeQuery:
  MediaQueryList | null = null;

private readonly systemThemeListener =
  (): void => {
    if (
      this.currentModeSignal() === 'system'
    ) {
      this.applyMode('system');
    }
  };
}
