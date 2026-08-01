export const BRANCH_USER_ASSIGNMENT_STATUSES = ['Active', 'Suspended', 'Ended'] as const;

export type BranchUserAssignmentStatus = (typeof BRANCH_USER_ASSIGNMENT_STATUSES)[number];

export function isBranchUserAssignmentStatus(value: string): value is BranchUserAssignmentStatus {
  return BRANCH_USER_ASSIGNMENT_STATUSES.includes(value as BranchUserAssignmentStatus);
}

export function branchUserAssignmentStatusLabelKey(status: BranchUserAssignmentStatus): string {
  return `organizations.branchAssignments.statuses.${status.toLowerCase()}`;
}
