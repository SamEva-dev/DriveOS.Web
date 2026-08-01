import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { DatePipe } from '@angular/common';

import { TranslatePipe } from '@ngx-translate/core';

import {
  DriveOsBadgeComponent,
  DriveOsCardComponent,
  DriveOsEmptyStateComponent,
  DriveOsSpinnerComponent,
} from '../../../../../shared/ui';

import { BranchStatusHistoryItem } from '../../models/branch-status-history-item';

@Component({
  selector: 'driveos-branch-status-history',

  standalone: true,

  imports: [
    DatePipe,
    TranslatePipe,

    DriveOsBadgeComponent,
    DriveOsCardComponent,
    DriveOsEmptyStateComponent,
    DriveOsSpinnerComponent,
  ],

  templateUrl: './branch-status-history.component.html',

  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BranchStatusHistoryComponent {
  readonly history = input<readonly BranchStatusHistoryItem[]>([]);

  readonly loading = input(false);

  statusKey(status: string): string {
    return [
      'organizations.branches.statuses',
      status.charAt(0).toLowerCase() + status.slice(1),
    ].join('.');
  }
}
