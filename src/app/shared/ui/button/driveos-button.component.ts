import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { DriveOsIconComponent } from '../icon/driveos-icon.component';

export type DriveOsButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';

export type DriveOsButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'drive-os-button',
  standalone: true,

  templateUrl: './driveos-button.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DriveOsIconComponent],
})
export class DriveOsButtonComponent {
  readonly type = input<'button' | 'submit' | 'reset'>('button');

  readonly variant = input<DriveOsButtonVariant>('primary');

  readonly size = input<DriveOsButtonSize>('md');

  readonly icon = input<string | null>(null);

  readonly ariaLabel = input<string | null>(null);

  readonly disabled = input(false, { transform: booleanAttribute });

  readonly loading = input(false, { transform: booleanAttribute });

  readonly fullWidth = input(false, { transform: booleanAttribute });

  readonly pressed = output<MouseEvent>();

  readonly buttonClasses = computed(() => {
    const base = [
      'inline-flex',
      'items-center',
      'justify-center',
      'gap-2',
      'rounded-[var(--driveos-radius-md)]',
      'font-semibold',
      'transition-colors',
      'focus-visible:outline-none',
      'focus-visible:ring-2',
      'focus-visible:ring-[var(--driveos-primary-700)]',
      'focus-visible:ring-offset-2',
      'disabled:pointer-events-none',
      'disabled:cursor-not-allowed',
      'disabled:opacity-50',
    ];

    const sizes: Record<DriveOsButtonSize, string[]> = {
      sm: ['h-8', 'px-3', 'text-sm'],
      md: ['h-10', 'px-4', 'text-sm'],
      lg: ['h-12', 'px-5', 'text-base'],
    };

    const variants: Record<DriveOsButtonVariant, string[]> = {
      primary: [
        'bg-[var(--driveos-accent-500)]',
        'text-white',
        'shadow-sm',
        'hover:bg-[var(--driveos-accent-600)]',
      ],

      secondary: [
        'bg-slate-200',
        'text-slate-900',
        'hover:bg-slate-300',
        'dark:bg-slate-700',
        'dark:text-slate-50',
        'dark:hover:bg-slate-600',
      ],

      outline: [
        'border',
        'border-[var(--driveos-border-strong)]',
        'bg-transparent',
        'text-[var(--driveos-text-secondary)]',
        'hover:bg-[var(--driveos-surface-hover)]',
        'dark:border-slate-600',
        'dark:text-slate-200',
        'dark:hover:bg-slate-800',
      ],

      ghost: [
        'bg-transparent',
        'text-[var(--driveos-text-secondary)]',
        'hover:bg-[var(--driveos-surface-hover)]',
        'dark:text-slate-200',
        'dark:hover:bg-slate-800',
      ],

      danger: ['bg-red-600', 'text-white', 'hover:bg-red-700'],
    };

    return [
      ...base,
      ...sizes[this.size()],
      ...variants[this.variant()],
      this.fullWidth() ? 'w-full' : '',
    ]
      .filter(Boolean)
      .join(' ');
  });
}
