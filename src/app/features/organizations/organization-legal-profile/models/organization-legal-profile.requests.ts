import { OrganizationLegalForm } from './organization-legal-profile.model';

export interface CreateOrganizationLegalProfileRequest {
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
  readonly activateImmediately: boolean;
}

export interface UpdateOrganizationLegalProfileRequest
  extends Omit<CreateOrganizationLegalProfileRequest, 'activateImmediately'> {
  readonly expectedRevision: number;
}

export interface ChangeOrganizationLegalProfileStatusRequest {
  readonly expectedRevision: number;
}
