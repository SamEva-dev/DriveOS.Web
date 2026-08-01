import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'drive-os-spinner',
  standalone: true,
  templateUrl: './driveos-spinner.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DriveOsSpinnerComponent {
  readonly size = input<'sm' | 'md' | 'lg'>('md');

  readonly label = input('Chargement en cours');
}
