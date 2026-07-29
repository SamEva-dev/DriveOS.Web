import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';

export type DriveOsButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'danger';

export type DriveOsButtonSize =
  | 'sm'
  | 'md'
  | 'lg';

@Component({
  selector: 'dos-button',
  standalone: true,
  templateUrl: './driveos-button.component.html',
  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class DriveOsButtonComponent {
  readonly type =
    input<'button' | 'submit' | 'reset'>(
      'button',
    );

  readonly variant =
    input<DriveOsButtonVariant>(
      'primary',
    );

  readonly size =
    input<DriveOsButtonSize>('md');

  readonly icon =
    input<string | null>(null);

  readonly ariaLabel =
    input<string | null>(null);

  readonly disabled =
    input(false);

  readonly loading =
    input(false);

  readonly fullWidth =
    input(false);

    readonly pressed =
  output<MouseEvent>();

  readonly buttonClasses = computed(() => {
    const base = [
      'inline-flex',
      'items-center',
      'justify-center',
      'gap-2',
      'rounded-lg',
      'font-medium',
      'transition-colors',
      'focus-visible:outline-none',
      'focus-visible:ring-2',
      'focus-visible:ring-blue-600',
      'focus-visible:ring-offset-2',
      'disabled:pointer-events-none',
      'disabled:cursor-not-allowed',
      'disabled:opacity-50',
    ];

    const sizes:
      Record<DriveOsButtonSize, string[]> = {
      sm: [
        'h-8',
        'px-3',
        'text-sm',
      ],
      md: [
        'h-10',
        'px-4',
        'text-sm',
      ],
      lg: [
        'h-12',
        'px-5',
        'text-base',
      ],
    };

    const variants:
      Record<DriveOsButtonVariant, string[]> = {
      primary: [
        'bg-blue-800',
        'text-white',
        'hover:bg-blue-900',
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
        'border-slate-300',
        'bg-transparent',
        'text-slate-700',
        'hover:bg-slate-100',
        'dark:border-slate-600',
        'dark:text-slate-200',
        'dark:hover:bg-slate-800',
      ],

      ghost: [
        'bg-transparent',
        'text-slate-700',
        'hover:bg-slate-100',
        'dark:text-slate-200',
        'dark:hover:bg-slate-800',
      ],

      danger: [
        'bg-red-600',
        'text-white',
        'hover:bg-red-700',
      ],
    };

    return [
      ...base,
      ...sizes[this.size()],
      ...variants[this.variant()],
      this.fullWidth()
        ? 'w-full'
        : '',
    ]
      .filter(Boolean)
      .join(' ');
  });
}
