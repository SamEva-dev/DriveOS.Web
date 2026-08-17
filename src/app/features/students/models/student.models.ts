export type StudentStatus = 'Active' | 'Inactive' | 'Archived' | string;
export type SortDirection = 'Ascending' | 'Descending';
export type StudentSortField = 'Name' | 'CreatedAt' | 'Status';

export interface StudentListItem {
  studentId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  status: StudentStatus;
  enrollmentId: string | null;
  branchId: string | null;
  trainingCode: string | null;
  enrollmentStatus: string | null;
  createdAtUtc: string;
}
export interface StudentListParameters {
  pageNumber: number;
  pageSize: number;
  search: string;
  branchId?: string;
  status?: string;
  enrollmentStatus?: string;
  sortBy: StudentSortField;
  sortDirection: SortDirection;
}
export interface PagedStudents {
  items: readonly StudentListItem[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}
export interface StudentDashboardActionItem {
  enrollmentId: string;
  studentId: string;
  studentName: string;
  trainingCode: string;
  status: string;
  createdAtUtc: string;
}
export interface RecentStudentItem {
  studentId: string;
  studentName: string;
  email: string | null;
  phone: string | null;
  createdAtUtc: string;
}
export interface StudentDashboard {
  activeStudents: number;
  draftEnrollments: number;
  pendingDocuments: number;
  readyForValidation: number;
  priorityActions: readonly StudentDashboardActionItem[];
  recentStudents: readonly RecentStudentItem[];
}
export interface StudentProfileSummary {
  studentId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  status: StudentStatus;
  createdAtUtc: string;
}
export interface ActiveEnrollmentSummary {
  enrollmentId: string;
  branchId: string;
  trainingCode: string;
  status: string;
  source: string;
  startedAtUtc: string;
}
export interface OverviewSection {
  code: string;
  route: string;
  isAuthorized: boolean;
  isAvailable: boolean;
  unavailableReasonKey: string | null;
}
export interface StudentOverview {
  profile: StudentProfileSummary;
  activeEnrollment: ActiveEnrollmentSummary | null;
  sections: readonly OverviewSection[];
  actions: readonly { code: string; route: string; isEnabled: boolean }[];
  alerts: readonly { code: string; severity: string; messageKey: string }[];
  recentActivity: readonly { type: string; occurredAtUtc: string; labelKey: string }[];
}

export interface StudentIdentity {
  studentId: string;
  legalFirstName: string;
  legalLastName: string;
  preferredName: string | null;
  birthDate: string | null;
  birthPlace: string | null;
  nationality: string | null;
  email: string | null;
  phone: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  postalCode: string | null;
  city: string | null;
  countryCode: string | null;
  preferredLanguage: string | null;
  timeZone: string | null;
  allowEmail: boolean;
  allowSms: boolean;
  allowPhone: boolean;
  verificationStatus: IdentityVerificationStatus;
  verifiedAtUtc: string | null;
}
export type IdentityVerificationStatus =
  | 'Unverified'
  | 'Declared'
  | 'DocumentVerified'
  | 'ExternallyVerified';

export interface VerifyStudentIdentityRequest {
  status: Extract<IdentityVerificationStatus, 'DocumentVerified' | 'ExternallyVerified'>;
  justification: string;
}

export interface UpdateStudentIdentityRequest {
  legalFirstName: string;
  legalLastName: string;
  preferredName: string | null;
  birthDate: string | null;
  birthPlace: string | null;
  nationality: string | null;
  email: string | null;
  phone: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  postalCode: string | null;
  city: string | null;
  countryCode: string | null;
  preferredLanguage: string | null;
  timeZone: string | null;
  allowEmail: boolean;
  allowSms: boolean;
  allowPhone: boolean;
  justification: string | null;
}
export interface UpdateStudentIdentityResponse {
  identity: StudentIdentity;
  potentialDuplicateDetected: boolean;
}
export interface AdministrationRequirement {
  id: string;
  code: string;
  labelKey: string;
  isBlocking: boolean;
  status: string;
  dueAtUtc: string | null;
  policySource: string;
  decisionReason: string | null;
}

export interface ConfigureAdministrationRequirementRequest {
  code: string;
  labelKey: string;
  isBlocking: boolean;
  dueAtUtc: string | null;
  policySource: string;
}

export interface DecideAdministrationRequirementRequest {
  status: 'Submitted' | 'Validated' | 'Rejected' | 'Expired';
  reason: string;
}

export interface AddAdministrativeBlockRequest {
  code: string;
  reason: string;
}

export interface AdministrationReasonRequest {
  reason: string;
}

export interface DecideComplianceExceptionRequest {
  approve: boolean;
  reason: string;
}

export interface StudentAdministration {
  studentId: string;
  status: string;
  validatedRequirements: number;
  totalRequirements: number;
  requirements: readonly AdministrationRequirement[];
  activeBlocks: readonly { id: string; code: string; reason: string; appliedAtUtc: string }[];
  exceptions: readonly {
    id: string;
    requirementId: string;
    requestReason: string;
    status: string;
    decisionReason: string | null;
    requestedAtUtc: string;
  }[];
  history: readonly { action: string; subjectId: string; occurredAtUtc: string }[];
}
export interface StudentGuardian {
  id: string;
  guardianPersonId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  relationshipType: string;
  legalBasis: string;
  parentalAuthorityStatus: string;
  permissions: number;
  effectiveFrom: string;
  effectiveTo: string | null;
  financialRights: boolean;
  signatureRights: boolean;
  notificationPreferences: string;
  status: string;
  invitedAtUtc: string | null;
}
export interface StudentGuardians {
  studentId: string;
  guardianRightsReviewRequired: boolean;
  items: readonly StudentGuardian[];
}

export interface CreateGuardianRequest {
  guardianPersonId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  relationshipType: string;
  legalBasis: string;
  parentalAuthorityStatus: string;
  permissions: number;
  effectiveFrom: string;
  effectiveTo: string | null;
  financialRights: boolean;
  signatureRights: boolean;
  notificationPreferences: string;
}

export interface UpdateGuardianRequest {
  relationshipType: string;
  legalBasis: string;
  parentalAuthorityStatus: string;
  permissions: number;
  effectiveFrom: string;
  effectiveTo: string | null;
  financialRights: boolean;
  signatureRights: boolean;
  notificationPreferences: string;
}

export interface StudentRelationshipItem {
  id: string;
  personOrOrganizationId: string;
  partyKind: string;
  displayName: string;
  email: string | null;
  phone: string | null;
  relationshipType: string;
  permissions: number;
  financialScope: number;
  communicationScope: number;
  effectiveFrom: string;
  effectiveTo: string | null;
  isPrimaryPayer: boolean;
  status: string;
  invitedAtUtc: string | null;
  statusReason: string | null;
}

export interface StudentRelationships {
  studentId: string;
  items: readonly StudentRelationshipItem[];
}

export interface CreateStudentRelationshipRequest {
  personOrOrganizationId: string;
  partyKind: string;
  displayName: string;
  email: string | null;
  phone: string | null;
  relationshipType: string;
  permissions: number;
  financialScope: number;
  communicationScope: number;
  effectiveFrom: string;
  effectiveTo: string | null;
  isPrimaryPayer: boolean;
}

export interface UpdateStudentRelationshipRequest {
  relationshipType: string;
  permissions: number;
  financialScope: number;
  communicationScope: number;
  effectiveFrom: string;
  effectiveTo: string | null;
  isPrimaryPayer: boolean;
}

export interface EnrollmentChecklistItem {
  id: string;
  ruleId: string;
  code: string;
  labelKey: string;
  category: string;
  isBlocking: boolean;
  targetRoute: string;
  status: string;
  responsibleUserId: string | null;
  dueAtUtc: string | null;
  decisionReason: string | null;
  reminderCount: number;
  lastReminderAtUtc: string | null;
}
export interface EnrollmentChecklist {
  studentId: string;
  enrollmentId: string;
  canActivate: boolean;
  completedBlocking: number;
  totalBlocking: number;
  items: readonly EnrollmentChecklistItem[];
}
export interface StudentDocument {
  id: string;
  enrollmentId: string | null;
  documentType: string;
  category: string;
  status: string;
  currentVersion: number;
  uploadedAtUtc: string | null;
  expiresOn: string | null;
  visibility: string | number;
  decisionReason: string | null;
}
export interface StudentDocuments {
  studentId: string;
  items: readonly StudentDocument[];
}

export interface RequestStudentDocumentRequest {
  enrollmentId: string | null;
  documentType: string;
  category: string;
  visibility: number;
  expiresOn: string | null;
}
export interface ValidateStudentDocumentRequest {
  approve: boolean;
  reason: string | null;
}

export interface StudentBranchAssignment {
  id: string;
  branchId: string;
  type: string;
  servicesAllowed: number | string;
  effectiveFrom: string;
  effectiveTo: string | null;
  reason: string;
  status: string;
}
export interface StudentBranches {
  studentId: string;
  primaryBranchId: string | null;
  assignments: readonly StudentBranchAssignment[];
}
export interface AssignStudentBranchRequest {
  branchId: string;
  type: number;
  servicesAllowed: number;
  effectiveFrom: string;
  effectiveTo: string | null;
  reason: string;
}
export interface BranchVerificationItem {
  code: string;
  status: string | number;
  messageKey: string;
}
export interface BranchChangeImpactItem {
  type: string | number;
  affectedCount: number;
  messageKey: string;
  requiresAction: boolean;
}
export interface PrimaryBranchChangeAnalysis {
  analysisId: string;
  currentBranchId: string | null;
  targetBranchId: string;
  expiresAtUtc: string;
  verifications: readonly BranchVerificationItem[];
  impacts: readonly BranchChangeImpactItem[];
}
export interface ChangePrimaryBranchRequest {
  analysisId: string;
  reason: string;
}
export interface StudentInstructorAssignment {
  id: string;
  instructorId: string;
  type: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  trainingCategory: string;
  maximumScope: string;
  reason: string;
  status: string;
}
export interface StudentInstructorHistory {
  id: string;
  assignmentId: string;
  action: string;
  reason: string;
  actorUserId: string;
  occurredAtUtc: string;
}
export interface StudentInstructors {
  studentId: string;
  primaryInstructorId: string | null;
  assignments: readonly StudentInstructorAssignment[];
  history: readonly StudentInstructorHistory[];
}

export interface InstructorSuggestion {
  instructorId: string;
  branchId: string;
  displayName: string | null;
  trainingCategory: string;
  qualificationVerified: boolean;
  availabilityStatus: string | number;
  loadPercentage: number | null;
  nextAvailabilityUtc: string | null;
  averageDistanceKm: number | null;
  hasInitialAssessment: boolean;
  isPartner: boolean;
  warnings: readonly string[];
}

export interface AssignStudentInstructorRequest {
  instructorId: string;
  type: number;
  effectiveFrom: string;
  effectiveTo: string | null;
  trainingCategory: string;
  maximumScope: number;
  reason: string;
}

export interface ReplacePrimaryInstructorRequest {
  instructorId: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  trainingCategory: string;
  maximumScope: number;
  reason: string;
}

export interface ApplyStudentBlockRequest {
  blockType: string;
  reason: string;
  sourceDomain: string;
  blockingActions: number;
  severity: number;
  expectedResolution: string;
}

export interface ReleaseStudentBlockRequest {
  resolutionType: number;
  reason: string;
}

export interface OverrideStudentBlockRequest {
  reason: string;
  untilUtc: string;
}

export interface StudentBlock {
  id: string;
  blockType: string;
  reason: string;
  sourceDomain: string;
  blockingActions: number | string;
  severity: string;
  appliedAtUtc: string;
  appliedByUserId: string;
  expectedResolution: string;
  status: string;
  resolutionType: string | null;
  resolutionReason: string | null;
  resolvedAtUtc: string | null;
  overrideUntilUtc: string | null;
  overrideReason: string | null;
}
export interface StudentStatuses {
  studentId: string;
  studentProfileStatus: string;
  enrollmentStatus: string | null;
  administrativeStatus: string;
  financialStatus: string;
  pedagogicalStatus: string;
  schedulingStatus: string;
  examStatus: string;
  portalAccessStatus: string;
  currentlyBlockedActions: number | string;
  blocks: readonly StudentBlock[];
}

export interface AnalyzeInternalTransferRequest {
  targetBranchId: string;
  mode: number;
  elements: number;
  effectiveOn: string | null;
  temporaryUntil: string | null;
  reason: string;
}

export interface InternalTransferImpact {
  type: string;
  affectedCount: number;
  status: string;
  messageKey: string;
  requiresAction: boolean;
}
export interface InternalTransfer {
  transferId: string;
  studentId: string;
  sourceBranchId: string;
  targetBranchId: string;
  mode: string;
  elements: number | string;
  effectiveOn: string;
  temporaryUntil: string | null;
  reason: string;
  status: string;
  analysisExpiresAtUtc: string;
  impacts: readonly InternalTransferImpact[];
}
export interface StudentDataGrant {
  id: string;
  granteeOrganizationId: string;
  scope: number | string;
  grantedAtUtc: string;
  expiresOn: string | null;
  isActive: boolean;
}
export interface ExternalTransferAudit {
  action: string;
  detail: string;
  actorUserId: string;
  occurredAtUtc: string;
}
export interface ExternalTransfer {
  transferId: string;
  studentId: string;
  sourceOrganizationId: string;
  targetOrganizationId: string;
  type: string;
  dataScope: number | string;
  effectiveOn: string;
  temporaryUntil: string | null;
  countryCode: string;
  reason: string;
  responsibilities: string;
  status: string;
  consentStatus: string;
  financialStatus: string;
  relationshipStatus: string;
  dataGrants: readonly StudentDataGrant[];
  audit: readonly ExternalTransferAudit[];
}


export interface SuspendEnrollmentRequest {
  reason: number;
  scope: number;
  startDate: string;
  expectedEndDate: string;
  immediateActions: string;
  bookingsDecision: number;
  futureBookingsCount: number;
  creditDecision: string;
  notificationPlan: string;
  reviewDate: string;
}

export interface EnrollmentSuspensionHistory {
  action: string;
  detail: string;
  actorUserId: string;
  occurredAtUtc: string;
}
export interface EnrollmentSuspension {
  suspensionId: string;
  studentId: string;
  enrollmentId: string;
  reason: string;
  scope: number | string;
  startDate: string;
  expectedEndDate: string;
  immediateActions: string;
  bookingsDecision: string;
  futureBookingsCount: number;
  creditDecision: string;
  notificationPlan: string;
  reviewDate: string;
  status: string;
  notificationStatus: string;
  operationalBlockId: string | null;
  history: readonly EnrollmentSuspensionHistory[];
}
export interface LifecycleCheck {
  type: string;
  status: string;
  detail: string;
}

export type EnrollmentReactivationMode = 1 | 2 | 3 | 4;
export type ReactivationCheckStatus = 1 | 2 | 3 | 4;
export type ReactivationCheckType =
  | 'SuspensionReasonResolved'
  | 'Contract'
  | 'Documents'
  | 'Funding'
  | 'Credits'
  | 'Pedagogy'
  | 'Instructor'
  | 'Resources'
  | 'Assessment'
  | 'Planning'
  | 'RegulatoryRules';
export interface CreateEnrollmentReactivationCheckRequest {
  type: number;
  status: ReactivationCheckStatus;
  detail: string;
}
export interface CreateEnrollmentReactivationRequest {
  suspensionId: string;
  mode: EnrollmentReactivationMode;
  resumeDate: string;
  conditions: string;
  pedagogyReviewRequested: boolean;
  checks: readonly CreateEnrollmentReactivationCheckRequest[];
}
export interface ReviewEnrollmentReactivationCheckRequest {
  status: ReactivationCheckStatus;
  detail: string;
}

export interface EnrollmentReactivation {
  reactivationId: string;
  suspensionId: string;
  enrollmentId: string;
  mode: string;
  resumeDate: string;
  conditions: string;
  pedagogyReviewRequested: boolean;
  status: string;
  appliedAtUtc: string | null;
  checks: readonly LifecycleCheck[];
}
export interface EnrollmentClosure {
  closureId: string;
  enrollmentId: string;
  reason: string;
  closureDate: string;
  reasonDetail: string;
  status: string;
  closedAtUtc: string | null;
  archivedAtUtc: string | null;
  retainUntil: string | null;
  retentionLegalBasis: string | null;
  retentionScope: number | string;
  reopenedAtUtc: string | null;
  reopenJustification: string | null;
  checks: readonly LifecycleCheck[];
}


export type EnrollmentClosureCheckType =
  | 'FutureSessions'
  | 'FinalInvoices'
  | 'Credits'
  | 'Exams'
  | 'Documents'
  | 'Contract'
  | 'Equipment'
  | 'Disputes'
  | 'DataRetention';
export type EnrollmentClosureCheckStatus = 1 | 2 | 3 | 4;
export interface EnrollmentClosureCheckRequest {
  type: number;
  status: EnrollmentClosureCheckStatus;
  detail: string;
}
export interface CreateEnrollmentClosureRequest {
  enrollmentId: string;
  reason: number;
  closureDate: string;
  reasonDetail: string;
  checks: readonly EnrollmentClosureCheckRequest[];
}
export interface ReviewEnrollmentClosureCheckRequest {
  status: EnrollmentClosureCheckStatus;
  detail: string;
}
export interface ArchiveStudentRequest {
  retainUntil: string;
  retentionLegalBasis: string;
  retentionScope: number;
}
export interface ReopenEnrollmentRequest {
  justification: string;
}

export type EnrollmentSource =
  'DirectBranch' | 'LegacyImport' | 'IncomingTransfer' | 'Partner' | 'ReturningStudent';
export interface StartDirectEnrollmentRequest {
  existingStudentId: string | null;
  branchId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  trainingCode: string;
  source: EnrollmentSource;
  regulatoryCountryCode: string;
  preferredLanguageCode: string;
  requiredConsentsAccepted: boolean;
}
export interface StartDirectEnrollmentResponse {
  studentId: string;
  enrollmentId: string;
  studentReused: boolean;
  idempotentReplay: boolean;
}
export interface StudentBranchOption {
  id: string;
  name: string;
  code: string;
  status: string;
  isPrimary: boolean;
  city: string;
}
export interface StudentBranchOptionsPage {
  items: readonly StudentBranchOption[];
}

export interface CreateExternalTransferRequest {
  targetOrganizationId: string;
  type: number;
  dataScope: number;
  effectiveOn: string;
  temporaryUntil: string | null;
  countryCode: string;
  reason: string;
  responsibilities: string;
}

export interface ExternalTransferFinanceRequest {
  status: number;
  resolution: string | null;
}

export interface ExternalTransferPreconditions {
  relationshipStatus: string;
  targetOrganizationActive: boolean;
  countryRuleSatisfied: boolean;
  sourceCountryCode: string;
  targetCountryCode: string;
  warnings: readonly string[];
}
