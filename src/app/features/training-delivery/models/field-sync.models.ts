export type FieldSyncState =
  | 'LocalDraft'
  | 'PendingSync'
  | 'Syncing'
  | 'Synced'
  | 'Failed'
  | 'Conflict'
  | 'BlockedByPermission'
  | 'BlockedByValidation';

export type FieldSyncItemType =
  | 'SessionStart'
  | 'SessionMarker'
  | 'SessionEnd'
  | 'Attendance'
  | 'SessionReport'
  | 'CompetencyAssessment'
  | 'VehicleMileage'
  | 'VehicleCheck'
  | 'Incident'
  | 'Photo'
  | 'LocationEvent'
  | 'Intervention'
  | 'Observation'
  | 'SessionInterrupt'
  | 'SessionResume'
  | 'GroupAttendance'
  | 'Other';

export interface FieldSyncItem {
  readonly id: string;
  readonly ownerUserId: string;
  readonly organizationId: string;
  readonly sessionId: string | null;
  readonly type: FieldSyncItemType;
  readonly method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  readonly url: string;
  readonly body: unknown;
  readonly operationId: string | null;
  readonly permission: string | null;
  readonly dependsOn: readonly string[];
  readonly createdAtUtc: string;
  readonly expiresAtUtc: string;
  readonly updatedAtUtc: string;
  readonly state: FieldSyncState;
  readonly retryCount: number;
  readonly lastAttemptAtUtc: string | null;
  readonly lastSuccessAtUtc: string | null;
  readonly errorCode: string | null;
  readonly errorMessageKey: string | null;
}

export interface FieldSyncSummary {
  readonly pending: number;
  readonly failed: number;
  readonly conflicts: number;
  readonly blocked: number;
  readonly synced: number;
  readonly lastSuccessfulSyncAtUtc: string | null;
}
