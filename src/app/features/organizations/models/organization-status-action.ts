import {
  DriveOsButtonVariant,
} from '../../../shared/ui';

export type OrganizationStatusActionCode =
  | 'submitForActivation'
  | 'activate'
  | 'restrict'
  | 'suspend'
  | 'reactivate'
  | 'close';

export interface OrganizationStatusAction {
  code: OrganizationStatusActionCode;
  labelKey: string;
  titleKey: string;
  descriptionKey: string;
  icon: string;
  buttonVariant: DriveOsButtonVariant;
}
