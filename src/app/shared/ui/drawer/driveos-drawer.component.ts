import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  effect,
  inject,
  input,
  output,
  PLATFORM_ID,
  DestroyRef,
} from '@angular/core';

import { isPlatformBrowser } from '@angular/common';

import { A11yModule } from '@angular/cdk/a11y';

@Component({
  selector: 'drive-os-drawer',
  standalone: true,
  imports: [A11yModule],
  templateUrl: './driveos-drawer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DriveOsDrawerComponent {
  private readonly platformId = inject(PLATFORM_ID);

  readonly open = input(false);

  readonly ariaLabel = input('Menu');

  readonly closeRequested = output<void>();

  constructor() {
    const destroyRef = inject(DestroyRef);

    effect(() => {
      if (!isPlatformBrowser(this.platformId)) {
        return;
      }

      document.body.style.overflow = this.open() ? 'hidden' : '';
    });

    destroyRef.onDestroy(() => {
      if (isPlatformBrowser(this.platformId)) {
        document.body.style.overflow = '';
      }
    });
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open()) {
      this.closeRequested.emit();
    }
  }
}
