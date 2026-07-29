import {
  BranchStatus,
} from './branch-status';

import {
  BranchTypeName,
} from './branch-type';

export interface BranchListItem {
  readonly id: string;
  readonly name: string;
  readonly code: string;

  readonly branchType:
    BranchTypeName;

  readonly status:
    BranchStatus;

  readonly isPrimary: boolean;

  readonly city: string;
  readonly countryCode: string;
  readonly timeZoneId: string;
}
