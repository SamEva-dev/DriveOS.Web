import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DriveOsIconComponent } from '../icon/driveos-icon.component';

@Component({
  selector: 'drive-os-danger-zone',
  standalone: true,
  imports: [DriveOsIconComponent],
  templateUrl: './driveos-danger-zone.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DriveOsDangerZoneComponent {
  readonly title = input('Actions sensibles');
  readonly description = input<string | null>(null);
}
