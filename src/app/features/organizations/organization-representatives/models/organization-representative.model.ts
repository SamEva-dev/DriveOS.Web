export enum OrganizationRepresentativeType {
  Owner = 'Owner',
  LegalRepresentative = 'LegalRepresentative',
  Director = 'Director',
  AuthorizedSignatory = 'AuthorizedSignatory',
  AdministrativeRepresentative = 'AdministrativeRepresentative',
  BillingRepresentative = 'BillingRepresentative',
  DataProtectionRepresentative = 'DataProtectionRepresentative',
  Other = 'Other',
}
export enum OrganizationRepresentativeStatus {
  Draft = 'Draft',
  Active = 'Active',
  Suspended = 'Suspended',
  Ended = 'Ended',
}
export interface OrganizationRepresentativeListItem {
  readonly id: string;
  readonly organizationId: string;
  readonly personId: string;
  readonly userId: string | null;
  readonly representativeType: OrganizationRepresentativeType;
  readonly authorityScope: string;
  readonly isPrimaryOwner: boolean;
  readonly effectiveFrom: string;
  readonly effectiveTo: string | null;
  readonly status: OrganizationRepresentativeStatus;
  readonly revision: number;
}
export interface OrganizationRepresentative extends OrganizationRepresentativeListItem {
  readonly createdAtUtc?: string;
  readonly createdByUserId?: string;
  readonly lastModifiedAtUtc?: string | null;
  readonly lastModifiedByUserId?: string | null;
}
