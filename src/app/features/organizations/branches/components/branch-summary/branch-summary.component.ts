import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

import {
  DatePipe,
} from '@angular/common';

import {
  RouterLink,
} from '@angular/router';

import {
  TranslatePipe,
} from '@ngx-translate/core';

import {
  DriveOsBadgeComponent,
  DriveOsBadgeVariant,
  DriveOsCardComponent,
} from '../../../../../shared/ui';

import {
  BranchStatus,
} from '../../models/branch-status';

import {
  Branch,
} from '../../models/branch.model';

import {
  branchTypeLabelKey,
} from '../../models/branch-type';

@Component({
  selector:
    'driveos-branch-summary',

  standalone: true,

  imports: [
    DatePipe,
    RouterLink,
    TranslatePipe,

    DriveOsBadgeComponent,
    DriveOsCardComponent,
  ],

  templateUrl:
    './branch-summary.component.html',

  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class BranchSummaryComponent {
  readonly branch =
    input.required<Branch>();

  readonly organizationId =
    input.required<string>();

  readonly editLink =
    computed(() => [
      '/organizations',
      this.organizationId(),
      'branches',
      this.branch().id,
      'edit',
    ]);

  readonly typeLabelKey =
    computed(() =>
      branchTypeLabelKey(
        this.branch().branchType,
      ),
    );

  readonly statusLabelKey =
    computed(() => {
      const status =
        this.branch().status;

      return [
        'organizations.branches.statuses',
        status.charAt(0).toLowerCase() +
          status.slice(1),
      ].join('.');
    });

  readonly statusVariant =
    computed<DriveOsBadgeVariant>(
      () =>
        this.getStatusVariant(
          this.branch().status,
        ),
    );

  private getStatusVariant(
    status: BranchStatus,
  ): DriveOsBadgeVariant {
    switch (status) {
      case 'Draft':
        return 'info';

      case 'Active':
        return 'success';

      case 'Restricted':
        return 'warning';

      case 'Suspended':
      case 'Closed':
        return 'danger';

      default:
        return 'neutral';
    }
  }
}
