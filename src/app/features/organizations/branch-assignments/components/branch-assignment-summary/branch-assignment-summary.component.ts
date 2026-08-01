import { DatePipe } from '@angular/common';

import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { TranslatePipe } from '@ngx-translate/core';

import {
  DriveOsBadgeComponent,
  DriveOsBadgeVariant,
  DriveOsCardComponent,
} from '../../../../../shared/ui';

import {
  BranchAssignmentRoleName,
  branchAssignmentRoleLabelKey,
} from '../../models/branch-assignment-role';

import {
  BranchAssignmentTypeName,
  branchAssignmentTypeLabelKey,
} from '../../models/branch-assignment-type';

import { BranchUserAssignment } from '../../models/branch-user-assignment.model';

import {
  BranchUserAssignmentStatus,
  branchUserAssignmentStatusLabelKey,
} from '../../models/branch-user-assignment-status';

@Component({
  selector: 'app-branch-assignment-summary',

  standalone: true,

  imports: [DatePipe, TranslatePipe, DriveOsBadgeComponent, DriveOsCardComponent],

  templateUrl: './branch-assignment-summary.component.html',

  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BranchAssignmentSummaryComponent {
  @Input({
    required: true,
  })
  assignment!: BranchUserAssignment;

  statusLabelKey(status: BranchUserAssignmentStatus): string {
    return branchUserAssignmentStatusLabelKey(status);
  }

  roleLabelKey(role: BranchAssignmentRoleName): string {
    return branchAssignmentRoleLabelKey(role);
  }

  typeLabelKey(assignmentType: BranchAssignmentTypeName): string {
    return branchAssignmentTypeLabelKey(assignmentType);
  }

  statusVariant(status: BranchUserAssignmentStatus): DriveOsBadgeVariant {
    switch (status) {
      case 'Active':
        return 'success';

      case 'Suspended':
        return 'warning';

      case 'Ended':
        return 'neutral';
    }
  }
}
