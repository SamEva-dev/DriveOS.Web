import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'drive-os-page-header',
  standalone: true,
  templateUrl: './driveos-page-header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DriveOsPageHeaderComponent {
  readonly kicker = input<string>('');
  readonly title = input.required<string>();
  readonly description = input<string>('');
  readonly icon = input<string>('');
  readonly badge = input<string>('');
}
