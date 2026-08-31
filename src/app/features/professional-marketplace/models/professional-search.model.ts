export type ProfessionalRateUnit = 'Hour' | 'HalfDay' | 'Day' | 'Session' | 'Mission';

export interface ProfessionalSearchParameters {
  readonly countryCode?: string | null;
  readonly teachingCategoryCode?: string | null;
  readonly languageCode?: string | null;
  readonly specializationCode?: string | null;
  readonly areaCode?: string | null;
  readonly latitude?: number | null;
  readonly longitude?: number | null;
  readonly radiusKm?: number | null;
  readonly availableOnDate?: string | null;
  readonly availableFrom?: string | null;
  readonly availableTo?: string | null;
  readonly maximumRateAmount?: number | null;
  readonly currency?: string | null;
  readonly rateUnit?: ProfessionalRateUnit | null;
  readonly verifiedOnly?: boolean;
  readonly page?: number;
  readonly pageSize?: number;
}

export interface ProfessionalSearchPage {
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
  readonly items: readonly ProfessionalSearchResult[];
}

export interface ProfessionalSearchResult {
  readonly profileId: string;
  readonly headline: string;
  readonly professionalType: string;
  readonly verificationBadge: string;
  readonly teachingCategoryCodes: readonly string[];
  readonly languages: readonly string[];
  readonly specializationCodes: readonly string[];
  readonly primaryArea: string | null;
  readonly distanceKm: number | null;
  readonly commerciallyAvailable: boolean;
  readonly startingRateAmount: number | null;
  readonly rateCurrency: string | null;
  readonly rateUnit: string | null;
  readonly negotiable: boolean;
}
