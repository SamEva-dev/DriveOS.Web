import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'drive-os-card',
  standalone: true,
  templateUrl: './driveos-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DriveOsCardComponent {
  readonly padding = input<'none' | 'sm' | 'md' | 'lg'>('md');
}
