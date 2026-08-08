import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'drive-os-data-panel',
  standalone: true,
  templateUrl: './driveos-data-panel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DriveOsDataPanelComponent {
  readonly title = input.required<string>();
  readonly description = input<string | null>(null);
  readonly eyebrow = input<string | null>(null);
  readonly padded = input(true);
}
