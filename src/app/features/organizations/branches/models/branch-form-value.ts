import {
  BranchType,
} from './branch-type';

export interface BranchFormValue {
  readonly name: string;

  readonly code: string;

  readonly branchType:
    BranchType | null;

  readonly addressLine1: string;

  readonly addressLine2:
    string;

  readonly postalCode: string;

  readonly city: string;

  readonly timeZoneId: string;

  readonly isPrimary: boolean;
}
