import { Directive, HostBinding } from '@angular/core';

/**
 * Standard DriveOS form control styling.
 * Works with native input, textarea and select elements.
 * Validation remains owned by Angular Reactive Forms / the page component.
 */
@Directive({
  selector: 'input[dosInput], textarea[dosInput], select[dosInput]',
  standalone: true,
})
export class DriveOsInputDirective {
  @HostBinding('class')
  readonly classes = [
    'driveos-field',
    'min-h-11',
    'w-full',
    'rounded-[var(--driveos-radius-md)]',
    'border',
    'border-[var(--driveos-border-strong)]',
    'bg-[var(--driveos-surface-card)]',
    'px-3.5',
    'py-2.5',
    'text-[var(--driveos-text-primary)]',
    'outline-none',
    'transition-[border-color,box-shadow,background-color]',
    'placeholder:text-[var(--driveos-text-muted)]',
    'focus:border-[var(--driveos-primary-700)]',
    'focus:ring-2',
    'focus:ring-blue-100',
    'disabled:cursor-not-allowed',
    'disabled:bg-[var(--driveos-surface-hover)]',
    'disabled:opacity-70',
    'aria-invalid:border-[var(--driveos-danger)]',
    'aria-invalid:ring-1',
    'aria-invalid:ring-red-100',
  ].join(' ');
}
