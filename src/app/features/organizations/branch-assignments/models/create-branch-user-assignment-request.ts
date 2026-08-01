import { BranchAssignmentRole } from './branch-assignment-role';

import { BranchAssignmentType } from './branch-assignment-type';

export interface CreateBranchUserAssignmentRequest {
  readonly userId: string;

  readonly role: BranchAssignmentRole;

  readonly assignmentType: BranchAssignmentType;

  readonly plannedEndAtUtc: string | null;
}
