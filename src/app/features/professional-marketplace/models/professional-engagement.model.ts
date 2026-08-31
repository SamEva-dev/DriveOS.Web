export type ProfessionalEngagementStatus =
  'PendingActivation' | 'Active' | 'Suspended' | 'Ended' | 'Terminated';
export interface ProfessionalEngagementTerms {
  readonly startsOn: string;
  readonly endsOn: string;
  readonly teachingCategoryCodes: readonly string[];
  readonly engagementType: string;
  readonly vehicleProvisionMode: string;
  readonly estimatedMinutes: number | null;
  readonly rateAmount: number | null;
  readonly currency: string | null;
  readonly rateUnit: string | null;
  readonly mileageRate: number | null;
  readonly vehicleAllowance: number | null;
  readonly minimumGuaranteedAmount: number | null;
  readonly clauseCodes: readonly string[];
}
export interface ProfessionalServiceContractSignatorySnapshot {
  readonly personId: string;
  readonly role: string;
  readonly signingOrder: number;
  readonly isRequired: boolean;
  readonly signedAtUtc: string | null;
  readonly receivedAtUtc: string | null;
  readonly signatureMethod: string | null;
  readonly authenticationMethod: string | null;
  readonly provider: string | null;
  readonly providerReference: string | null;
  readonly certificateReference: string | null;
}
export interface ProfessionalServiceContractVersionSnapshot {
  readonly version: number;
  readonly documentReference: string | null;
  readonly documentSha256: string | null;
  readonly status: string;
  readonly generatedAtUtc: string | null;
  readonly sentForSignatureAtUtc: string | null;
  readonly signedAtUtc: string | null;
  readonly revisionReason: string;
  readonly supersededAtUtc: string;
  readonly supersededByUserId: string;
}
export interface ProfessionalServiceContractSnapshot {
  readonly contractId: string;
  readonly engagementId: string;
  readonly contractNumber: string;
  readonly contractType: string;
  readonly version: number;
  readonly status: string;
  readonly signatureOrder: string;
  readonly documentReference: string | null;
  readonly documentSha256: string | null;
  readonly generatedAtUtc: string | null;
  readonly sentForSignatureAtUtc: string | null;
  readonly signedAtUtc: string | null;
  readonly terminatedAtUtc: string | null;
  readonly terminationReason: string | null;
  readonly requiredSignatories: number;
  readonly signedRequiredSignatories: number;
  readonly signatories: readonly ProfessionalServiceContractSignatorySnapshot[];
  readonly previousVersions: readonly ProfessionalServiceContractVersionSnapshot[];
}
export interface CreateProfessionalServiceContractRequest {
  readonly contractNumber: string;
  readonly contractType: string;
  readonly signatureOrder: 1 | 2;
  readonly signatories: readonly {
    readonly personId: string;
    readonly role: string;
    readonly signingOrder: number;
    readonly isRequired: boolean;
  }[];
}
export interface RecordProfessionalServiceContractSignatureRequest {
  readonly signatoryPersonId: string;
  readonly documentSha256: string;
  readonly signatureMethod: string;
  readonly authenticationMethod: string;
  readonly provider: string;
  readonly providerReference: string;
  readonly certificateReference: string | null;
  readonly ipAddress: string | null;
  readonly signedAtUtc: string;
}
export interface ProfessionalEngagement {
  readonly id: string;
  readonly organizationId: string;
  readonly branchId: string | null;
  readonly professionalProfileId: string;
  readonly commercialOfferId: string;
  readonly commercialOfferRevision: number;
  readonly terms: ProfessionalEngagementTerms;
  readonly status: ProfessionalEngagementStatus;
  readonly compliancePrepared: boolean;
  readonly contractPrepared: boolean;
  readonly accessPrepared: boolean;
  readonly schedulingPrepared: boolean;
  readonly internalApprovalPrepared: boolean;
  readonly isOperationallyReady: boolean;
  readonly activatedAtUtc: string | null;
  readonly suspendedAtUtc: string | null;
  readonly endedAtUtc: string | null;
  readonly initialIntegrationCompletedAtUtc: string | null;
  readonly statusReason: string | null;
  readonly contract: ProfessionalServiceContractSnapshot | null;
}
export interface ExternalAccessPreparationResult {
  readonly isPrepared: boolean;
  readonly baselineGrantId: string | null;
  readonly reasonCode: string | null;
}
export interface ProfessionalSchedulingPreparationResult {
  readonly isPrepared: boolean;
  readonly calendarResourceId: string | null;
  readonly reasonCode: string | null;
}
