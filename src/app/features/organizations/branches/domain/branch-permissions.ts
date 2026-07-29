export const BRANCH_PERMISSIONS = {
  read:
    'Branches.Read',

  create:
    'Branches.Create',

  update:
    'Branches.Update',

  setPrimary:
    'Branches.SetPrimary',

  activate:
    'Branches.Activate',

  restrict:
    'Branches.Restrict',

  suspend:
    'Branches.Suspend',

  reactivate:
    'Branches.Reactivate',

  close:
    'Branches.Close',

  statusHistoryRead:
    'Branches.StatusHistory.Read',
} as const;

export type BranchPermission =
  typeof BRANCH_PERMISSIONS[
    keyof typeof BRANCH_PERMISSIONS
  ];
