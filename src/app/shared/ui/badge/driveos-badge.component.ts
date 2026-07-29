import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

export type DriveOsBadgeVariant =
  | 'neutral'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger';

@Component({
  selector: 'dos-badge',
  standalone: true,
  templateUrl: './driveos-badge.component.html',
  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class DriveOsBadgeComponent {
  readonly variant =
    input<DriveOsBadgeVariant>(
      'neutral',
    );

  readonly classes = computed(() => {
    const variants:
      Record<
        DriveOsBadgeVariant,
        string[]
      > = {
      neutral: [
        'bg-slate-100',
        'text-slate-700',
        'dark:bg-slate-800',
        'dark:text-slate-300',
      ],

      info: [
        'bg-blue-100',
        'text-blue-800',
        'dark:bg-blue-950',
        'dark:text-blue-300',
      ],

      success: [
        'bg-emerald-100',
        'text-emerald-800',
        'dark:bg-emerald-950',
        'dark:text-emerald-300',
      ],

      warning: [
        'bg-orange-100',
        'text-orange-800',
        'dark:bg-orange-950',
        'dark:text-orange-300',
      ],

      danger: [
        'bg-red-100',
        'text-red-800',
        'dark:bg-red-950',
        'dark:text-red-300',
      ],
    };

    return [
      'inline-flex',
      'items-center',
      'rounded-full',
      'px-2.5',
      'py-1',
      'text-xs',
      'font-semibold',
      ...variants[this.variant()],
    ].join(' ');
  });
}
