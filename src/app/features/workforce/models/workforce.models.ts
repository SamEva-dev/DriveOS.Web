export interface WorkforceHeadcountKpis {
  readonly current: number;
  readonly active: number;
  readonly onboarding: number;
  readonly suspended: number;
  readonly onLeave: number;
  readonly ending: number;
}

export interface WorkforceLeaveKpis {
  readonly pendingApproval: number;
  readonly activeToday: number;
  readonly upcoming: number;
}

export interface WorkforceContractKpis {
  readonly pendingSignature: number;
  readonly expiringSoon: number;
  readonly ending: number;
}

export interface WorkforceComplianceKpis {
  readonly instructorAuthorizationsExpired: number;
  readonly instructorAuthorizationsExpiringSoon: number;
  readonly employeeDocumentsExpired: number;
  readonly employeeDocumentsExpiringSoon: number;
}

export interface WorkforceTimesheetKpis {
  readonly submitted: number;
  readonly underReview: number;
  readonly approvedAwaitingLock: number;
}

export interface WorkforceEquipmentKpis {
  readonly planned: number;
  readonly active: number;
  readonly returnOverdue: number;
  readonly heldByEndedEmployees: number;
}

export interface WorkforceReviewKpis {
  readonly inProgress: number;
  readonly awaitingAcknowledgement: number;
}

export interface WorkforceDashboardAlert {
  readonly kind: string;
  readonly severity: string;
  readonly employeeId: string | null;
  readonly referenceId: string | null;
  readonly dueDate: string | null;
  readonly messageKey: string;
  readonly parameters: Readonly<Record<string, string | null>>;
}

export interface WorkforceDashboard {
  readonly asOfDate: string;
  readonly alertWindowDays: number;
  readonly headcount: WorkforceHeadcountKpis;
  readonly leave: WorkforceLeaveKpis;
  readonly contracts: WorkforceContractKpis;
  readonly compliance: WorkforceComplianceKpis;
  readonly timesheets: WorkforceTimesheetKpis;
  readonly equipment: WorkforceEquipmentKpis;
  readonly reviews: WorkforceReviewKpis;
  readonly alerts: readonly WorkforceDashboardAlert[];
}

export type EmploymentStatus =
  'Draft' | 'Onboarding' | 'Active' | 'Suspended' | 'OnLeave' | 'Ending' | 'Ended';

export interface EmployeeSummary {
  readonly id: string;
  readonly employerOrganizationId: string;
  readonly personId: string;
  readonly userId: string | null;
  readonly employeeNumber: string;
  readonly employmentStartDate: string;
  readonly employmentEndDate: string | null;
  readonly status: EmploymentStatus | string;
  readonly rehiredFromEmployeeId: string | null;
  readonly createdAtUtc: string;
  readonly lastModifiedAtUtc: string | null;
}

export type EmployeeBranchAssignmentStatus = 'Planned' | 'Active' | 'Ended' | 'Cancelled';

export interface EmployeeBranchAssignment {
  readonly id: string;
  readonly branchId: string;
  readonly startDate: string;
  readonly endDate: string | null;
  readonly isPrimary: boolean;
  readonly status: EmployeeBranchAssignmentStatus | string;
  readonly createdAtUtc: string;
  readonly lastModifiedAtUtc: string | null;
}

export type JobPositionStatus = 'Active' | 'Inactive';

export interface JobPosition {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly description: string | null;
  readonly professionalFunction: string;
  readonly status: JobPositionStatus | string;
  readonly createdAtUtc: string;
  readonly lastModifiedAtUtc: string | null;
}

export type EmployeeJobPositionAssignmentStatus = 'Planned' | 'Active' | 'Ended' | 'Cancelled';

export interface EmployeeJobPositionAssignment {
  readonly id: string;
  readonly jobPositionId: string;
  readonly branchId: string | null;
  readonly startDate: string;
  readonly endDate: string | null;
  readonly isPrimary: boolean;
  readonly status: EmployeeJobPositionAssignmentStatus | string;
}

