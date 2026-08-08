import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { DriveOsButtonComponent } from '../button/driveos-button.component';

@Component({
  selector: 'drive-os-filter-panel',
  standalone: true,
  imports: [DriveOsButtonComponent],
  templateUrl: './driveos-filter-panel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DriveOsFilterPanelComponent {
  readonly title = input('Filtres');
  readonly activeCount = input(0);
  readonly collapsible = input(true);
  readonly expanded = input(true);
  readonly clearLabel = input('Réinitialiser');
  readonly clearRequested = output<void>();
  readonly expandedChange = output<boolean>();

  toggle(): void {
    if (!this.collapsible()) return;
    this.expandedChange.emit(!this.expanded());
  }

  clear(): void {
    this.clearRequested.emit();
  }
}
