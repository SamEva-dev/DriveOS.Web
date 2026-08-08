import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'drive-os-section-card',
  standalone: true,
  templateUrl: './driveos-section-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DriveOsSectionCardComponent {
  readonly step = input<string>('');
  readonly title = input.required<string>();
  readonly description = input<string>('');
  readonly badge = input<string>('');
  readonly tone = input<'default' | 'primary' | 'warning' | 'danger' | 'success'>('default');
}
