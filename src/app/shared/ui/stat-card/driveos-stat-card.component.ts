import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'drive-os-stat-card',
  standalone: true,
  templateUrl: './driveos-stat-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DriveOsStatCardComponent {
  readonly label = input.required<string>();
  readonly value = input.required<string | number>();
  readonly hint = input<string>('');
  readonly icon = input<string>('');
  readonly state = input<'neutral' | 'success' | 'warning' | 'danger'>('neutral');
}
