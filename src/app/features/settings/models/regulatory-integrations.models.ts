export type RegulatoryIntegrationConnectionStatus = 'Draft' | 'Active' | 'Suspended' | 'Ended';
export type RegulatorySubmissionStatus = 'WaitingForData' | 'Pending' | 'Processing' | 'Submitted' | 'Accepted' | 'Rejected' | 'RetryPending' | 'Failed' | 'Cancelled' | 'Superseded';

export interface RegulatoryIntegrationConnection {
  readonly id: string;
  readonly organizationId: string;
  readonly branchId: string | null;
  readonly countryCode: string;
  readonly providerCode: string;
  readonly externalAccountReference: string;
  readonly hasSecretReference: boolean;
  readonly status: RegulatoryIntegrationConnectionStatus;
  readonly revision: number;
}

export interface RegulatorySubmissionListItem {
  readonly id: string;
  readonly projectionId: string;
  readonly sessionId: string;
  readonly countryCode: string;
  readonly providerCode: string;
  readonly status: RegulatorySubmissionStatus;
  readonly revision: number;
  readonly attemptCount: number;
  readonly createdAtUtc: string;
  readonly lastAttemptAtUtc: string | null;
  readonly nextAttemptAtUtc: string | null;
  readonly acknowledgedAtUtc: string | null;
  readonly externalReference: string | null;
  readonly lastErrorCode: string | null;
  readonly hasIssues: boolean;
}

export interface RegulatorySubmissionPage {
  readonly page: number;
  readonly pageSize: number;
  readonly totalCount: number;
  readonly items: readonly RegulatorySubmissionListItem[];
}

export interface RegulatorySynchronizationSummary {
  readonly total: number;
  readonly waitingForData: number;
  readonly pending: number;
  readonly processing: number;
  readonly accepted: number;
  readonly rejected: number;
  readonly retryPending: number;
  readonly failed: number;
  readonly superseded: number;
  readonly lastAcceptedAtUtc: string | null;
  readonly lastFailureAtUtc: string | null;
}

export interface RegulatorySubmissionRevision {
  readonly id: string;
  readonly revision: number;
  readonly status: RegulatorySubmissionStatus;
  readonly payloadHash: string;
  readonly supersedesSubmissionId: string | null;
  readonly createdAtUtc: string;
  readonly submittedAtUtc: string | null;
  readonly acknowledgedAtUtc: string | null;
  readonly externalReference: string | null;
  readonly lastErrorCode: string | null;
  readonly lastErrorDetail: string | null;
}

export interface RegulatorySubmissionDetail extends RegulatorySubmissionListItem {
  readonly projectionSchemaVersion: number;
  readonly submittedAtUtc: string | null;
  readonly lastErrorDetail: string | null;
  readonly issuesJson: string;
  readonly revisions: readonly RegulatorySubmissionRevision[];
}
