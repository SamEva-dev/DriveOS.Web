import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type DriveOsFormAlertTone = 'info' | 'warning' | 'danger' | 'success';

@Component({
  selector: 'drive-os-form-alert',
  standalone: true,
  templateUrl: './driveos-form-alert.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DriveOsFormAlertComponent {
  readonly title = input.required<string>();
  readonly message = input<string>('');
  readonly tone = input<DriveOsFormAlertTone>('info');
}
