export type ProfessionalMissionStatus =
  'Draft' | 'Proposed' | 'Accepted' | 'Declined' | 'Active' | 'Paused' | 'Completed' | 'Cancelled';
export type ProfessionalVehicleProvisionMode =
  'NotApplicable' | 'ClientProvided' | 'ProfessionalProvided' | 'Either';
export interface ProfessionalMissionWindow {
  readonly dayOfWeek: number;
  readonly startTime: string;
  readonly endTime: string;
  readonly timeZoneId: string;
}
export interface ProfessionalMission {
  readonly id: string;
  readonly engagementId: string;
  readonly organizationId: string;
  readonly professionalProfileId: string;
  readonly branchId: string | null;
  readonly title: string;
  readonly description: string | null;
  readonly startsOn: string;
  readonly endsOn: string;
  readonly teachingCategoryCodes: readonly string[];
  readonly estimatedMinutes: number | null;
  readonly vehicleProvisionMode: ProfessionalVehicleProvisionMode;
  readonly timeWindows: readonly ProfessionalMissionWindow[];
  readonly status: ProfessionalMissionStatus;
  readonly proposedAtUtc: string | null;
  readonly respondedAtUtc: string | null;
  readonly activatedAtUtc: string | null;
  readonly completedAtUtc: string | null;
  readonly cancelledAtUtc: string | null;
  readonly statusReason: string | null;
}
export interface CreateProfessionalMissionRequest {
  readonly branchId: string | null;
  readonly title: string;
  readonly description: string | null;
  readonly startsOn: string;
  readonly endsOn: string;
  readonly teachingCategoryCodes: readonly string[];
  readonly estimatedMinutes: number | null;
  readonly vehicleProvisionMode: ProfessionalVehicleProvisionMode;
  readonly timeWindows: readonly ProfessionalMissionWindow[];
}
