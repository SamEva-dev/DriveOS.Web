import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'drive-os-action-bar',
  standalone: true,
  templateUrl: './driveos-action-bar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DriveOsActionBarComponent {
  readonly sticky = input(false);
  readonly description = input<string>('');
}
