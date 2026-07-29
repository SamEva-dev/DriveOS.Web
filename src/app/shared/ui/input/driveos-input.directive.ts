import {
  Directive,
  HostBinding,
} from '@angular/core';

@Directive({
  selector: 'input[dosInput], textarea[dosInput]',
  standalone: true,
})
export class DriveOsInputDirective {
  @HostBinding('class')
  readonly classes = [
    'w-full',
    'rounded-lg',
    'border',
    'border-slate-300',
    'bg-white',
    'px-3',
    'py-2',
    'text-sm',
    'text-slate-900',
    'outline-none',
    'transition-colors',
    'placeholder:text-slate-400',
    'focus:border-blue-700',
    'focus:ring-2',
    'focus:ring-blue-700/20',
    'disabled:cursor-not-allowed',
    'disabled:bg-slate-100',
    'disabled:opacity-60',
    'dark:border-slate-700',
    'dark:bg-slate-900',
    'dark:text-slate-100',
    'dark:placeholder:text-slate-500',
    'dark:disabled:bg-slate-800',
  ].join(' ');
}
