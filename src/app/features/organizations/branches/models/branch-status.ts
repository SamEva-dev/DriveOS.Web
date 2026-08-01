export const BRANCH_STATUSES = ['Draft', 'Active', 'Restricted', 'Suspended', 'Closed'] as const;

export type BranchStatus = (typeof BRANCH_STATUSES)[number];

export function isBranchStatus(value: string): value is BranchStatus {
  return BRANCH_STATUSES.includes(value as BranchStatus);
}
