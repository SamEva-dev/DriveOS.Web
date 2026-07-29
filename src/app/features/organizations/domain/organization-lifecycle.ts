import {
  DriveOsButtonVariant,
} from '../../../shared/ui';

import {
  OrganizationStatusAction,
  OrganizationStatusActionCode,
} from '../models/organization-status-action';

import {
  OrganizationStatus,
} from '../models/organization-status';

export interface OrganizationLifecycleActionDefinition
  extends OrganizationStatusAction {
  readonly permission: string;
  readonly targetStatus: OrganizationStatus;
}

const ACTIONS: Readonly<
  Record<
    OrganizationStatusActionCode,
    OrganizationLifecycleActionDefinition
  >
> = {
  submitForActivation: {
    code: 'submitForActivation',
    targetStatus: 'PendingActivation',
    permission:
      'Organizations.SubmitForActivation',
    labelKey:
      'organizations.lifecycle.actions.submitForActivation.label',
    titleKey:
      'organizations.lifecycle.actions.submitForActivation.title',
    descriptionKey:
      'organizations.lifecycle.actions.submitForActivation.description',
    icon: 'ph-bold ph-paper-plane-tilt',
    buttonVariant: 'primary',
  },

  activate: {
    code: 'activate',
    targetStatus: 'Active',
    permission: 'Organizations.Activate',
    labelKey:
      'organizations.lifecycle.actions.activate.label',
    titleKey:
      'organizations.lifecycle.actions.activate.title',
    descriptionKey:
      'organizations.lifecycle.actions.activate.description',
    icon: 'ph-bold ph-check-circle',
    buttonVariant: 'primary',
  },

  restrict: {
    code: 'restrict',
    targetStatus: 'Restricted',
    permission: 'Organizations.Restrict',
    labelKey:
      'organizations.lifecycle.actions.restrict.label',
    titleKey:
      'organizations.lifecycle.actions.restrict.title',
    descriptionKey:
      'organizations.lifecycle.actions.restrict.description',
    icon: 'ph-bold ph-warning',
    buttonVariant: 'outline',
  },

  suspend: {
    code: 'suspend',
    targetStatus: 'Suspended',
    permission: 'Organizations.Suspend',
    labelKey:
      'organizations.lifecycle.actions.suspend.label',
    titleKey:
      'organizations.lifecycle.actions.suspend.title',
    descriptionKey:
      'organizations.lifecycle.actions.suspend.description',
    icon: 'ph-bold ph-pause-circle',
    buttonVariant: 'danger',
  },

  reactivate: {
    code: 'reactivate',
    targetStatus: 'Active',
    permission: 'Organizations.Reactivate',
    labelKey:
      'organizations.lifecycle.actions.reactivate.label',
    titleKey:
      'organizations.lifecycle.actions.reactivate.title',
    descriptionKey:
      'organizations.lifecycle.actions.reactivate.description',
    icon:
      'ph-bold ph-arrow-counter-clockwise',
    buttonVariant: 'primary',
  },

  close: {
    code: 'close',
    targetStatus: 'Closed',
    permission: 'Organizations.Close',
    labelKey:
      'organizations.lifecycle.actions.close.label',
    titleKey:
      'organizations.lifecycle.actions.close.title',
    descriptionKey:
      'organizations.lifecycle.actions.close.description',
    icon: 'ph-bold ph-lock-key',
    buttonVariant: 'danger',
  },
};

const TRANSITIONS: Readonly<
  Record<
    OrganizationStatus,
    readonly OrganizationStatusActionCode[]
  >
> = {
  Draft: [
    'submitForActivation',
  ],

  PendingActivation: [
    'activate',
  ],

  Active: [
    'restrict',
    'suspend',
    'close',
  ],

  Restricted: [
    'reactivate',
    'suspend',
    'close',
  ],

  Suspended: [
    'reactivate',
    'close',
  ],

  Closed: [],

  Archived: [],
};

export function getOrganizationLifecycleActions(
  status: OrganizationStatus,
): readonly OrganizationLifecycleActionDefinition[] {
  return TRANSITIONS[status].map(
    code => ACTIONS[code],
  );
}

export function getOrganizationLifecycleAction(
  code: OrganizationStatusActionCode,
): OrganizationLifecycleActionDefinition {
  return ACTIONS[code];
}

export function canApplyOrganizationLifecycleAction(
  currentStatus: OrganizationStatus,
  actionCode: OrganizationStatusActionCode,
): boolean {
  return TRANSITIONS[currentStatus].includes(
    actionCode,
  );
}

export type {
  DriveOsButtonVariant,
};
