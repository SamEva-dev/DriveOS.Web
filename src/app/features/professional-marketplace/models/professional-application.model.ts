export type ProfessionalApplicationStatus =
  'Submitted' | 'UnderReview' | 'Shortlisted' | 'Accepted' | 'Rejected' | 'Withdrawn';

export interface ProfessionalApplication {
  readonly id: string;
  readonly opportunityId: string;
  readonly professionalProfileId: string;
  readonly status: ProfessionalApplicationStatus;
  readonly message: string;
  readonly proposedRate: number | null;
  readonly currency: string | null;
  readonly rateUnit: string | null;
  readonly negotiable: boolean;
  readonly availableFrom: string | null;
  readonly availableUntil: string | null;
  readonly decisionReason: string | null;
  readonly submittedAtUtc: string;
  readonly decidedAtUtc: string | null;
  readonly displayName: string;
  readonly headline: string | null;
  readonly experienceYears: number;
  readonly complianceStatus: string;
  readonly teachingCategoryCodes: readonly string[];
  readonly languages: readonly string[];
  readonly primaryServiceArea: string | null;
}
