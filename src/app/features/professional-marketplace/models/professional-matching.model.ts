export interface ProfessionalMatchBreakdown {
  readonly categoryScore: number;
  readonly languageScore: number;
  readonly specializationScore: number;
  readonly distanceScore: number;
  readonly availabilityScore: number;
  readonly vehicleScore: number;
  readonly rateScore: number;
  readonly complianceScore: number;
}

export interface ProfessionalMatchResult {
  readonly profileId: string;
  readonly displayName: string;
  readonly headline: string | null;
  readonly experienceYears: number;
  readonly teachingCategoryCodes: readonly string[];
  readonly languages: readonly string[];
  readonly primaryServiceArea: string | null;
  readonly startingRateAmount: number | null;
  readonly startingRateCurrency: string | null;
  readonly startingRateUnit: string | null;
  readonly score: number;
  readonly eligible: boolean;
  readonly blockingReasons: readonly string[];
  readonly breakdown: ProfessionalMatchBreakdown;
  readonly explanations: readonly string[];
}
