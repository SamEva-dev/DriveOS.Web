export interface TrainingDeliveryDashboardKpis {
  readonly sessionsToday: number;
  readonly inProgress: number;
  readonly completed: number;
  readonly missingReports: number;
  readonly lateStarts: number;
  readonly absences: number;
  readonly cancelled: number;
  readonly openIncidents: number;
  readonly durationsToValidate: number;
  readonly syncFailures: number | null;
}

export interface TrainingDeliveryDashboardSession {
  readonly id: string;
  readonly studentId: string;
  readonly studentDisplayName: string;
  readonly instructorId: string;
  readonly vehicleId: string | null;
  readonly branchId: string | null;
  readonly plannedStartAtUtc: string;
  readonly plannedEndAtUtc: string;
  readonly actualStartAtUtc: string | null;
  readonly actualEndAtUtc: string | null;
  readonly deliveredDurationMinutes: number | null;
  readonly status: number;
  readonly attendanceStatus: number | null;
  readonly trainingCategory: string | null;
  readonly objectives: string | null;
  readonly meetingPoint: string | null;
  readonly hasReport: boolean;
  readonly assessmentCount: number;
  readonly hasOpenIncident: boolean;
  readonly hasCriticalIncident: boolean;
}

export interface TrainingDeliveryDashboardIncident {
  readonly id: string;
  readonly trainingSessionId: string;
  readonly studentId: string;
  readonly studentDisplayName: string;
  readonly incidentType: number;
  readonly severity: number;
  readonly status: number;
  readonly occurredAtUtc: string;
  readonly description: string;
  readonly escalationRequired: boolean;
}

export interface TrainingDeliveryDashboard {
  readonly windowStartAtUtc: string;
  readonly windowEndAtUtc: string;
  readonly generatedAtUtc: string;
  readonly kpis: TrainingDeliveryDashboardKpis;
  readonly sessions: readonly TrainingDeliveryDashboardSession[];
  readonly incidents: readonly TrainingDeliveryDashboardIncident[];
}

export type TrainingDashboardTab = 'operations' | 'attention' | 'quality';
export type TrainingDashboardDrawerKind =
  | 'sessionsToday'
  | 'inProgress'
  | 'completed'
  | 'missingReports'
  | 'lateStarts'
  | 'absences'
  | 'cancelled'
  | 'openIncidents'
  | 'durationsToValidate'
  | 'syncFailures'
  | 'session';


export interface TrainingDeliveryPendingReportItem {
  readonly sessionId: string;
  readonly studentId: string;
  readonly studentDisplayName: string;
  readonly instructorId: string;
  readonly branchId: string | null;
  readonly plannedStartAtUtc: string;
  readonly plannedEndAtUtc: string;
  readonly actualEndAtUtc: string;
  readonly reportStatus: number;
  readonly reportVersion: number;
  readonly lastCompletedStep: number;
  readonly completionPercent: number;
  readonly resumeStep: number;
  readonly lastSavedAtUtc: string | null;
  readonly dueAtUtc: string;
  readonly isOverdue: boolean;
  readonly hasOpenIncident: boolean;
  readonly hasCriticalIncident: boolean;
  readonly isRejectedForCorrection: boolean;
  readonly isWaitingForValidation: boolean;
  readonly trainingCategory: string | null;
}

export interface TrainingDeliveryPendingReportsSummary {
  readonly total: number;
  readonly drafts: number;
  readonly toComplete: number;
  readonly toCorrect: number;
  readonly toValidate: number;
  readonly overdue: number;
}

export interface TrainingDeliveryPendingReportsResponse {
  readonly generatedAtUtc: string;
  readonly isPersonalScope: boolean;
  readonly summary: TrainingDeliveryPendingReportsSummary;
  readonly items: readonly TrainingDeliveryPendingReportItem[];
}
