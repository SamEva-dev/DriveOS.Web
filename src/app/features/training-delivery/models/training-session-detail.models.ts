export interface TrainingSessionAttendance {
  readonly id: string;
  readonly operationId: string;
  readonly revision: number;
  readonly status: number;
  readonly actualArrivalAtUtc: string | null;
  readonly actualDepartureAtUtc: string | null;
  readonly lateMinutes: number;
  readonly reason: string | null;
  readonly evidenceDocumentId: string | null;
  readonly recordedByUserId: string;
  readonly recordedAtUtc: string;
  readonly supersedesAttendanceId: string | null;
  readonly isOverride: boolean;
  readonly overrideReason: string | null;
}

export interface TrainingSessionIntervention {
  readonly id: string;
  readonly operationId: string;
  readonly type: number;
  readonly severity: number;
  readonly occurredAtUtc: string;
  readonly context: string;
  readonly reason: string;
  readonly relatedCompetencyId: string | null;
  readonly outcome: string | null;
  readonly sharedExplanation: string | null;
  readonly recordedByUserId: string;
  readonly recordedAtUtc: string;
}

export interface TrainingSessionObservation {
  readonly id: string;
  readonly operationId: string;
  readonly type: number;
  readonly observedAtUtc: string;
  readonly content: string;
  readonly isInternal: boolean;
  readonly recordedByUserId: string;
  readonly recordedAtUtc: string;
}

export interface TrainingSessionMarker {
  readonly id: string;
  readonly operationId: string;
  readonly type: number;
  readonly occurredAtUtc: string;
  readonly competencyId: string | null;
  readonly shortNote: string;
  readonly severity: number;
  readonly latitude: number | null;
  readonly longitude: number | null;
  readonly createdOffline: boolean;
  readonly recordedByUserId: string;
  readonly recordedAtUtc: string;
}

export interface TrainingSessionInterruption {
  readonly id: string;
  readonly interruptOperationId: string;
  readonly reason: number;
  readonly description: string | null;
  readonly startedAtUtc: string;
  readonly interruptedByUserId: string;
  readonly resumeOperationId: string | null;
  readonly resumedAtUtc: string | null;
  readonly resumedByUserId: string | null;
  readonly terminatedAtUtc: string | null;
  readonly terminatedByCancellationId: string | null;
  readonly isActive: boolean;
}

export interface TrainingSessionOdometerReading {
  readonly id: string;
  readonly operationId: string;
  readonly odometerKilometers: number;
  readonly source: number;
  readonly observedAtUtc: string;
  readonly recordedByUserId: string;
  readonly recordedAtUtc: string;
}

export interface TrainingSessionEnergyEntry {
  readonly id: string;
  readonly operationId: string;
  readonly type: number;
  readonly energyLevelPercent: number | null;
  readonly quantity: number | null;
  readonly observedAtUtc: string;
  readonly note: string | null;
  readonly createdOffline: boolean;
  readonly recordedByUserId: string;
  readonly recordedAtUtc: string;
}

export interface TrainingSessionCompetencyAssessment {
  readonly id: string;
  readonly operationId: string;
  readonly competencyId: string;
  readonly curriculumVersionId: string;
  readonly pedagogyAssessmentId: string;
  readonly levelCode: string;
  readonly observedCriteria: string | null;
  readonly context: string | null;
  readonly relatedInterventionId: string | null;
  readonly internalComment: string | null;
  readonly sharedComment: string | null;
  readonly evidenceDocumentId: string | null;
  readonly assessedAtUtc: string;
  readonly assessorUserId: string;
  readonly recordedAtUtc: string;
}

export interface TrainingSessionReport {
  readonly id: string;
  readonly operationId: string;
  readonly status: number;
  readonly version: number;
  readonly lastCompletedStep: number;
  readonly actualEndAtUtc: string;
  readonly grossDurationMinutes: number;
  readonly interruptionDurationMinutes: number;
  readonly deliveredDurationMinutes: number;
  readonly distanceKilometers: number | null;
  readonly summary: string;
  readonly objectivesWorked: string | null;
  readonly objectivesAchieved: string | null;
  readonly nextObjective: string | null;
  readonly sharedComment: string | null;
  readonly internalNote: string | null;
  readonly instructorComments: string | null;
  readonly lastSavedByUserId: string;
  readonly lastSavedAtUtc: string;
  readonly completedByUserId: string;
  readonly completedAtUtc: string;
}

