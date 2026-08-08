import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'drive-os-data-item',
  standalone: true,
  templateUrl: './driveos-data-item.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DriveOsDataItemComponent {
  readonly label = input.required<string>();
  readonly value = input<string | number | null | undefined>(null);
  readonly fallback = input('—');
  readonly mono = input(false);
}
