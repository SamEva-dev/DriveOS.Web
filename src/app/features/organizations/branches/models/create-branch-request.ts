import { BranchType } from './branch-type';

export interface CreateBranchRequest {
  readonly name: string;
  readonly code: string;

  readonly branchType: BranchType;

  readonly addressLine1: string;
  readonly addressLine2: string | null;

  readonly postalCode: string;
  readonly city: string;

  readonly timeZoneId: string;
  readonly isPrimary: boolean;
}
