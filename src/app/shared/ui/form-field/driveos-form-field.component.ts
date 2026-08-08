import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'drive-os-form-field',
  standalone: true,
  templateUrl: './driveos-form-field.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DriveOsFormFieldComponent {
  readonly label = input.required<string>();
  readonly forId = input<string>('');
  readonly hint = input<string>('');
  readonly error = input<string>('');
  readonly required = input(false);
  readonly optionalLabel = input<string>('Optionnel');
}
