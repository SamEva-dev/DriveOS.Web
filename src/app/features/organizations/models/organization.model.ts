import { OrganizationStatus } from './organization-status';

export interface Organization {
  id: string;
  legalName: string;
  countryCode: string;
  type: string;
  status: OrganizationStatus;
  createdAtUtc: string;
  createdByUserId: string | null;
  lastModifiedAtUtc: string | null;
  lastModifiedByUserId: string | null;
}
