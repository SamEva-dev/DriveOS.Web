import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type DriveOsStateBannerTone = 'info' | 'success' | 'warning' | 'danger';

@Component({
  selector: 'drive-os-state-banner',
  standalone: true,
  templateUrl: './driveos-state-banner.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DriveOsStateBannerComponent {
  readonly title = input.required<string>();
  readonly description = input<string | null>(null);
  readonly tone = input<DriveOsStateBannerTone>('info');
  readonly icon = input<string | null>(null);

  readonly classes = computed(() => {
    const tones: Record<DriveOsStateBannerTone, string[]> = {
      info: ['border-blue-200', 'bg-blue-50/70', 'text-blue-950', 'dark:border-blue-900', 'dark:bg-blue-950/30', 'dark:text-blue-100'],
      success: ['border-emerald-200', 'bg-emerald-50/70', 'text-emerald-950', 'dark:border-emerald-900', 'dark:bg-emerald-950/30', 'dark:text-emerald-100'],
      warning: ['border-orange-200', 'bg-orange-50/70', 'text-orange-950', 'dark:border-orange-900', 'dark:bg-orange-950/30', 'dark:text-orange-100'],
      danger: ['border-red-200', 'bg-red-50/70', 'text-red-950', 'dark:border-red-900', 'dark:bg-red-950/30', 'dark:text-red-100'],
    };
    return ['flex', 'gap-4', 'rounded-2xl', 'border', 'p-4', ...tones[this.tone()]].join(' ');
  });
}