export type WorkforceCredentialStatus =
  'Declared' | 'Verified' | 'Rejected' | 'Expired' | 'Superseded';
export type QualificationSource = 'Manual' | 'Import' | 'ExternalProvider';

export interface EmployeeQualification {
  readonly id: string;
  readonly countryCode: string;
  readonly qualificationType: string;
  readonly title: string;
  readonly identifier: string | null;
  readonly issuingAuthority: string | null;
  readonly issuedOn: string | null;
  readonly expiresOn: string | null;
  readonly source: QualificationSource | string;
  readonly status: WorkforceCredentialStatus | string;
  readonly declaredAtUtc: string;
  readonly verifiedAtUtc: string | null;
  readonly verificationMethod: string | null;
  readonly decisionReason: string | null;
  readonly supersededById: string | null;
}

export interface InstructorAuthorization {
  readonly id: string;
  readonly countryCode: string;
  readonly authorizationType: string;
  readonly identifier: string;
  readonly issuingAuthority: string;
  readonly jurisdictionCode: string | null;
  readonly licenseCategoryCode: string;
  readonly issuedOn: string | null;
  readonly expiresOn: string | null;
  readonly source: QualificationSource | string;
  readonly status: WorkforceCredentialStatus | string;
  readonly declaredAtUtc: string;
  readonly verifiedAtUtc: string | null;
  readonly verificationMethod: string | null;
  readonly decisionReason: string | null;
  readonly supersededById: string | null;
}

export type EmploymentContractStatus =
  | 'Draft'
  | 'PendingSignature'
  | 'Signed'
  | 'Active'
  | 'Suspended'
  | 'Ending'
  | 'Terminated'
  | 'Completed'
  | 'Cancelled';

export type EmploymentContractType =
  | 'Permanent'
  | 'FixedTerm'
  | 'Apprenticeship'
  | 'Professionalization'
  | 'Temporary'
  | 'Internship'
  | 'Other';

export interface EmploymentContract {
  readonly id: string;
  readonly contractType: EmploymentContractType | string;
  readonly startDate: string;
  readonly endDate: string | null;
  readonly contractualWeeklyHours: number | null;
  readonly primaryJobPositionId: string | null;
  readonly status: EmploymentContractStatus | string;
  readonly contractDocumentId: string | null;
  readonly signatureProcessId: string | null;
  readonly createdAtUtc: string;
  readonly lastModifiedAtUtc: string | null;
}

export type LeaveCategory =
  | 'PaidLeave'
  | 'UnpaidLeave'
  | 'SickLeave'
  | 'TrainingLeave'
  | 'ParentalLeave'
  | 'CompensatoryLeave'
  | 'Other';
export type LeavePolicyStatus = 'Active' | 'Inactive';
export interface LeavePolicy {
  readonly id: string;
  readonly countryCode: string;
  readonly code: string;
  readonly name: string;
  readonly category: LeaveCategory | string;
  readonly isPaid: boolean;
  readonly requiresApproval: boolean;
  readonly requiresEvidence: boolean;
  readonly allowHalfDay: boolean;
  readonly minimumNoticeDays: number | null;
  readonly maximumConsecutiveDays: number | null;
  readonly status: LeavePolicyStatus | string;
}
export type LeaveRequestStatus = 'Draft' | 'Submitted' | 'Approved' | 'Rejected' | 'Cancelled';
export type LeaveDayPortion = 'FullDay' | 'Morning' | 'Afternoon';
export interface LeaveRequest {
  readonly id: string;
  readonly employeeId: string;
  readonly leavePolicyId: string;
  readonly policyCode: string;
  readonly countryCode: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly startPortion: LeaveDayPortion | string;
  readonly endPortion: LeaveDayPortion | string;
  readonly reason: string | null;
  readonly evidenceDocumentId: string | null;
  readonly requiresApproval: boolean;
  readonly requiresEvidence: boolean;
  readonly status: LeaveRequestStatus | string;
  readonly submittedAtUtc: string | null;
  readonly decidedAtUtc: string | null;
  readonly decidedByUserId: string | null;
  readonly decisionReason: string | null;
  readonly cancelledAtUtc: string | null;
}

