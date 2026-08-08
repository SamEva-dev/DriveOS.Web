import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'drive-os-page-shell',
  standalone: true,
  templateUrl: './driveos-page-shell.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DriveOsPageShellComponent {
  readonly width = input<'xl' | '2xl' | 'full'>('xl');
  readonly spacing = input<'compact' | 'normal' | 'relaxed'>('normal');
}
