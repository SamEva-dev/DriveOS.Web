import { OrganizationType } from './organization-type';

export interface CreateOrganizationRequest {
  legalName: string;
  countryCode: string;
  organizationType: OrganizationType;
}
