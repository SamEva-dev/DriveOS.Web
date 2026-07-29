import {
  BranchStatus,
} from './branch-status';

import {
  BranchTypeName,
} from './branch-type';

export interface Branch {
  readonly id: string;
  readonly organizationId: string;

  readonly name: string;
  readonly code: string;

  readonly branchType:
    BranchTypeName;

  readonly status:
    BranchStatus;

  readonly isPrimary: boolean;

  readonly addressLine1: string;
  readonly addressLine2: string | null;
  readonly postalCode: string;
  readonly city: string;
  readonly countryCode: string;

  readonly timeZoneId: string;

  readonly createdAtUtc: string;
  readonly lastModifiedAtUtc:
    string | null;
}
