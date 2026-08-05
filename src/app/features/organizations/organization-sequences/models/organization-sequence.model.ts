export enum OrganizationSequenceScope {
  Organization = 1,
  Branch = 2,
}

export enum OrganizationSequenceResetPolicy {
  Never = 1,
  Yearly = 2,
  Monthly = 3,
}

export enum OrganizationSequenceStatus {
  Active = 1,
  Suspended = 2,
  Archived = 3,
}

export interface OrganizationSequenceListItem {
  readonly id: string;
  readonly organizationId: string;
  readonly branchId: string | null;
  readonly scope: OrganizationSequenceScope;
  readonly code: string;
  readonly pattern: string;
  readonly padding: number;
  readonly nextValue: number;
  readonly resetPolicy: OrganizationSequenceResetPolicy;
  readonly status: OrganizationSequenceStatus;
  readonly revision: number;
}

export interface OrganizationSequence extends OrganizationSequenceListItem {
  readonly lastResetYear: number | null;
  readonly lastResetMonth: number | null;
  readonly createdAtUtc: string;
  readonly createdByUserId: string;
  readonly lastModifiedAtUtc: string | null;
  readonly lastModifiedByUserId: string | null;
}