export type WorkingTimePolicyStatus = 'Active' | 'Inactive';
export interface WorkingTimePolicy {
  readonly id: string;
  readonly employeeId: string;
  readonly effectiveFrom: string;
  readonly effectiveTo: string | null;
  readonly contractualWeeklyHours: number;
  readonly contractualDailyHours: number | null;
  readonly maxWorkingDaysPerWeek: number | null;
  readonly status: WorkingTimePolicyStatus | string;
}
export interface WorkingTimeSummary {
  readonly employeeId: string;
  readonly from: string;
  readonly to: string;
  readonly contractualHours: number;
  readonly plannedHours: number;
  readonly actualTeachingHours: number;
  readonly approvedLeaveHours: number;
  readonly varianceToContractHours: number;
}
export type TimesheetStatus =
  'Draft' | 'Submitted' | 'UnderReview' | 'Approved' | 'Rejected' | 'Locked';
export type TimesheetActivityType =
  'Teaching' | 'Exam' | 'Administrative' | 'Travel' | 'Meeting' | 'Training' | 'Leave' | 'Other';
export type TimesheetEntrySource = 'Manual' | 'Scheduling' | 'TrainingDelivery' | 'Leave';
export interface TimesheetEntry {
  readonly id: string;
  readonly date: string;
  readonly activityType: TimesheetActivityType | string;
  readonly hours: number;
  readonly description: string | null;
  readonly source: TimesheetEntrySource | string;
  readonly sourceReference: string | null;
}
export interface Timesheet {
  readonly id: string;
  readonly employeeId: string;
  readonly periodFrom: string;
  readonly periodTo: string;
  readonly status: TimesheetStatus | string;
  readonly totalHours: number;
  readonly submittedAtUtc: string | null;
  readonly submittedByUserId: string | null;
  readonly reviewStartedAtUtc: string | null;
  readonly reviewerUserId: string | null;
  readonly decidedAtUtc: string | null;
  readonly decidedByUserId: string | null;
  readonly decisionReason: string | null;
  readonly lockedAtUtc: string | null;
  readonly lockedByUserId: string | null;
  readonly entries: readonly TimesheetEntry[];
}

export type EquipmentResourceType =
  | 'Vehicle'
  | 'MobilePhone'
  | 'Tablet'
  | 'Computer'
  | 'Badge'
  | 'Keys'
  | 'TrainingEquipment'
  | 'Other';
export type EquipmentAssignmentStatus = 'Planned' | 'Active' | 'Returned' | 'Cancelled';
export type EquipmentCondition = 'Unknown' | 'New' | 'Good' | 'Fair' | 'Damaged' | 'Unusable';
export interface EquipmentAssignment {
  readonly id: string;
  readonly employeeId: string;
  readonly resourceType: EquipmentResourceType | string;
  readonly resourceId: string;
  readonly startDate: string;
  readonly plannedEndDate: string | null;
  readonly returnedOn: string | null;
  readonly status: EquipmentAssignmentStatus | string;
  readonly handoverCondition: EquipmentCondition | string;
  readonly handoverNotes: string | null;
  readonly handedOverAtUtc: string | null;
  readonly handedOverByUserId: string | null;
  readonly returnCondition: EquipmentCondition | string;
  readonly returnNotes: string | null;
  readonly returnedAtUtc: string | null;
  readonly returnedByUserId: string | null;
  readonly cancellationReason: string | null;
}

export type PerformanceReviewStatus =
  'Draft' | 'InProgress' | 'Submitted' | 'Acknowledged' | 'Completed' | 'Cancelled';
