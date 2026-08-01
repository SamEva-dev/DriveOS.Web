export type BranchAssignmentLifecycleAction = 'suspend' | 'reactivate' | 'end';

export interface BranchAssignmentLifecycleActionDefinition {
  readonly action: BranchAssignmentLifecycleAction;

  readonly titleKey: string;

  readonly descriptionKey: string;

  readonly confirmLabelKey: string;

  readonly buttonVariant: 'primary' | 'secondary' | 'danger';
}

export const BRANCH_ASSIGNMENT_LIFECYCLE_ACTIONS: Record<
  BranchAssignmentLifecycleAction,
  BranchAssignmentLifecycleActionDefinition
> = {
  suspend: {
    action: 'suspend',

    titleKey: 'organizations.branchAssignments.dialogs.suspendTitle',

    descriptionKey: 'organizations.branchAssignments.dialogs.suspendDescription',

    confirmLabelKey: 'organizations.branchAssignments.actions.suspend',

    buttonVariant: 'danger',
  },

  reactivate: {
    action: 'reactivate',

    titleKey: 'organizations.branchAssignments.dialogs.reactivateTitle',

    descriptionKey: 'organizations.branchAssignments.dialogs.reactivateDescription',

    confirmLabelKey: 'organizations.branchAssignments.actions.reactivate',

    buttonVariant: 'primary',
  },

  end: {
    action: 'end',

    titleKey: 'organizations.branchAssignments.dialogs.endTitle',

    descriptionKey: 'organizations.branchAssignments.dialogs.endDescription',

    confirmLabelKey: 'organizations.branchAssignments.actions.end',

    buttonVariant: 'danger',
  },
};
