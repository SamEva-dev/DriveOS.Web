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
  computed,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { A11yModule } from '@angular/cdk/a11y';
import { DriveOsIconComponent } from '../icon/driveos-icon.component';

export type DriveOsDrawerSide = 'left' | 'right';
export type DriveOsDrawerSize = 'sm' | 'md' | 'lg' | 'xl';

@Component({
  selector: 'drive-os-drawer',
  standalone: true,
  imports: [A11yModule, DriveOsIconComponent],
  templateUrl: './driveos-drawer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DriveOsDrawerComponent {
  private readonly platformId = inject(PLATFORM_ID);

  readonly open = input(false);
  readonly ariaLabel = input('Panneau');
  readonly title = input<string | null>(null);
  readonly description = input<string | null>(null);
  readonly side = input<DriveOsDrawerSide>('right');
  readonly size = input<DriveOsDrawerSize>('md');
  readonly closeDisabled = input(false);

  readonly closeRequested = output<void>();

  readonly sizeClass = computed(
    () =>
      ({
        sm: 'max-w-sm',
        md: 'max-w-xl',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
      })[this.size()],
  );

  readonly sideClass = computed(() => (this.side() === 'left' ? 'left-0' : 'right-0'));

  constructor() {
    const destroyRef = inject(DestroyRef);

    effect(() => {
      if (!isPlatformBrowser(this.platformId)) return;
      document.body.style.overflow = this.open() ? 'hidden' : '';
    });

    destroyRef.onDestroy(() => {
      if (isPlatformBrowser(this.platformId)) document.body.style.overflow = '';
    });
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open() && !this.closeDisabled()) this.closeRequested.emit();
  }
}
