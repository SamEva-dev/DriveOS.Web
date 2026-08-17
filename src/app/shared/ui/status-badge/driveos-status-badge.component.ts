import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type DriveOsStatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

@Component({
  selector: 'drive-os-status-badge',
  standalone: true,
  templateUrl: './driveos-status-badge.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DriveOsStatusBadgeComponent {
  readonly label = input.required<string>();
  readonly tone = input<DriveOsStatusTone>('neutral');
  readonly showDot = input(true);
  readonly compact = input(false);

  readonly classes = computed(() => {
    const tones: Record<DriveOsStatusTone, string[]> = {
      neutral: [
        'bg-slate-100',
        'text-slate-700',
        'ring-slate-200',
        'dark:bg-slate-800',
        'dark:text-slate-200',
        'dark:ring-slate-700',
      ],
      info: [
        'bg-blue-50',
        'text-blue-800',
        'ring-blue-200',
        'dark:bg-blue-950/50',
        'dark:text-blue-200',
        'dark:ring-blue-900',
      ],
      success: [
        'bg-emerald-50',
        'text-emerald-800',
        'ring-emerald-200',
        'dark:bg-emerald-950/50',
        'dark:text-emerald-200',
        'dark:ring-emerald-900',
      ],
      warning: [
        'bg-orange-50',
        'text-orange-800',
        'ring-orange-200',
        'dark:bg-orange-950/50',
        'dark:text-orange-200',
        'dark:ring-orange-900',
      ],
      danger: [
        'bg-red-50',
        'text-red-800',
        'ring-red-200',
        'dark:bg-red-950/50',
        'dark:text-red-200',
        'dark:ring-red-900',
      ],
    };

    return [
      'inline-flex',
      'items-center',
      'gap-2',
      'rounded-full',
      'font-semibold',
      'ring-1',
      'ring-inset',
      this.compact() ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-xs',
      ...tones[this.tone()],
    ].join(' ');
  });

  readonly dotClasses = computed(() => {
    const tones: Record<DriveOsStatusTone, string> = {
      neutral: 'bg-slate-400',
      info: 'bg-blue-500',
      success: 'bg-emerald-500',
      warning: 'bg-orange-500',
      danger: 'bg-red-500',
    };
    return `h-2 w-2 shrink-0 rounded-full ${tones[this.tone()]}`;
  });
}
