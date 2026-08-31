export interface TeachingCapability {
  readonly categoryCode: string;
  readonly deliveryModeCodes: readonly string[];
  readonly audienceCodes: readonly string[];
  readonly languageCodes: readonly string[];
  readonly specializationCodes: readonly string[];
}

export interface ProfessionalServiceArea {
  readonly areaCode: string;
  readonly countryCode: string;
  readonly displayName: string;
  readonly latitude: number | null;
  readonly longitude: number | null;
  readonly radiusKm: number | null;
  readonly primary: boolean;
  readonly mobilityMode: string;
}

export interface MarketplaceAvailabilityRule {
  readonly dayOfWeek: string | number;
  readonly startTime: string;
  readonly endTime: string;
  readonly timeZoneId: string;
}

export interface MarketplaceAvailabilityException {
  readonly date: string;
  readonly startTime: string | null;
  readonly endTime: string | null;
  readonly type: string;
  readonly reason: string | null;
}

export interface ProfessionalRate {
  readonly rateCode: string;
  readonly unit: string;
  readonly amount: number;
  readonly currency: string;
  readonly teachingCategoryCode: string | null;
  readonly vehicleProvisionMode: string | null;
  readonly mileageRate: number | null;
  readonly minimumBillableQuantity: number | null;
  readonly negotiable: boolean;
  readonly effectiveFrom: string | null;
  readonly effectiveTo: string | null;
}

export interface ProfessionalProfile {
  readonly id: string;
  readonly personId: string;
  readonly providerOrganizationId: string;
  readonly userId: string | null;
  readonly status: string;
  readonly complianceStatus: string;
  readonly professionalType: string;
  readonly legalName: string | null;
  readonly tradeName: string | null;
  readonly legalStatusCode: string | null;
  readonly registrationNumber: string | null;
  readonly taxNumber: string | null;
  readonly professionalEmail: string | null;
  readonly professionalPhone: string | null;
  readonly addressLine1: string | null;
  readonly addressLine2: string | null;
  readonly postalCode: string | null;
  readonly city: string | null;
  readonly countryCode: string | null;
  readonly headline: string | null;
  readonly biography: string | null;
  readonly experienceYears: number;
  readonly languages: readonly string[];
  readonly teachingCategoryCodes: readonly string[];
  readonly specializationCodes: readonly string[];
  readonly teachingCapabilities: readonly TeachingCapability[];
  readonly preferredEngagementTypes: readonly string[];
  readonly primaryServiceArea: string | null;
  readonly mobilityRadiusKm: number | null;
  readonly serviceAreas: readonly ProfessionalServiceArea[];
  readonly availabilityRules: readonly MarketplaceAvailabilityRule[];
  readonly availabilityExceptions: readonly MarketplaceAvailabilityException[];
  readonly minimumBookingNoticeHours: number;
  readonly maximumDailyWorkMinutes: number;
  readonly maximumConsecutiveWorkMinutes: number;
  readonly rates: readonly ProfessionalRate[];
  readonly hasPersonalTrainingVehicle: boolean;
  readonly personalVehicleNotes: string | null;
  readonly isProfileComplete: boolean;
}
