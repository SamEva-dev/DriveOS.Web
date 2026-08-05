export type OrganizationLegalForm =
  | 'SoleProprietorship'
  | 'LimitedLiabilityCompany'
  | 'Corporation'
  | 'Partnership'
  | 'NonProfit'
  | 'PublicBody'
  | 'Cooperative'
  | 'Other';

export type OrganizationLegalProfileStatus = 'Draft' | 'Active' | 'Archived';

export interface OrganizationLegalProfile {
  readonly id: string;
  readonly organizationId: string;
  readonly legalForm: OrganizationLegalForm;
  readonly registrationNumber: string;
  readonly taxNumber: string | null;
  readonly tradeName: string | null;
  readonly incorporationDate: string | null;
  readonly addressLine1: string;
  readonly addressLine2: string | null;
  readonly postalCode: string;
  readonly city: string;
  readonly region: string | null;
  readonly countryCode: string;
  readonly status: OrganizationLegalProfileStatus;
  readonly revision: number;
  readonly createdAtUtc: string;
  readonly createdByUserId: string | null;
  readonly lastModifiedAtUtc: string | null;
  readonly lastModifiedByUserId: string | null;
}

export const ORGANIZATION_LEGAL_FORMS: readonly OrganizationLegalForm[] = [
  'SoleProprietorship',
  'LimitedLiabilityCompany',
  'Corporation',
  'Partnership',
  'NonProfit',
  'PublicBody',
  'Cooperative',
  'Other',
];
