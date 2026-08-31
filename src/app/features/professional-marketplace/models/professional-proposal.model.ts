export type ProfessionalProposalStatus =
  'Sent' | 'Countered' | 'Accepted' | 'Rejected' | 'Withdrawn' | 'Expired';
export interface ProfessionalProposalRevision {
  readonly revision: number;
  readonly subject: string;
  readonly message: string;
  readonly startsOn: string;
  readonly endsOn: string;
  readonly teachingCategoryCodes: readonly string[];
  readonly engagementType: string;
  readonly vehicleProvisionMode: string;
  readonly proposedRate: number | null;
  readonly currency: string | null;
  readonly rateUnit: string | null;
  readonly negotiable: boolean;
  readonly changedAtUtc: string;
  readonly changedByUserId: string;
}
export interface ProfessionalProposal {
  readonly id: string;
  readonly organizationId: string;
  readonly branchId: string | null;
  readonly professionalProfileId: string;
  readonly opportunityId: string | null;
  readonly subject: string;
  readonly message: string;
  readonly startsOn: string;
  readonly endsOn: string;
  readonly teachingCategoryCodes: readonly string[];
  readonly engagementType: string;
  readonly vehicleProvisionMode: string;
  readonly proposedRate: number | null;
  readonly currency: string | null;
  readonly rateUnit: string | null;
  readonly negotiable: boolean;
  readonly expiresAtUtc: string;
  readonly status: ProfessionalProposalStatus;
  readonly revision: number;
  readonly decisionReason: string | null;
  readonly sentAtUtc: string;
  readonly respondedAtUtc: string | null;
  readonly revisions: readonly ProfessionalProposalRevision[];
}
export interface CreateProfessionalProposalRequest {
  readonly branchId: string | null;
  readonly opportunityId: string | null;
  readonly subject: string;
  readonly message: string;
  readonly startsOn: string;
  readonly endsOn: string;
  readonly teachingCategoryCodes: readonly string[];
  readonly engagementType: string;
  readonly vehicleProvisionMode: string;
  readonly proposedRate: number | null;
  readonly currency: string | null;
  readonly rateUnit: string | null;
  readonly negotiable: boolean;
  readonly expiresAtUtc: string;
}
