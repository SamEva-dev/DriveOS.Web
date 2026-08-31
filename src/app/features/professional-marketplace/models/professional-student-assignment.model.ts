export interface ProfessionalStudentAssignment {
  readonly id: string;
  readonly missionId: string;
  readonly engagementId: string;
  readonly professionalProfileId: string;
  readonly studentId: string;
  readonly studentDisplayName: string;
  readonly studentEmail: string | null;
  readonly studentPhone: string | null;
  readonly startsOn: string;
  readonly endsOn: string;
  readonly scopeCode: string;
  readonly assignmentReason: string;
  readonly status: 'Active' | 'Revoked' | 'Completed' | string;
  readonly createdAtUtc: string;
  readonly revokedAtUtc: string | null;
  readonly revocationReason: string | null;
}

export interface AssignProfessionalStudentRequest {
  readonly studentId: string;
  readonly startsOn: string;
  readonly endsOn: string;
  readonly scopeCode: string;
  readonly assignmentReason: string;
}
