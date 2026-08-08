import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { DriveOsButtonComponent } from '../button/driveos-button.component';
import { DriveOsIconComponent } from '../icon/driveos-icon.component';
import { DriveOsModalComponent } from '../modal/driveos-modal.component';

export type DriveOsConfirmTone = 'default' | 'warning' | 'danger';

@Component({
  selector: 'drive-os-confirm-dialog',
  standalone: true,
  imports: [DriveOsModalComponent, DriveOsButtonComponent, DriveOsIconComponent],
  templateUrl: './driveos-confirm-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DriveOsConfirmDialogComponent {
  readonly open = input(false);
  readonly title = input.required<string>();
  readonly message = input.required<string>();
  readonly detail = input<string | null>(null);
  readonly confirmLabel = input('Confirmer');
  readonly cancelLabel = input('Annuler');
  readonly tone = input<DriveOsConfirmTone>('default');
  readonly loading = input(false);

  readonly confirmed = output<void>();
  readonly cancelRequested = output<void>();

  readonly iconName = computed(() => this.tone() === 'danger' ? 'triangle-alert' : this.tone() === 'warning' ? 'circle-alert' : 'circle-check');
  readonly iconClass = computed(() => this.tone() === 'danger'
    ? 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400'
    : this.tone() === 'warning'
      ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'
      : 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300');
}
