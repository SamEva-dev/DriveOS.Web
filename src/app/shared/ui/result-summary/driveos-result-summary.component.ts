import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'drive-os-result-summary',
  standalone: true,
  templateUrl: './driveos-result-summary.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DriveOsResultSummaryComponent {
  readonly total = input.required<number>();
  readonly label = input('résultat');
  readonly filtered = input(false);
  readonly loading = input(false);
}
