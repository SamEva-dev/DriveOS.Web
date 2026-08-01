import { BranchAssignmentRoleName } from './branch-assignment-role';

import { BranchAssignmentTypeName } from './branch-assignment-type';

import { BranchUserAssignmentStatus } from './branch-user-assignment-status';

import {
  BranchUserAssignmentSortDirection,
  BranchUserAssignmentSortField,
} from './get-branch-user-assignments-parameters';

export interface GetUserBranchAssignmentsParameters {
  readonly pageNumber: number;

  readonly pageSize: number;

  readonly status: BranchUserAssignmentStatus | null;

  readonly role: BranchAssignmentRoleName | null;

  readonly assignmentType: BranchAssignmentTypeName | null;

  readonly sortBy: BranchUserAssignmentSortField;

  readonly sortDirection: BranchUserAssignmentSortDirection;
}
