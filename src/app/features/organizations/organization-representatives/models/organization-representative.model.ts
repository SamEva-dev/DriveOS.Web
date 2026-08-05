export enum OrganizationRepresentativeType {
  Owner = 1,
  LegalRepresentative = 2,
  Director = 3,
  AuthorizedSignatory = 4,
  AdministrativeRepresentative = 5,
  BillingRepresentative = 6,
  DataProtectionRepresentative = 7,
  Other = 8,
}
export enum OrganizationRepresentativeStatus {
  Draft = 1,
  Active = 2,
  Suspended = 3,
  Ended = 4,
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
