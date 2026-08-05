import { OrganizationRepresentativeType } from './organization-representative.model';
export interface CreateOrganizationRepresentativeRequest {
  personId: string;
  userId: string | null;
  representativeType: OrganizationRepresentativeType;
  authorityScope: string;
  isPrimaryOwner: boolean;
  effectiveFrom: string;
  effectiveTo: string | null;
  activateImmediately: boolean;
}
export interface UpdateOrganizationRepresentativeAuthorityRequest {
  authorityScope: string;
  userId: string | null;
  effectiveFrom: string;
  effectiveTo: string | null;
  expectedRevision: number;
}
export interface RevisionRequest {
  expectedRevision: number;
}
export interface ReasonedRevisionRequest extends RevisionRequest {
  reason: string;
}
export interface EndOrganizationRepresentativeRequest extends ReasonedRevisionRequest {
  effectiveTo: string;
}
