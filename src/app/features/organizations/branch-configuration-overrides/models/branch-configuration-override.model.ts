export enum BranchConfigurationOverrideStatus {
  Draft = 1,
  Published = 2,
  Archived = 3,
}

export interface BranchConfigurationOverrideListItem {
  readonly id: string;
  readonly organizationId: string;
  readonly branchId: string;
  readonly baseConfigurationId: string;
  readonly versionNumber: number;
  readonly countryCode: string;
  readonly status: BranchConfigurationOverrideStatus;
  readonly effectiveFromUtc: string | null;
  readonly effectiveToUtc: string | null;
  readonly revision: number;
}

export interface BranchConfigurationOverride extends BranchConfigurationOverrideListItem {
  readonly payloadJson: string;
  readonly publishedAtUtc: string | null;
  readonly publishedByUserId: string | null;
  readonly createdAtUtc: string;
  readonly createdByUserId: string | null;
  readonly lastModifiedAtUtc: string | null;
  readonly lastModifiedByUserId: string | null;
}
