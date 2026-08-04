import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DriveOsIconComponent } from '../icon/driveos-icon.component';

@Component({
  selector: 'drive-os-spinner',
  standalone: true,
  imports: [DriveOsIconComponent],
  templateUrl: './driveos-spinner.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DriveOsSpinnerComponent {
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly label = input('Chargement en cours');
}
