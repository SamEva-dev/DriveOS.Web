import { DatePipe } from '@angular/common';

import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { TranslatePipe } from '@ngx-translate/core';

import {
  DriveOsCardComponent,
  DriveOsEmptyStateComponent,
  DriveOsSpinnerComponent,
} from '../../../../shared/ui';

import { OrganizationStatusHistoryItem } from '../../models/organization-status-history-item';

@Component({
  selector: 'driveos-organization-status-history',
  standalone: true,
  imports: [
    DatePipe,
    TranslatePipe,
    DriveOsCardComponent,
    DriveOsEmptyStateComponent,
    DriveOsSpinnerComponent,
  ],
  templateUrl: './organization-status-history.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganizationStatusHistoryComponent {
  readonly history = input.required<readonly OrganizationStatusHistoryItem[]>();

  readonly loading = input(false);

  statusKey(status: string): string {
    return `organizations.statuses.${status.charAt(0).toLowerCase()}${status.slice(1)}`;
  }
}
