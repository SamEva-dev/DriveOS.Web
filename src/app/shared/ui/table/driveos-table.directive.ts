import {
  Directive,
  HostBinding,
} from '@angular/core';

@Directive({
  selector: 'table[dosTable]',
  standalone: true,
})
export class DriveOsTableDirective {
  @HostBinding('class')
  readonly classes = [
    'w-full',
    'border-collapse',
    'text-left',
    'text-sm',
  ].join(' ');
}