export interface PerformanceReviewCriterion {
  readonly id: string;
  readonly code: string;
  readonly label: string;
  readonly weight: number;
  readonly rating: number | null;
  readonly comment: string | null;
}
export interface PerformanceReview {
  readonly id: string;
  readonly employeeId: string;
  readonly evaluatorUserId: string;
  readonly periodFrom: string;
  readonly periodTo: string;
  readonly title: string;
  readonly status: PerformanceReviewStatus | string;
  readonly overallAssessment: string | null;
  readonly objectives: string | null;
  readonly submittedAtUtc: string | null;
  readonly acknowledgedAtUtc: string | null;
  readonly acknowledgedByUserId: string | null;
  readonly employeeComment: string | null;
  readonly completedAtUtc: string | null;
  readonly cancellationReason: string | null;
  readonly criteria: readonly PerformanceReviewCriterion[];
}

export type EmployeeDocumentCategory =
  | 'Identity'
  | 'Employment'
  | 'Qualification'
  | 'RegulatoryAuthorization'
  | 'LeaveEvidence'
  | 'OccupationalHealth'
  | 'Payroll'
  | 'Administrative'
  | 'Other';
export type EmployeeDocumentConfidentiality = 'Internal' | 'Confidential' | 'Restricted';
export type EmployeeDocumentStatus =
  'Registered' | 'Verified' | 'Superseded' | 'Revoked' | 'Archived';
export interface EmployeeDocument {
  readonly id: string;
  readonly employeeId: string;
  readonly documentReferenceId: string | null;
  readonly category: EmployeeDocumentCategory | string;
  readonly documentTypeCode: string;
  readonly title: string;
  readonly confidentiality: EmployeeDocumentConfidentiality | string;
  readonly issuedOn: string | null;
  readonly validFrom: string | null;
  readonly expiresOn: string | null;
  readonly isExpired: boolean;
  readonly issuer: string | null;
  readonly referenceNumber: string | null;
  readonly status: EmployeeDocumentStatus | string;
  readonly verifiedAtUtc: string | null;
  readonly verifiedByUserId: string | null;
  readonly revocationReason: string | null;
  readonly supersededByEmployeeDocumentId: string | null;
}

export type ProfessionalRestrictionActivity =
  'AllProfessionalDuties' | 'Teaching' | 'ExamDuties' | 'VehicleOperation';
export type ProfessionalRestrictionStatus = 'Planned' | 'Active' | 'Lifted' | 'Cancelled';
export type ProfessionalRestrictionSource =
  | 'InternalDecision'
  | 'RegulatoryAuthority'
  | 'OccupationalHealth'
  | 'QualificationIssue'
  | 'Other';
export interface ProfessionalRestriction {
  readonly id: string;
  readonly employeeId: string;
  readonly activity: ProfessionalRestrictionActivity | string;
  readonly source: ProfessionalRestrictionSource | string;
  readonly startDate: string;
  readonly endDate: string | null;
  readonly reason: string;
  readonly countryCode: string | null;
  readonly licenseCategoryCode: string | null;
  readonly branchId: string | null;
  readonly supportingDocumentReferenceId: string | null;
  readonly status: ProfessionalRestrictionStatus | string;
  readonly activatedAtUtc: string | null;
  readonly liftedAtUtc: string | null;
  readonly liftReason: string | null;
  readonly cancellationReason: string | null;
}

export type OffboardingStatus = 'InProgress' | 'ReadyToComplete' | 'Completed' | 'Cancelled';
export type OffboardingChecklistItemStatus = 'Pending' | 'Completed' | 'Waived';
export type OffboardingChecklistItemKind =
  | 'FutureSchedulingReviewed'
  | 'BranchAssignmentsClosed'
  | 'JobPositionsClosed'
  | 'EmploymentContractsClosed'
  | 'EquipmentReturned'
  | 'TimesheetsFinalized'
  | 'ProfessionalRestrictionsReviewed'
  | 'AccessRevocationPrepared'
  | 'EmployeeDocumentsReviewed';

