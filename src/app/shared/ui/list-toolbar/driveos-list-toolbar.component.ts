import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'drive-os-list-toolbar',
  standalone: true,
  templateUrl: './driveos-list-toolbar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DriveOsListToolbarComponent {
  readonly title = input<string | null>(null);
  readonly description = input<string | null>(null);
  readonly sticky = input(false);
}
