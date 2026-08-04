export interface CreateBranchConfigurationOverrideDraftRequest {
  readonly baseConfigurationId: string;
  readonly versionNumber: number;
  readonly countryCode: string;
  readonly payloadJson: string;
}

export interface UpdateBranchConfigurationOverrideDraftRequest {
  readonly payloadJson: string;
  readonly expectedRevision: number;
}

export interface PublishBranchConfigurationOverrideRequest {
  readonly effectiveFromUtc: string;
  readonly effectiveToUtc: string | null;
  readonly expectedRevision: number;
}

export interface ArchiveBranchConfigurationOverrideRequest {
  readonly expectedRevision: number;
}
