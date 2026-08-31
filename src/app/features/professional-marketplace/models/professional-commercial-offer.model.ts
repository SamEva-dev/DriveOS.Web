export type ProfessionalCommercialOfferStatus =
  'Draft' | 'Sent' | 'PartiallyAccepted' | 'Accepted' | 'Finalized' | 'Cancelled';

export interface ProfessionalCommercialOfferTerms {
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
export interface ProfessionalCommercialOfferRevision {
  readonly revision: number;
  readonly terms: ProfessionalCommercialOfferTerms;
  readonly changedAtUtc: string;
  readonly changedByUserId: string;
}
export interface ProfessionalCommercialOffer {
  readonly id: string;
  readonly organizationId: string;
  readonly professionalProfileId: string;
  readonly applicationId: string | null;
  readonly proposalId: string | null;
  readonly opportunityId: string | null;
  readonly terms: ProfessionalCommercialOfferTerms;
  readonly revision: number;
  readonly status: ProfessionalCommercialOfferStatus;
  readonly sentAtUtc: string | null;
  readonly organizationAcceptedAtUtc: string | null;
  readonly professionalAcceptedAtUtc: string | null;
  readonly finalizedAtUtc: string | null;
  readonly organizationAcceptedByUserId: string | null;
  readonly professionalAcceptedByUserId: string | null;
  readonly cancellationReason: string | null;
  readonly createdAtUtc: string;
  readonly revisions: readonly ProfessionalCommercialOfferRevision[];
}
export interface CreateProfessionalCommercialOfferRequest {
  readonly professionalProfileId: string;
  readonly applicationId: string | null;
  readonly proposalId: string | null;
  readonly opportunityId: string | null;
  readonly terms: ProfessionalCommercialOfferTerms;
}
