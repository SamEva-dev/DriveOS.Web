import { booleanAttribute, ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'drive-os-choice-card',
  standalone: true,
  templateUrl: './driveos-choice-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DriveOsChoiceCardComponent {
  readonly title = input.required<string>();
  readonly description = input<string>('');
  readonly checked = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly changed = output<boolean>();

  toggle(): void {
    if (this.disabled()) {
      return;
    }

    this.changed.emit(!this.checked());
  }
}
