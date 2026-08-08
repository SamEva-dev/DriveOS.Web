import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  HostListener,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  input,
  output,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { A11yModule } from '@angular/cdk/a11y';
import { DriveOsIconComponent } from '../icon/driveos-icon.component';

export type DriveOsModalSize = 'sm' | 'md' | 'lg' | 'xl';

@Component({
  selector: 'drive-os-modal',
  standalone: true,
  imports: [A11yModule, DriveOsIconComponent],
  templateUrl: './driveos-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DriveOsModalComponent {
  private readonly platformId = inject(PLATFORM_ID);

  readonly open = input(false);
  readonly title = input.required<string>();
  readonly description = input<string | null>(null);
  readonly eyebrow = input<string | null>(null);
  readonly size = input<DriveOsModalSize>('md');
  readonly closeOnBackdrop = input(true);
  readonly closeDisabled = input(false);

  readonly closeRequested = output<void>();

  readonly panelClass = computed(() => ({
    sm: 'max-w-lg',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
  })[this.size()]);

  constructor() {
    const destroyRef = inject(DestroyRef);

    effect(() => {
      if (!isPlatformBrowser(this.platformId)) return;
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
    if (this.open() && !this.closeDisabled()) {
      this.closeRequested.emit();
    }
  }

  onBackdrop(): void {
    if (this.closeOnBackdrop() && !this.closeDisabled()) {
      this.closeRequested.emit();
    }
  }
}
