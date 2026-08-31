export interface ProfessionalReviewRatings {
  readonly overall: number;
  readonly reliability: number;
  readonly pedagogy: number;
  readonly communication: number;
  readonly punctuality: number;
}
export interface ProfessionalReview {
  readonly id: string;
  readonly organizationId: string;
  readonly engagementId: string;
  readonly overallScore: number;
  readonly ratings: ProfessionalReviewRatings;
  readonly comment: string | null;
  readonly professionalResponse: string | null;
  readonly createdAtUtc: string;
}
export interface ProfessionalReputation {
  readonly profileId: string;
  readonly averageScore: number;
  readonly reviewCount: number;
  readonly reliabilityAverage: number;
  readonly pedagogyAverage: number;
  readonly communicationAverage: number;
  readonly punctualityAverage: number;
  readonly reviews: readonly ProfessionalReview[];
}
export interface CreateProfessionalReviewRequest extends ProfessionalReviewRatings {
  readonly comment: string | null;
}
export interface ProfessionalReviewReport {
  readonly id: string;
  readonly reasonCode: string;
  readonly details: string | null;
  readonly status: string;
  readonly resolution: string | null;
  readonly createdAtUtc: string;
  readonly resolvedAtUtc: string | null;
}
export interface ModeratedProfessionalReview extends ProfessionalReview {
  readonly status: string;
  readonly respondedAtUtc: string | null;
  readonly hiddenAtUtc: string | null;
  readonly moderationReason: string | null;
  readonly reports: readonly ProfessionalReviewReport[];
}
export interface ProfessionalReviewModeration {
  readonly profileId: string;
  readonly reviews: readonly ModeratedProfessionalReview[];
}
