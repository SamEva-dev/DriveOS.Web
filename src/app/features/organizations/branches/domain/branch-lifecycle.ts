import {
  DriveOsButtonVariant,
} from '../../../../shared/ui';

import {
  BranchStatus,
} from '../models/branch-status';

import {
  BRANCH_PERMISSIONS,
} from './branch-permissions';

export type BranchLifecycleActionCode =
  | 'activate'
  | 'restrict'
  | 'suspend'
  | 'reactivate'
  | 'close';

export interface BranchLifecycleActionDefinition {
  readonly code:
    BranchLifecycleActionCode;

  readonly targetStatus:
    BranchStatus;

  readonly labelKey: string;
  readonly descriptionKey: string;

  readonly confirmationTitleKey:
    string;

  readonly icon: string;

  readonly buttonVariant:
    DriveOsButtonVariant;

  readonly permission: string;
}

const ACTIVATE_ACTION:
  BranchLifecycleActionDefinition = {
  code: 'activate',
  targetStatus: 'Active',

  labelKey:
    'organizations.branches.lifecycle.actions.activate',

  descriptionKey:
    'organizations.branches.lifecycle.descriptions.activate',

  confirmationTitleKey:
    'organizations.branches.lifecycle.confirmations.activate',

  icon:
    'ph ph-play-circle',

  buttonVariant:
    'primary',

  permission:
    BRANCH_PERMISSIONS.activate,
};

const RESTRICT_ACTION:
  BranchLifecycleActionDefinition = {
  code: 'restrict',
  targetStatus: 'Restricted',

  labelKey:
    'organizations.branches.lifecycle.actions.restrict',

  descriptionKey:
    'organizations.branches.lifecycle.descriptions.restrict',

  confirmationTitleKey:
    'organizations.branches.lifecycle.confirmations.restrict',

  icon:
    'ph ph-warning-circle',

  buttonVariant:
    'outline',

  permission:
    BRANCH_PERMISSIONS.restrict,
};

const SUSPEND_ACTION:
  BranchLifecycleActionDefinition = {
  code: 'suspend',
  targetStatus: 'Suspended',

  labelKey:
    'organizations.branches.lifecycle.actions.suspend',

  descriptionKey:
    'organizations.branches.lifecycle.descriptions.suspend',

  confirmationTitleKey:
    'organizations.branches.lifecycle.confirmations.suspend',

  icon:
    'ph ph-pause-circle',

  buttonVariant:
    'danger',

  permission:
    BRANCH_PERMISSIONS.suspend,
};

const REACTIVATE_ACTION:
  BranchLifecycleActionDefinition = {
  code: 'reactivate',
  targetStatus: 'Active',

  labelKey:
    'organizations.branches.lifecycle.actions.reactivate',

  descriptionKey:
    'organizations.branches.lifecycle.descriptions.reactivate',

  confirmationTitleKey:
    'organizations.branches.lifecycle.confirmations.reactivate',

  icon:
    'ph ph-arrow-counter-clockwise',

  buttonVariant:
    'primary',

  permission:
    BRANCH_PERMISSIONS.reactivate,
};

const CLOSE_ACTION:
  BranchLifecycleActionDefinition = {
  code: 'close',
  targetStatus: 'Closed',

  labelKey:
    'organizations.branches.lifecycle.actions.close',

  descriptionKey:
    'organizations.branches.lifecycle.descriptions.close',

  confirmationTitleKey:
    'organizations.branches.lifecycle.confirmations.close',

  icon:
    'ph ph-x-circle',

  buttonVariant:
    'danger',

  permission:
    BRANCH_PERMISSIONS.close,
};

const ACTIONS_BY_STATUS:
  Readonly<
    Record<
      BranchStatus,
      readonly BranchLifecycleActionDefinition[]
    >
  > = {
  Draft: [
    ACTIVATE_ACTION,
  ],

  Active: [
    RESTRICT_ACTION,
    SUSPEND_ACTION,
    CLOSE_ACTION,
  ],

  Restricted: [
    REACTIVATE_ACTION,
    SUSPEND_ACTION,
    CLOSE_ACTION,
  ],

  Suspended: [
    REACTIVATE_ACTION,
    CLOSE_ACTION,
  ],

  Closed: [],
};

export function getBranchLifecycleActions(
  status: BranchStatus,
): readonly BranchLifecycleActionDefinition[] {
  return ACTIONS_BY_STATUS[status];
}
