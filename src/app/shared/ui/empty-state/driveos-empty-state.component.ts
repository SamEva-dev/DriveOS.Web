import {
  ChangeDetectionStrategy,
  Component,
  input,
} from '@angular/core';

@Component({
  selector: 'dos-empty-state',
  standalone: true,
  templateUrl: './driveos-empty-state.component.html',
  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class DriveOsEmptyStateComponent {
  readonly icon =
    input('ph-duotone ph-buildings');

  readonly title =
    input.required<string>();

  readonly description =
    input.required<string>();
}
