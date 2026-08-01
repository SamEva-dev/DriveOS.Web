import { BranchAssignmentRoleName } from './branch-assignment-role';

import { BranchAssignmentTypeName } from './branch-assignment-type';

import { BranchUserAssignmentStatus } from './branch-user-assignment-status';

export interface BranchUserAssignment {
  readonly id: string;

  readonly organizationId: string;

  readonly branchId: string;

  readonly userId: string;

  readonly role: BranchAssignmentRoleName;

  readonly assignmentType: BranchAssignmentTypeName;

  readonly status: BranchUserAssignmentStatus;

  readonly startsAtUtc: string;

  readonly plannedEndAtUtc: string | null;

  readonly effectiveEndAtUtc: string | null;

  readonly suspensionReason: string | null;

  readonly suspendedAtUtc: string | null;

  readonly suspendedByUserId: string | null;

  readonly endReason: string | null;

  readonly endedAtUtc: string | null;

  readonly endedByUserId: string | null;

  readonly createdAtUtc: string;

  readonly createdByUserId: string | null;

  readonly lastModifiedAtUtc: string | null;

  readonly lastModifiedByUserId: string | null;
}
