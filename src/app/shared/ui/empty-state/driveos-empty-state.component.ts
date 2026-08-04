import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DriveOsIconComponent } from '../icon/driveos-icon.component';

@Component({
  selector: 'drive-os-empty-state',
  standalone: true,
  imports: [DriveOsIconComponent],
  templateUrl: './driveos-empty-state.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DriveOsEmptyStateComponent {
  readonly icon = input('building-2');
  readonly title = input.required<string>();
  readonly description = input.required<string>();
}
