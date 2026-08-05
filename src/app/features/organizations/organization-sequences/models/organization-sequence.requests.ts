import {
  OrganizationSequenceResetPolicy,
  OrganizationSequenceScope,
} from './organization-sequence.model';

export interface CreateOrganizationSequenceRequest {
  readonly branchId: string | null;
  readonly scope: OrganizationSequenceScope;
  readonly code: string;
  readonly pattern: string;
  readonly padding: number;
  readonly initialValue: number;
  readonly resetPolicy: OrganizationSequenceResetPolicy;
}

export interface ReserveOrganizationSequenceNumberRequest {
  readonly branchId: string | null;
  readonly code: string;
}

export interface ChangeOrganizationSequenceStatusRequest {
  readonly expectedRevision: number;
}
