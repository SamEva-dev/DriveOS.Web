import { BranchAssignmentRoleName } from './branch-assignment-role';

import { BranchAssignmentTypeName } from './branch-assignment-type';

import { BranchUserAssignmentStatus } from './branch-user-assignment-status';

export type BranchUserAssignmentSortField =
  'startsAtUtc' | 'userId' | 'role' | 'assignmentType' | 'status' | 'createdAtUtc';

export type BranchUserAssignmentSortDirection = 'asc' | 'desc';

export interface GetBranchUserAssignmentsParameters {
  readonly pageNumber: number;

  readonly pageSize: number;

  readonly search: string;

  readonly status: BranchUserAssignmentStatus | null;

  readonly role: BranchAssignmentRoleName | null;

  readonly assignmentType: BranchAssignmentTypeName | null;

  readonly sortBy: BranchUserAssignmentSortField;

  readonly sortDirection: BranchUserAssignmentSortDirection;
}
