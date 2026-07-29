import {
  BranchStatus,
} from './branch-status';

export interface BranchStatusHistoryItem {
  readonly id: string;

  readonly previousStatus:
    BranchStatus;

  readonly newStatus:
    BranchStatus;

  readonly reason: string;

  readonly changedByUserId:
    string;

  readonly changedAtUtc:
    string;
}
