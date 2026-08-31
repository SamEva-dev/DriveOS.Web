export type ProfessionalOpportunityStatus =
  'Draft' | 'Published' | 'Paused' | 'Filled' | 'Expired' | 'Cancelled';
export type ProfessionalType =
  | 'DrivingInstructor'
  | 'InstructorTrainer'
  | 'AdministrativeContractor'
  | 'ComplianceConsultant'
  | 'Other';
export type ProfessionalEngagementType =
  | 'HourlyService'
  | 'HalfDay'
  | 'FullDay'
  | 'FixedMission'
  | 'RecurringMission'
  | 'Replacement'
  | 'Negotiable';
export type ProfessionalVehicleProvisionMode =
  'NotApplicable' | 'ClientProvided' | 'ProfessionalProvided' | 'Either';
export type ProfessionalRateUnit = 'Hour' | 'HalfDay' | 'Day' | 'Session' | 'Mission';

export interface OpportunityTimeWindow {
  readonly dayOfWeek: number;
  readonly startTime: string;
  readonly endTime: string;
  readonly timeZoneId: string;
}

export interface ProfessionalOpportunity {
  readonly id: string;
  readonly organizationId: string;
  readonly branchId: string | null;
  readonly status: ProfessionalOpportunityStatus;
  readonly title: string;
  readonly description: string;
  readonly professionalType: ProfessionalType;
  readonly teachingCategoryCodes: readonly string[];
  readonly requiredLanguageCodes: readonly string[];
  readonly requiredSpecializationCodes: readonly string[];
  readonly countryCode: string;
  readonly areaCode: string | null;
  readonly areaDisplayName: string | null;
  readonly latitude: number | null;
  readonly longitude: number | null;
  readonly radiusKm: number | null;
  readonly startsOn: string;
  readonly endsOn: string;
  readonly timeWindows: readonly OpportunityTimeWindow[];
  readonly estimatedMinutes: number | null;
  readonly engagementType: ProfessionalEngagementType;
  readonly vehicleProvisionMode: ProfessionalVehicleProvisionMode;
  readonly budgetMin: number | null;
  readonly budgetMax: number | null;
  readonly currency: string | null;
  readonly budgetUnit: ProfessionalRateUnit | null;
  readonly budgetNegotiable: boolean;
  readonly publishedAtUtc: string | null;
  readonly closedAtUtc: string | null;
  readonly closureReason: string | null;
}

export interface CreateProfessionalOpportunityRequest {
  readonly branchId: string | null;
  readonly title: string;
  readonly description: string;
  readonly professionalType: ProfessionalType;
  readonly teachingCategoryCodes: readonly string[];
  readonly requiredLanguageCodes: readonly string[];
  readonly requiredSpecializationCodes: readonly string[];
  readonly countryCode: string;
  readonly areaCode: string | null;
  readonly areaDisplayName: string | null;
  readonly latitude: number | null;
  readonly longitude: number | null;
  readonly radiusKm: number | null;
  readonly startsOn: string;
  readonly endsOn: string;
  readonly timeWindows: readonly OpportunityTimeWindow[];
  readonly estimatedMinutes: number | null;
  readonly engagementType: ProfessionalEngagementType;
  readonly vehicleProvisionMode: ProfessionalVehicleProvisionMode;
  readonly budgetMin: number | null;
  readonly budgetMax: number | null;
  readonly currency: string | null;
  readonly budgetUnit: ProfessionalRateUnit | null;
  readonly budgetNegotiable: boolean;
}
