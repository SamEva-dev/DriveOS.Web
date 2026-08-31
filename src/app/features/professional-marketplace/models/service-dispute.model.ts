export type ServiceDisputeStatus =
  | 'Open'
  | 'UnderDiscussion'
  | 'WaitingForFreelance'
  | 'WaitingForSchool'
  | 'Resolved'
  | 'Rejected'
  | 'Escalated';
export type ServiceDisputeParty = 'School' | 'Freelance' | 'Mediator';
export type ServiceDisputeResolutionOutcome =
  'ApproveServiceEntry' | 'RejectServiceEntry' | 'Rejected';
export type ServiceDisputeReason =
  | 'Duration'
  | 'Rate'
  | 'Absence'
  | 'Expenses'
  | 'ServiceQuality'
  | 'ServiceNotPerformed'
  | 'Duplicate'
  | 'IncorrectStudent'
  | 'NonCompliantVehicle'
  | 'Other';
export interface ServiceDisputeEvidence {
  readonly documentReferenceId: string;
  readonly label: string;
  readonly note?: string | null;
}
export interface ServiceDisputeMessage {
  readonly id: string;
  readonly party: ServiceDisputeParty;
  readonly message: string;
  readonly createdAtUtc: string;
  readonly createdByUserId: string;
}
export interface ServiceDispute {
  readonly id: string;
  readonly serviceEntryId: string;
  readonly engagementId: string;
  readonly professionalProfileId: string;
  readonly clientOrganizationId: string;
  readonly raisedByOrganizationId: string;
  readonly reason: ServiceDisputeReason;
  readonly description: string;
  readonly status: ServiceDisputeStatus;
  readonly resolutionOutcome?: ServiceDisputeResolutionOutcome | null;
  readonly resolution?: string | null;
  readonly evidence: readonly ServiceDisputeEvidence[];
  readonly discussion: readonly ServiceDisputeMessage[];
  readonly createdAtUtc: string;
  readonly resolvedAtUtc?: string | null;
  readonly escalatedAtUtc?: string | null;
  readonly escalatedByUserId?: string | null;
  readonly escalationReason?: string | null;
}
