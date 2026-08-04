export enum OrganizationConfigurationStatus {
  Draft = 1,
  Published = 2,
  Archived = 3,
}

export interface OrganizationConfigurationListItem {
  readonly id: string;
  readonly organizationId: string;
  readonly versionNumber: number;
  readonly countryCode: string;
  readonly status: OrganizationConfigurationStatus;
  readonly effectiveFromUtc: string | null;
  readonly effectiveToUtc: string | null;
  readonly publishedAtUtc: string | null;
  readonly revision: number;
  readonly createdAtUtc: string;
  readonly lastModifiedAtUtc: string | null;
}

export interface OrganizationConfiguration extends OrganizationConfigurationListItem {
  readonly payloadJson: string;
  readonly publishedByUserId: string | null;
  readonly createdByUserId: string | null;
  readonly lastModifiedByUserId: string | null;
}
