export type ExternalAccessResourceType =
  | 'Engagement'
  | 'Mission'
  | 'Student'
  | 'Session'
  | 'Vehicle'
  | 'ContractDocument'
  | 'ServiceStatement'
  | 'Invoice'
  | 'Payment';
export type ExternalAccessGrantStatus = 'Active' | 'Revoked' | 'Expired';

export interface ExternalAccessGrant {
  readonly id: string;
  readonly engagementId: string;
  readonly professionalProfileId: string;
  readonly organizationId: string;
  readonly branchId: string | null;
  readonly resourceType: ExternalAccessResourceType;
  readonly resourceId: string;
  readonly permission: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly status: ExternalAccessGrantStatus;
  readonly grantedByUserId: string;
  readonly createdAtUtc: string;
  readonly revokedAtUtc: string | null;
  readonly revokedByUserId: string | null;
  readonly revocationReason: string | null;
  readonly originCode:
    'ENGAGEMENT_PREPARATION' | 'STUDENT_ASSIGNMENT' | 'MISSION_SCOPE' | 'MANUAL' | string;
}

export interface CreateExternalAccessGrantRequest {
  readonly resourceType: ExternalAccessResourceType;
  readonly resourceId: string;
  readonly permission: string;
  readonly startDate: string;
  readonly endDate: string;
}
