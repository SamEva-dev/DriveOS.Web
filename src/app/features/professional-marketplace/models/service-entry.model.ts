export type ServiceEntryStatus = 'Recorded' | 'Submitted' | 'Approved' | 'Rejected' | 'Disputed';
export type ServiceEntrySourceType = 'TrainingSession' | 'MissionActivity' | 'ManualAdjustment';
export interface ServiceEntry {
  readonly id: string;
  readonly engagementId: string;
  readonly missionId: string | null;
  readonly professionalProfileId: string;
  readonly organizationId: string;
  readonly branchId: string | null;
  readonly sourceType: ServiceEntrySourceType;
  readonly sourceId: string;
  readonly serviceDate: string;
  readonly serviceCode: string;
  readonly quantityMinutes: number;
  readonly unitRate: number;
  readonly baseAmount: number;
  readonly expensesAmount: number;
  readonly indemnitiesAmount: number;
  readonly discountAmount: number;
  readonly totalAmount: number;
  readonly currency: string;
  readonly description: string;
  readonly status: ServiceEntryStatus;
  readonly submittedAtUtc: string | null;
  readonly reviewedAtUtc: string | null;
  readonly reviewedByUserId: string | null;
  readonly reviewReason: string | null;
  readonly createdAtUtc: string;
}