export interface TrainingSessionDetail {
  readonly id: string;
  readonly organizationId: string;
  readonly studentOwnerOrganizationId: string;
  readonly performingOrganizationId: string;
  readonly sourceBookingId: string;
  readonly studentId: string;
  readonly trainingPathId: string;
  readonly instructorId: string;
  readonly branchId: string | null;
  readonly vehicleId: string | null;
  readonly plannedStartAtUtc: string;
  readonly plannedEndAtUtc: string;
  readonly trainingCategory: string | null;
  readonly objectives: string | null;
  readonly meetingPoint: string | null;
  readonly pricingReference: string | null;
  readonly trainingCreditAccountId: string | null;
  readonly creditQuantity: number | null;
  readonly creditReservationReference: string | null;
  readonly status: number;
  readonly readinessCheckedAtUtc: string | null;
  readonly readinessCheckedByUserId: string | null;
  readonly readyInstructorId: string | null;
  readonly readyVehicleId: string | null;
  readonly readyBranchId: string | null;
  readonly readyPlannedStartAtUtc: string | null;
  readonly readyPlannedEndAtUtc: string | null;
  readonly actualInstructorId: string | null;
  readonly actualVehicleId: string | null;
  readonly actualBranchId: string | null;
  readonly actualStartAtUtc: string | null;
  readonly startedByUserId: string | null;
  readonly currentAttendanceId: string | null;
  readonly currentAttendance: TrainingSessionAttendance | null;
  readonly attendanceHistory: readonly TrainingSessionAttendance[];
  readonly interventions: readonly TrainingSessionIntervention[];
  readonly observations: readonly TrainingSessionObservation[];
  readonly markers: readonly TrainingSessionMarker[];
  readonly interruptions: readonly TrainingSessionInterruption[];
  readonly odometerReadings: readonly TrainingSessionOdometerReading[];
  readonly energyEntries: readonly TrainingSessionEnergyEntry[];
  readonly competencyAssessments: readonly TrainingSessionCompetencyAssessment[];
  readonly latestOdometerKilometers: number | null;
  readonly startEnergyLevelPercent: number | null;
  readonly latestEnergyLevelPercent: number | null;
  readonly fuelAddedLiters: number;
  readonly chargedEnergyKwh: number;
  readonly actualEndAtUtc: string | null;
  readonly endEnergyLevelPercent: number | null;
  readonly grossDurationMinutes: number | null;
  readonly interruptionDurationMinutes: number | null;
  readonly deliveredDurationMinutes: number | null;
  readonly distanceKilometers: number | null;
  readonly completionOperationId: string | null;
  readonly completedByUserId: string | null;
  readonly completedAtUtc: string | null;
  readonly cancellationId: string | null;
  readonly cancelledAtUtc: string | null;
  readonly cancelledByUserId: string | null;
  readonly report: TrainingSessionReport | null;
  readonly createdAtUtc: string;
  readonly lastModifiedAtUtc: string | null;
}

export interface TrainingIncidentDetail {
  readonly id: string;
  readonly trainingSessionId: string;
  readonly incidentType: number;
  readonly severity: number;
  readonly status: number;
  readonly occurredAtUtc: string;
  readonly description: string;
  readonly immediateActions: string;
  readonly escalationRequired: boolean;
  readonly requiresFleetFollowUp: boolean;
  readonly requiresComplianceFollowUp: boolean;
  readonly resolution: string | null;
  readonly resolvedAtUtc: string | null;
  readonly closedAtUtc: string | null;
  readonly createdAtUtc: string;
}

export interface TrainingSessionReadinessCheck {
  readonly code: string;
  readonly messageKey: string;
  readonly status: number;
  readonly detail: string | null;
}

export interface TrainingSessionPreparation {
  readonly sessionId: string;
  readonly sessionStatus: number;
  readonly canStart: boolean;
  readonly checkedAtUtc: string;
  readonly currentInstructorId: string;
  readonly currentVehicleId: string | null;
  readonly currentBranchId: string | null;
  readonly currentPlannedStartAtUtc: string;
  readonly currentPlannedEndAtUtc: string;
  readonly checks: readonly TrainingSessionReadinessCheck[];
}

export interface TrainingSessionNarrativeRevision {
  readonly id: string;
  readonly kind: number;
  readonly reportVersion: number;
  readonly content: string | null;
  readonly changedByUserId: string;
  readonly changedAtUtc: string;
}

export interface TrainingSessionInternalNote {
  readonly sessionId: string;
  readonly reportVersion: number;
  readonly internalNote: string | null;
  readonly history: readonly TrainingSessionNarrativeRevision[];
}

export interface TrainingSessionReportReviewCheck {
  readonly code: string;
  readonly passed: boolean;
  readonly blocking: boolean;
  readonly messageKey: string;
}

export interface TrainingSessionReportReview {
  readonly sessionId: string;
  readonly reportStatus: number;
  readonly serverVersion: number;
  readonly canSubmit: boolean;
  readonly checks: readonly TrainingSessionReportReviewCheck[];
}

export interface TrainingSessionReportRevision {
  readonly id: string;
  readonly scenario: number;
  readonly status: number;
  readonly fieldCode: string;
  readonly currentValue: string;
  readonly proposedValue: string;
  readonly reason: string;
  readonly hasFinancialImpact: boolean;
  readonly requestedByUserId: string;
  readonly requestedAtUtc: string;
  readonly decidedByUserId: string | null;
  readonly decidedAtUtc: string | null;
  readonly decisionReason: string | null;
  readonly appliedReportVersion: number | null;
}
