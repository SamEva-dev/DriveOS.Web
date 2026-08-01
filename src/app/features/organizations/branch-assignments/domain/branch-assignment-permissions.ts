export const BRANCH_ASSIGNMENT_PERMISSIONS = {
  read: 'BranchAssignments.Read',

  create: 'BranchAssignments.Create',

  suspend: 'BranchAssignments.Suspend',

  reactivate: 'BranchAssignments.Reactivate',

  end: 'BranchAssignments.End',
} as const;

export type BranchAssignmentPermission =
  (typeof BRANCH_ASSIGNMENT_PERMISSIONS)[keyof typeof BRANCH_ASSIGNMENT_PERMISSIONS];
