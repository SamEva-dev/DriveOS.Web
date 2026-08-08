import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'drive-os-data-list-shell',
  standalone: true,
  templateUrl: './driveos-data-list-shell.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DriveOsDataListShellComponent {
  readonly title = input<string | null>(null);
  readonly description = input<string | null>(null);
  readonly flush = input(false);
}
