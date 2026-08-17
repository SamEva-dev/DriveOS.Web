export type CrmActivityType =
  | 'Call'
  | 'Email'
  | 'Sms'
  | 'Meeting'
  | 'Note'
  | 'BranchVisit'
  | 'StageChanged'
  | 'OfferSent'
  | 'DocumentReceived'
  | 'SystemEvent';
export type CrmActivityDirection = 'None' | 'Inbound' | 'Outbound';
export type CrmActivityOrigin = 'Manual' | 'Imported' | 'System';
export type CrmActivitySyncStatus =
  'NotApplicable' | 'Pending' | 'Synchronized' | 'Failed' | 'Abandoned';
export interface CrmActivity {
  id: string;
  leadId: string | null;
  leadName: string | null;
  type: CrmActivityType;
  direction: CrmActivityDirection;
  subject: string;
  details: string | null;
  occurredAtUtc: string;
  advisorUserId: string | null;
  advisorName: string | null;
  result: string | null;
  durationMinutes: number | null;
  isInternal: boolean;
  isUnfollowed: boolean;
  requiresRegularization: boolean;
  origin: CrmActivityOrigin;
  syncStatus: CrmActivitySyncStatus;
  syncErrorKey: string | null;
  syncAttemptCount: number;
  hasPotentialDuplicate: boolean;
  attachmentName: string | null;
  attachmentReference: string | null;
  isInvalidated: boolean;
}
export interface CrmActivityPage {
  items: CrmActivity[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}
export interface ActivityFilters {
  pageNumber: number;
  pageSize: number;
  search: string;
  type: CrmActivityType | '';
  advisorUserId: string;
  leadId: string;
  unattachedOnly: boolean;
  importedOnly: boolean;
  syncErrorsOnly: boolean;
  duplicatesOnly: boolean;
  regularizationOnly: boolean;
  unfollowedOnly: boolean;
  fromUtc: string;
  toUtc: string;
}
export interface CreateCrmActivityRequest {
  type: CrmActivityType;
  direction: CrmActivityDirection;
  subject: string;
  details: string | null;
  occurredAtUtc: string;
  advisorUserId: string | null;
  result: string | null;
  durationMinutes: number | null;
  isInternal: boolean;
  isUnfollowed: boolean;
  requiresRegularization: boolean;
  attachmentName: string | null;
  attachmentReference: string | null;
  nextActionTitle: string | null;
  nextActionDueAtUtc: string | null;
  nextActionType: 'Call' | 'Email' | 'Sms' | 'Appointment' | 'FollowUp' | 'Other';
}
export interface ImportCrmActivityRequest {
  leadId: string | null;
  type: CrmActivityType;
  direction: CrmActivityDirection;
  subject: string;
  details: string | null;
  occurredAtUtc: string;
  advisorUserId: string | null;
  externalId: string;
  idempotencyKey: string;
  syncStatus: 'Pending' | 'Synchronized' | 'Failed';
  syncErrorKey: string | null;
  result: string | null;
  durationMinutes: number | null;
  requiresRegularization: boolean;
  attachmentName: string | null;
  attachmentReference: string | null;
}
export interface ImportCrmActivityResult {
  activityId: string;
  alreadyImported: boolean;
}