export interface OffboardingChecklistItem {
  readonly id: string;
  readonly kind: OffboardingChecklistItemKind | string;
  readonly isAutomatic: boolean;
  readonly status: OffboardingChecklistItemStatus | string;
  readonly blockerCount: number;
  readonly note: string | null;
  readonly resolvedAtUtc: string | null;
  readonly resolvedByUserId: string | null;
  readonly waiverReason: string | null;
  readonly lastEvaluatedAtUtc: string | null;
}

export interface OffboardingProcess {
  readonly id: string;
  readonly employeeId: string;
  readonly plannedEndDate: string;
  readonly reason: string;
  readonly status: OffboardingStatus | string;
  readonly completedAtUtc: string | null;
  readonly completedByUserId: string | null;
  readonly items: readonly OffboardingChecklistItem[];
}

export interface WorkforceAnalyticsHeadcount {
  readonly headcountAtStart: number;
  readonly headcountAtEnd: number;
  readonly hires: number;
  readonly rehires: number;
  readonly exits: number;
  readonly turnoverRatePercent: number;
  readonly averageTenureDaysAtEnd: number;
}

export interface WorkforceAnalyticsAbsence {
  readonly approvedRequests: number;
  readonly approvedCalendarDayEquivalents: number;
  readonly employeesWithApprovedLeave: number;
  readonly absenceRatePercent: number;
}

export interface WorkforceAnalyticsWorkingTime {
  readonly contractualHours: number;
  readonly validatedTimesheetHours: number;
  readonly teachingHours: number;
  readonly examHours: number;
  readonly administrativeHours: number;
  readonly travelHours: number;
  readonly meetingHours: number;
  readonly trainingHours: number;
  readonly leaveHours: number;
  readonly otherHours: number;
  readonly validatedToContractPercent: number;
}

export interface WorkforceAnalyticsCompliance {
  readonly currentInstructorEmployees: number;
  readonly withVerifiedCurrentTeachingAuthorization: number;
  readonly teachingAuthorizationCoveragePercent: number;
  readonly expiredTeachingAuthorizations: number;
  readonly activeProfessionalRestrictions: number;
}

export interface WorkforceAnalyticsContracts {
  readonly started: number;
  readonly ended: number;
  readonly activeAtEnd: number;
  readonly fixedTermActiveAtEnd: number;
  readonly pendingSignatureAtEnd: number;
}

export interface WorkforceAnalyticsTimesheets {
  readonly total: number;
  readonly locked: number;
  readonly approved: number;
  readonly rejected: number;
  readonly pendingReview: number;
  readonly lockRatePercent: number;
}

export interface WorkforceAnalyticsMonthlyPoint {
  readonly year: number;
  readonly month: number;
  readonly hires: number;
  readonly exits: number;
  readonly approvedLeaveDayEquivalents: number;
  readonly validatedTimesheetHours: number;
}

export interface WorkforceAnalyticsBreakdown {
  readonly key: string;
  readonly label: string;
  readonly value: number;
}

export interface WorkforceAnalytics {
  readonly from: string;
  readonly to: string;
  readonly headcount: WorkforceAnalyticsHeadcount;
  readonly absence: WorkforceAnalyticsAbsence;
  readonly workingTime: WorkforceAnalyticsWorkingTime;
  readonly compliance: WorkforceAnalyticsCompliance;
  readonly contracts: WorkforceAnalyticsContracts;
  readonly timesheets: WorkforceAnalyticsTimesheets;
  readonly monthlyTrend: readonly WorkforceAnalyticsMonthlyPoint[];
  readonly currentHeadcountByProfessionalFunction: readonly WorkforceAnalyticsBreakdown[];
  readonly metricDefinitions: Readonly<Record<string, string>>;
}
