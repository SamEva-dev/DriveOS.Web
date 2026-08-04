import { Directive, HostBinding } from '@angular/core';

@Directive({
  selector: 'input[dosInput], textarea[dosInput]',
  standalone: true,
})
export class DriveOsInputDirective {
  @HostBinding('class')
  readonly classes = [
    'driveos-field',
    'min-h-10',
    'px-3',
    'py-2',
  ].join(' ');
}
