export interface CreateOrganizationConfigurationDraftRequest {
  readonly versionNumber: number;
  readonly countryCode: string;
  readonly payloadJson: string;
}

export interface UpdateOrganizationConfigurationDraftRequest {
  readonly payloadJson: string;
  readonly expectedRevision: number;
}

export interface PublishOrganizationConfigurationRequest {
  readonly effectiveFromUtc: string;
  readonly effectiveToUtc: string | null;
  readonly expectedRevision: number;
}

export interface ArchiveOrganizationConfigurationRequest {
  readonly expectedRevision: number;
}
