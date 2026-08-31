import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { catchError, forkJoin, of, switchMap, throwError } from 'rxjs';

import { AuthorizationService } from '../../../../core/auth/authorization.service';
import { ApiErrorService } from '../../../../core/errors/api-error.service';
import { DriveOsButtonComponent } from '../../../../shared/ui/button/driveos-button.component';
import { DriveOsDrawerComponent } from '../../../../shared/ui/drawer/driveos-drawer.component';
import { DriveOsFormAlertComponent } from '../../../../shared/ui/form-alert/driveos-form-alert.component';
import { DriveOsSpinnerComponent } from '../../../../shared/ui/spinner/driveos-spinner.component';
import {
  DriveOsStatusBadgeComponent,
  DriveOsStatusTone,
} from '../../../../shared/ui/status-badge/driveos-status-badge.component';
import { BranchesApiService } from '../../../organizations/branches/data-access/branches-api.service';
import { BranchListItem } from '../../../organizations/branches/models/branch-list-item';
import { WorkforceApiService } from '../../data-access/workforce-api.service';
import { WORKFORCE_PERMISSIONS } from '../../domain/workforce-permissions';
import {
  EmployeeBranchAssignment,
  EmployeeJobPositionAssignment,
  EmployeeQualification,
  EmployeeSummary,
  EmploymentContract,
  EmploymentContractType,
  InstructorAuthorization,
  JobPosition,
  LeaveCategory,
  LeaveDayPortion,
  LeavePolicy,
  LeaveRequest,
  QualificationSource,
  Timesheet,
  TimesheetActivityType,
  TimesheetEntry,
  TimesheetEntrySource,
  EquipmentAssignment,
  EquipmentCondition,
  EquipmentResourceType,
  PerformanceReview,
  PerformanceReviewCriterion,
  EmployeeDocument,
  EmployeeDocumentCategory,
  EmployeeDocumentConfidentiality,
  ProfessionalRestriction,
  ProfessionalRestrictionActivity,
  ProfessionalRestrictionSource,
  OffboardingChecklistItem,
  OffboardingProcess,
  WorkingTimePolicy,
  WorkingTimeSummary,
} from '../../models/workforce.models';

interface EmployeeTab {
  readonly key: string;
  readonly icon: string;
}

type EmployeeLifecycleDrawerKind =
  'onboarding' | 'activate' | 'suspend' | 'reactivate' | 'termination';
type EmployeeDrawerKind =
  | 'identity'
  | 'leaveRequestCreate'
  | 'leaveRequestEdit'
  | 'leaveRequestSubmit'
  | 'leaveRequestApprove'
  | 'leaveRequestReject'
  | 'leaveRequestCancel'
  | 'leavePolicyCreate'
  | 'leavePolicyEdit'
  | 'leavePolicyDeactivate'
  | 'leavePolicyReactivate'
  | EmployeeLifecycleDrawerKind
  | 'branchCreate'
  | 'branchEdit'
  | 'branchEnd'
  | 'branchCancel'
  | 'positionCreate'
  | 'positionEdit'
  | 'positionEnd'
  | 'positionCancel'
  | 'qualificationDeclare'
  | 'qualificationVerify'
  | 'qualificationReject'
  | 'authorizationDeclare'
  | 'authorizationVerify'
  | 'authorizationReject'
  | 'contractCreate'
  | 'contractEdit'
  | 'contractDocument'
  | 'contractSigned'
  | 'contractActivate'
  | 'contractTerminate'
  | 'contractCancel'
  | 'workingTimeCreate'
  | 'workingTimeEdit'
  | 'workingTimeDeactivate'
  | 'timesheetCreate'
  | 'timesheetEntryCreate'
  | 'timesheetEntryEdit'
  | 'timesheetEntryRemove'
  | 'timesheetSubmit'
  | 'timesheetReview'
  | 'timesheetApprove'
  | 'timesheetReject'
  | 'timesheetLock'
  | 'equipmentCreate'
  | 'equipmentEdit'
  | 'equipmentHandover'
  | 'equipmentReturn'
  | 'equipmentCancel'
  | 'reviewCreate'
  | 'reviewStart'
  | 'reviewCriterionAdd'
  | 'reviewCriterionRate'
  | 'reviewSummary'
  | 'reviewSubmit'
  | 'reviewAcknowledge'
  | 'reviewComplete'
  | 'reviewCancel'
  | 'documentCreate'
  | 'documentEdit'
  | 'documentVerify'
  | 'documentReveal'
  | 'documentSupersede'
  | 'documentRevoke'
  | 'documentArchive'
  | 'restrictionCreate'
  | 'restrictionEdit'
  | 'restrictionActivate'
  | 'restrictionLift'
  | 'restrictionCancel'
  | 'offboardingRefresh'
  | 'offboardingCompleteItem'
  | 'offboardingWaiveItem'
  | 'offboardingComplete'
  | 'rehire'
  | null;

@Component({
  selector: 'driveos-employee-detail-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    TranslatePipe,
    DriveOsButtonComponent,
    DriveOsDrawerComponent,
    DriveOsFormAlertComponent,
    DriveOsSpinnerComponent,
    DriveOsStatusBadgeComponent,
  ],
  templateUrl: './employee-detail.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(WorkforceApiService);
  private readonly apiErrors = inject(ApiErrorService);
  private readonly branchesApi = inject(BranchesApiService);
  private readonly authorization = inject(AuthorizationService);
  private readonly fb = inject(FormBuilder);
  private readonly translate = inject(TranslateService);

  readonly employeeId = this.route.snapshot.paramMap.get('employeeId') ?? '';
  readonly employee = signal<EmployeeSummary | null>(null);
  readonly history = signal<readonly EmployeeSummary[]>([]);
  readonly branchAssignments = signal<readonly EmployeeBranchAssignment[]>([]);
  readonly branches = signal<readonly BranchListItem[]>([]);
  readonly selectedBranchAssignment = signal<EmployeeBranchAssignment | null>(null);
  readonly jobPositions = signal<readonly JobPosition[]>([]);
  readonly jobPositionAssignments = signal<readonly EmployeeJobPositionAssignment[]>([]);
  readonly selectedJobPositionAssignment = signal<EmployeeJobPositionAssignment | null>(null);
  readonly qualifications = signal<readonly EmployeeQualification[]>([]);
  readonly leaveRequests = signal<readonly LeaveRequest[]>([]);
  readonly leavePolicies = signal<readonly LeavePolicy[]>([]);
  readonly leaveView = signal<'requests' | 'policies'>('requests');
  readonly selectedLeaveRequest = signal<LeaveRequest | null>(null);
  readonly selectedLeavePolicy = signal<LeavePolicy | null>(null);
  readonly timeView = signal<'summary' | 'timesheets'>('summary');
  readonly workingTimePolicies = signal<readonly WorkingTimePolicy[]>([]);
  readonly workingTimeSummary = signal<WorkingTimeSummary | null>(null);
  readonly summaryLoading = signal(false);
  readonly selectedWorkingTimePolicy = signal<WorkingTimePolicy | null>(null);
  readonly timesheets = signal<readonly Timesheet[]>([]);
  readonly selectedTimesheet = signal<Timesheet | null>(null);
  readonly selectedTimesheetEntry = signal<TimesheetEntry | null>(null);
  readonly timesheetActivityTypes: readonly TimesheetActivityType[] = [
    'Teaching',
    'Exam',
    'Administrative',
    'Travel',
    'Meeting',
    'Training',
    'Leave',
    'Other',
  ];
  readonly timesheetEntrySources: readonly TimesheetEntrySource[] = [
    'Manual',
    'Scheduling',
    'TrainingDelivery',
    'Leave',
  ];
  readonly equipmentAssignments = signal<readonly EquipmentAssignment[]>([]);
  readonly selectedEquipmentAssignment = signal<EquipmentAssignment | null>(null);
  readonly equipmentResourceTypes: readonly EquipmentResourceType[] = [
    'Vehicle',
    'MobilePhone',
    'Tablet',
    'Computer',
    'Badge',
    'Keys',
    'TrainingEquipment',
    'Other',
  ];
  readonly equipmentConditions: readonly EquipmentCondition[] = [
    'Unknown',
    'New',
    'Good',
    'Fair',
    'Damaged',
    'Unusable',
  ];
  readonly performanceReviews = signal<readonly PerformanceReview[]>([]);
  readonly employeeDocuments = signal<readonly EmployeeDocument[]>([]);
  readonly professionalRestrictions = signal<readonly ProfessionalRestriction[]>([]);
  readonly selectedProfessionalRestriction = signal<ProfessionalRestriction | null>(null);
  readonly offboarding = signal<OffboardingProcess | null>(null);
  readonly selectedOffboardingItem = signal<OffboardingChecklistItem | null>(null);
  readonly restrictionActivities: readonly ProfessionalRestrictionActivity[] = [
    'AllProfessionalDuties',
    'Teaching',
    'ExamDuties',
    'VehicleOperation',
  ];
  readonly restrictionSources: readonly ProfessionalRestrictionSource[] = [
    'InternalDecision',
    'RegulatoryAuthority',
    'OccupationalHealth',
    'QualificationIssue',
    'Other',
  ];
  readonly selectedEmployeeDocument = signal<EmployeeDocument | null>(null);
  readonly documentCategories: readonly EmployeeDocumentCategory[] = [
    'Identity',
    'Employment',
    'Qualification',
    'RegulatoryAuthorization',
    'LeaveEvidence',
    'OccupationalHealth',
    'Payroll',
    'Administrative',
    'Other',
  ];
  readonly documentConfidentialities: readonly EmployeeDocumentConfidentiality[] = [
    'Internal',
    'Confidential',
    'Restricted',
  ];
  readonly selectedPerformanceReview = signal<PerformanceReview | null>(null);
  readonly selectedPerformanceReviewCriterion = signal<PerformanceReviewCriterion | null>(null);
  readonly instructorAuthorizations = signal<readonly InstructorAuthorization[]>([]);
  readonly qualificationView = signal<'qualifications' | 'authorizations'>('qualifications');
  readonly selectedQualification = signal<EmployeeQualification | null>(null);
  readonly selectedInstructorAuthorization = signal<InstructorAuthorization | null>(null);
  readonly employmentContracts = signal<readonly EmploymentContract[]>([]);
  readonly selectedEmploymentContract = signal<EmploymentContract | null>(null);
  readonly employmentContractTypes: readonly EmploymentContractType[] = [
    'Permanent',
    'FixedTerm',
    'Apprenticeship',
    'Professionalization',
    'Temporary',
    'Internship',
    'Other',
  ];
  readonly qualificationSources: readonly QualificationSource[] = [
    'Manual',
    'Import',
    'ExternalProvider',
  ];
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly errors = signal<readonly string[]>([]);
  readonly actionErrors = signal<readonly string[]>([]);
  readonly activeTab = signal('overview');
  readonly drawer = signal<EmployeeDrawerKind>(null);

  readonly identityForm = this.fb.nonNullable.group({
    employeeNumber: ['', [Validators.required, Validators.maxLength(64)]],
    userId: [''],
    employmentStartDate: ['', Validators.required],
    employmentEndDate: [''],
  });

  readonly suspendForm = this.fb.nonNullable.group({
    reason: ['', [Validators.required, Validators.maxLength(1000)]],
  });

  readonly branchAssignmentForm = this.fb.nonNullable.group({
    branchId: ['', Validators.required],
    startDate: ['', Validators.required],
    endDate: [''],
    isPrimary: [false],
  });

  readonly branchEndForm = this.fb.nonNullable.group({
    endDate: ['', Validators.required],
  });

  readonly jobPositionAssignmentForm = this.fb.nonNullable.group({
    jobPositionId: ['', Validators.required],
    branchId: [''],
    startDate: ['', Validators.required],
    endDate: [''],
    isPrimary: [false],
  });

  readonly jobPositionEndForm = this.fb.nonNullable.group({
    endDate: ['', Validators.required],
  });

  readonly qualificationForm = this.fb.nonNullable.group({
    countryCode: ['FR', [Validators.required, Validators.minLength(2), Validators.maxLength(2)]],
    qualificationType: [
      '',
      [Validators.required, Validators.minLength(2), Validators.maxLength(64)],
    ],
    title: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(160)]],
    identifier: ['', Validators.maxLength(120)],
    issuingAuthority: ['', Validators.maxLength(160)],
    issuedOn: [''],
    expiresOn: [''],
    source: ['Manual' as QualificationSource, Validators.required],
  });

  readonly instructorAuthorizationForm = this.fb.nonNullable.group({
    countryCode: ['FR', [Validators.required, Validators.minLength(2), Validators.maxLength(2)]],
    authorizationType: [
      'TEACHING_AUTHORIZATION',
      [Validators.required, Validators.minLength(2), Validators.maxLength(64)],
    ],
    identifier: ['', [Validators.required, Validators.maxLength(120)]],
    issuingAuthority: ['', [Validators.required, Validators.maxLength(160)]],
    jurisdictionCode: ['', Validators.maxLength(64)],
    licenseCategoryCode: ['B', [Validators.required, Validators.maxLength(32)]],
    issuedOn: [''],
    expiresOn: [''],
    source: ['Manual' as QualificationSource, Validators.required],
  });

  readonly verificationForm = this.fb.nonNullable.group({
    verificationMethod: ['', [Validators.required, Validators.maxLength(160)]],
    reason: ['', Validators.maxLength(500)],
  });

  readonly rejectionForm = this.fb.nonNullable.group({
    reason: ['', [Validators.required, Validators.maxLength(500)]],
  });

  readonly employmentContractForm = this.fb.group({
    contractType: this.fb.nonNullable.control<EmploymentContractType>(
      'Permanent',
      Validators.required,
    ),
    startDate: this.fb.nonNullable.control('', Validators.required),
    endDate: this.fb.nonNullable.control(''),
    contractualWeeklyHours: this.fb.control<number | null>(35, [
      Validators.min(0.01),
      Validators.max(168),
    ]),
    primaryJobPositionId: this.fb.nonNullable.control(''),
  });

  readonly employmentContractDocumentForm = this.fb.nonNullable.group({
    contractDocumentId: ['', Validators.required],
    signatureProcessId: [''],
  });

  readonly employmentContractSignedForm = this.fb.nonNullable.group({
    signatureProcessId: ['', Validators.required],
  });

  readonly employmentContractActivationForm = this.fb.nonNullable.group({
    activationDate: ['', Validators.required],
  });

  readonly employmentContractTerminationForm = this.fb.nonNullable.group({
    endDate: ['', Validators.required],
  });

  readonly leaveRequestForm = this.fb.nonNullable.group({
    leavePolicyId: ['', Validators.required],
    startDate: ['', Validators.required],
    endDate: ['', Validators.required],
    startPortion: ['FullDay' as LeaveDayPortion, Validators.required],
    endPortion: ['FullDay' as LeaveDayPortion, Validators.required],
    reason: ['', Validators.maxLength(1000)],
    evidenceDocumentId: [''],
  });
  readonly leaveDecisionForm = this.fb.nonNullable.group({
    reason: ['', Validators.maxLength(1000)],
  });
  readonly leaveRejectForm = this.fb.nonNullable.group({
    reason: ['', [Validators.required, Validators.maxLength(1000)]],
  });
  readonly leavePolicyForm = this.fb.nonNullable.group({
    countryCode: ['FR', [Validators.required, Validators.minLength(2), Validators.maxLength(2)]],
    code: ['', [Validators.required, Validators.maxLength(64)]],
    name: ['', [Validators.required, Validators.maxLength(160)]],
    category: ['PaidLeave' as LeaveCategory, Validators.required],
    isPaid: [true],
    requiresApproval: [true],
    requiresEvidence: [false],
    allowHalfDay: [true],
    minimumNoticeDays: [0, Validators.min(0)],
    maximumConsecutiveDays: [null as number | null, Validators.min(1)],
  });

  readonly workingTimeSummaryForm = this.fb.nonNullable.group({
    from: [this.daysAgo(30), Validators.required],
    to: [this.today(), Validators.required],
  });
  readonly workingTimePolicyForm = this.fb.nonNullable.group({
    effectiveFrom: [this.today(), Validators.required],
    effectiveTo: [''],
    contractualWeeklyHours: [35, [Validators.required, Validators.min(0.01), Validators.max(168)]],
    contractualDailyHours: [7 as number | null, [Validators.min(0.01), Validators.max(24)]],
    maxWorkingDaysPerWeek: [5 as number | null, [Validators.min(1), Validators.max(7)]],
  });
  readonly timesheetForm = this.fb.nonNullable.group({
    periodFrom: [this.daysAgo(6), Validators.required],
    periodTo: [this.today(), Validators.required],
  });
  readonly timesheetEntryForm = this.fb.nonNullable.group({
    date: [this.today(), Validators.required],
    activityType: ['Teaching' as TimesheetActivityType, Validators.required],
    hours: [1, [Validators.required, Validators.min(0.01), Validators.max(24)]],
    description: ['', Validators.maxLength(512)],
    source: ['Manual' as TimesheetEntrySource, Validators.required],
    sourceReference: ['', Validators.maxLength(128)],
  });
  readonly timesheetDecisionForm = this.fb.nonNullable.group({
    reason: ['', Validators.maxLength(1000)],
  });
  readonly equipmentAssignmentForm = this.fb.nonNullable.group({
    resourceType: ['Computer' as EquipmentResourceType, Validators.required],
    resourceId: ['', [Validators.required, Validators.pattern(/^[0-9a-fA-F-]{36}$/)]],
    startDate: [this.today(), Validators.required],
    plannedEndDate: [''],
  });
  readonly equipmentConditionForm = this.fb.nonNullable.group({
    condition: ['Good' as EquipmentCondition, Validators.required],
    notes: ['', Validators.maxLength(1000)],
  });
  readonly equipmentReturnForm = this.fb.nonNullable.group({
    returnedOn: [this.today(), Validators.required],
    condition: ['Good' as EquipmentCondition, Validators.required],
    notes: ['', Validators.maxLength(1000)],
  });
  readonly equipmentCancelForm = this.fb.nonNullable.group({
    reason: ['', [Validators.required, Validators.maxLength(512)]],
  });
  readonly performanceReviewForm = this.fb.nonNullable.group({
    evaluatorUserId: ['', [Validators.required, Validators.pattern(/^[0-9a-fA-F-]{36}$/)]],
    periodFrom: [this.daysAgo(365), Validators.required],
    periodTo: [this.today(), Validators.required],
    title: ['', [Validators.required, Validators.maxLength(160)]],
  });
  readonly performanceReviewCriterionForm = this.fb.nonNullable.group({
    code: ['', [Validators.required, Validators.maxLength(64)]],
    label: ['', [Validators.required, Validators.maxLength(256)]],
    weight: [20, [Validators.required, Validators.min(1), Validators.max(100)]],
    comment: ['', Validators.maxLength(2000)],
  });
  readonly performanceReviewRatingForm = this.fb.nonNullable.group({
    rating: [3, [Validators.required, Validators.min(1), Validators.max(5)]],
    comment: ['', Validators.maxLength(2000)],
  });
  readonly performanceReviewSummaryForm = this.fb.nonNullable.group({
    overallAssessment: ['', [Validators.required, Validators.maxLength(4000)]],
    objectives: ['', Validators.maxLength(4000)],
  });
  readonly performanceReviewAcknowledgeForm = this.fb.nonNullable.group({
    employeeComment: ['', Validators.maxLength(4000)],
  });
  readonly performanceReviewCancelForm = this.fb.nonNullable.group({
    reason: ['', [Validators.required, Validators.maxLength(512)]],
  });
  readonly employeeDocumentForm = this.fb.nonNullable.group({
    documentReferenceId: ['', Validators.pattern(/^[0-9a-fA-F-]{36}$/)],
    category: ['Employment' as EmployeeDocumentCategory, Validators.required],
    documentTypeCode: ['', [Validators.required, Validators.maxLength(80)]],
    title: ['', [Validators.required, Validators.maxLength(256)]],
    confidentiality: ['Internal' as EmployeeDocumentConfidentiality, Validators.required],
    issuedOn: [''],
    validFrom: [''],
    expiresOn: [''],
    issuer: ['', Validators.maxLength(256)],
    referenceNumber: ['', Validators.maxLength(128)],
  });
  readonly employeeDocumentSupersedeForm = this.fb.nonNullable.group({
    replacementEmployeeDocumentId: [
      '',
      [Validators.required, Validators.pattern(/^[0-9a-fA-F-]{36}$/)],
    ],
  });
  readonly employeeDocumentRevokeForm = this.fb.nonNullable.group({
    reason: ['', [Validators.required, Validators.maxLength(512)]],
  });
  readonly professionalRestrictionForm = this.fb.nonNullable.group({
    activity: ['Teaching' as ProfessionalRestrictionActivity, Validators.required],
    source: ['InternalDecision' as ProfessionalRestrictionSource, Validators.required],
    startDate: [this.today(), Validators.required],
    endDate: [''],
    reason: ['', [Validators.required, Validators.maxLength(1000)]],
    countryCode: ['FR', Validators.maxLength(8)],
    licenseCategoryCode: ['', Validators.maxLength(32)],
    branchId: [''],
    supportingDocumentReferenceId: ['', Validators.pattern(/^[0-9a-fA-F-]{36}$/)],
  });
  readonly professionalRestrictionReasonForm = this.fb.nonNullable.group({
    reason: ['', [Validators.required, Validators.maxLength(1000)]],
  });

  readonly timesheetRejectForm = this.fb.nonNullable.group({
    reason: ['', [Validators.required, Validators.maxLength(1000)]],
  });

  readonly terminationForm = this.fb.nonNullable.group({
    plannedEndDate: ['', Validators.required],
    reason: ['', [Validators.required, Validators.maxLength(1000)]],
  });
  readonly offboardingItemForm = this.fb.nonNullable.group({
    note: ['', Validators.maxLength(1000)],
  });

  readonly offboardingWaiverForm = this.fb.nonNullable.group({
    reason: ['', [Validators.required, Validators.maxLength(1000)]],
  });

  readonly offboardingCompletionForm = this.fb.nonNullable.group({
    reason: ['', [Validators.required, Validators.maxLength(1000)]],
  });

  readonly rehireForm = this.fb.nonNullable.group({
    employeeNumber: ['', [Validators.required, Validators.maxLength(64)]],
    employmentStartDate: [this.today(), Validators.required],
    employmentEndDate: [''],
    reusePreviousUserLink: [true],
    userId: [''],
  });

  readonly tabs: readonly EmployeeTab[] = [
    { key: 'overview', icon: 'ph ph-squares-four' },
    { key: 'branches', icon: 'ph ph-buildings' },
    { key: 'positions', icon: 'ph ph-briefcase' },
    { key: 'qualifications', icon: 'ph ph-certificate' },
    { key: 'contracts', icon: 'ph ph-file-text' },
    { key: 'leave', icon: 'ph ph-calendar-x' },
    { key: 'time', icon: 'ph ph-clock' },
    { key: 'equipment', icon: 'ph ph-device-mobile' },
    { key: 'reviews', icon: 'ph ph-chart-line-up' },
    { key: 'documents', icon: 'ph ph-folder-open' },
    { key: 'restrictions', icon: 'ph ph-shield-warning' },
    { key: 'offboarding', icon: 'ph ph-sign-out' },
  ];

  readonly canEditIdentity = computed(() =>
    this.authorization.hasPermission(WORKFORCE_PERMISSIONS.employees.update),
  );
  readonly canOnboard = computed(() =>
    this.authorization.hasPermission(WORKFORCE_PERMISSIONS.employees.onboard),
  );
  readonly canActivate = computed(() =>
    this.authorization.hasPermission(WORKFORCE_PERMISSIONS.employees.activate),
  );
  readonly canSuspend = computed(() =>
    this.authorization.hasPermission(WORKFORCE_PERMISSIONS.employees.suspend),
  );
  readonly canReactivate = computed(() =>
    this.authorization.hasPermission(WORKFORCE_PERMISSIONS.employees.reactivate),
  );
  readonly canTerminate = computed(() =>
    this.authorization.hasPermission(WORKFORCE_PERMISSIONS.employees.terminate),
  );
  readonly canRehire = computed(() =>
    this.authorization.hasPermission(WORKFORCE_PERMISSIONS.employees.rehire),
  );
  readonly canReadBranchAssignments = computed(() =>
    this.authorization.hasPermission(WORKFORCE_PERMISSIONS.branchAssignments.read),
  );
  readonly canManageBranchAssignments = computed(() =>
    this.authorization.hasPermission(WORKFORCE_PERMISSIONS.branchAssignments.manage),
  );
  readonly canReadJobPositions = computed(() =>
    this.authorization.hasPermission(WORKFORCE_PERMISSIONS.jobPositions.read),
  );
  readonly canAssignJobPositions = computed(() =>
    this.authorization.hasPermission(WORKFORCE_PERMISSIONS.jobPositions.assign),
  );
  readonly canReadQualifications = computed(() =>
    this.authorization.hasPermission(WORKFORCE_PERMISSIONS.qualifications.read),
  );
  readonly canManageQualifications = computed(() =>
    this.authorization.hasPermission(WORKFORCE_PERMISSIONS.qualifications.manage),
  );
  readonly canVerifyQualifications = computed(() =>
    this.authorization.hasPermission(WORKFORCE_PERMISSIONS.qualifications.verify),
  );
  readonly canReadInstructorAuthorizations = computed(() =>
    this.authorization.hasPermission(WORKFORCE_PERMISSIONS.instructorAuthorizations.read),
  );
  readonly canManageInstructorAuthorizations = computed(() =>
    this.authorization.hasPermission(WORKFORCE_PERMISSIONS.instructorAuthorizations.manage),
  );
  readonly canVerifyInstructorAuthorizations = computed(() =>
    this.authorization.hasPermission(WORKFORCE_PERMISSIONS.instructorAuthorizations.verify),
  );
  readonly canReadLeavePolicies = computed(() =>
    this.authorization.hasPermission(WORKFORCE_PERMISSIONS.leavePolicies.read),
  );
  readonly canManageLeavePolicies = computed(() =>
    this.authorization.hasPermission(WORKFORCE_PERMISSIONS.leavePolicies.manage),
  );
  readonly canReadLeaveRequests = computed(() =>
    this.authorization.hasPermission(WORKFORCE_PERMISSIONS.leaveRequests.read),
  );
  readonly canManageLeaveRequests = computed(() =>
    this.authorization.hasPermission(WORKFORCE_PERMISSIONS.leaveRequests.manage),
  );
  readonly canSubmitLeaveRequests = computed(() =>
    this.authorization.hasPermission(WORKFORCE_PERMISSIONS.leaveRequests.submit),
  );
  readonly canApproveLeaveRequests = computed(() =>
    this.authorization.hasPermission(WORKFORCE_PERMISSIONS.leaveRequests.approve),
  );
  readonly canReadEmploymentContracts = computed(() =>
    this.authorization.hasPermission(WORKFORCE_PERMISSIONS.employmentContracts.read),
  );
  readonly canManageEmploymentContracts = computed(() =>
    this.authorization.hasPermission(WORKFORCE_PERMISSIONS.employmentContracts.manage),
  );
  readonly canSignEmploymentContracts = computed(() =>
    this.authorization.hasPermission(WORKFORCE_PERMISSIONS.employmentContracts.sign),
  );
  readonly canReadEquipmentAssignments = computed(() =>
    this.authorization.hasPermission(WORKFORCE_PERMISSIONS.equipmentAssignments.read),
  );
  readonly canManageEquipmentAssignments = computed(() =>
    this.authorization.hasPermission(WORKFORCE_PERMISSIONS.equipmentAssignments.manage),
  );
  readonly canReadPerformanceReviews = computed(() =>
    this.authorization.hasPermission(WORKFORCE_PERMISSIONS.performanceReviews.read),
  );
  readonly canManagePerformanceReviews = computed(() =>
    this.authorization.hasPermission(WORKFORCE_PERMISSIONS.performanceReviews.manage),
  );
  readonly canAcknowledgePerformanceReviews = computed(() =>
    this.authorization.hasPermission(WORKFORCE_PERMISSIONS.performanceReviews.acknowledge),
  );
  readonly canValidatePerformanceReviews = computed(() =>
    this.authorization.hasPermission(WORKFORCE_PERMISSIONS.performanceReviews.validate),
  );
  readonly canReadEmployeeDocuments = computed(() =>
    this.authorization.hasPermission(WORKFORCE_PERMISSIONS.employeeDocuments.read),
  );
  readonly canManageEmployeeDocuments = computed(() =>
    this.authorization.hasPermission(WORKFORCE_PERMISSIONS.employeeDocuments.manage),
  );
  readonly canVerifyEmployeeDocuments = computed(() =>
    this.authorization.hasPermission(WORKFORCE_PERMISSIONS.employeeDocuments.verify),
  );
  readonly canReadConfidentialEmployeeDocuments = computed(() =>
    this.authorization.hasPermission(WORKFORCE_PERMISSIONS.employeeDocuments.confidentialRead),
  );
  readonly canReadProfessionalRestrictions = computed(() =>
    this.authorization.hasPermission(WORKFORCE_PERMISSIONS.professionalRestrictions.read),
  );
  readonly canManageProfessionalRestrictions = computed(() =>
    this.authorization.hasPermission(WORKFORCE_PERMISSIONS.professionalRestrictions.manage),
  );
  readonly canApplyProfessionalRestrictions = computed(() =>
    this.authorization.hasPermission(WORKFORCE_PERMISSIONS.professionalRestrictions.apply),
  );
  readonly canLiftProfessionalRestrictions = computed(() =>
    this.authorization.hasPermission(WORKFORCE_PERMISSIONS.professionalRestrictions.lift),
  );
  readonly canReadOffboarding = computed(() =>
    this.authorization.hasPermission(WORKFORCE_PERMISSIONS.offboarding.read),
  );
  readonly canManageOffboarding = computed(() =>
    this.authorization.hasPermission(WORKFORCE_PERMISSIONS.offboarding.manage),
  );
  readonly canWaiveOffboarding = computed(() =>
    this.authorization.hasPermission(WORKFORCE_PERMISSIONS.offboarding.waive),
  );
  readonly canCompleteOffboarding = computed(() =>
    this.authorization.hasPermission(WORKFORCE_PERMISSIONS.offboarding.complete),
  );
  readonly canReadWorkingTime = computed(() =>
    this.authorization.hasPermission(WORKFORCE_PERMISSIONS.workingTime.read),
  );
  readonly canManageWorkingTime = computed(() =>
    this.authorization.hasPermission(WORKFORCE_PERMISSIONS.workingTime.manage),
  );
  readonly canReadTimesheets = computed(() =>
    this.authorization.hasPermission(WORKFORCE_PERMISSIONS.timesheets.read),
  );
  readonly canManageTimesheets = computed(() =>
    this.authorization.hasPermission(WORKFORCE_PERMISSIONS.timesheets.manage),
  );
  readonly canSubmitTimesheets = computed(() =>
    this.authorization.hasPermission(WORKFORCE_PERMISSIONS.timesheets.submit),
  );
  readonly canApproveTimesheets = computed(() =>
    this.authorization.hasPermission(WORKFORCE_PERMISSIONS.timesheets.approve),
  );
  readonly canLockTimesheets = computed(() =>
    this.authorization.hasPermission(WORKFORCE_PERMISSIONS.timesheets.lock),
  );

  canAccessTab(key: string): boolean {
    switch (key) {
      case 'overview':
        return true;
      case 'branches':
        return this.canReadBranchAssignments();
      case 'positions':
        return this.canReadJobPositions();
      case 'qualifications':
        return this.canReadQualifications() || this.canReadInstructorAuthorizations();
      case 'contracts':
        return this.canReadEmploymentContracts();
      case 'leave':
        return this.canReadLeaveRequests() || this.canReadLeavePolicies();
      case 'time':
        return this.canReadWorkingTime() || this.canReadTimesheets();
      case 'equipment':
        return this.canReadEquipmentAssignments();
      case 'reviews':
        return this.canReadPerformanceReviews();
      case 'documents':
        return this.canReadEmployeeDocuments();
      case 'restrictions':
        return this.canReadProfessionalRestrictions();
      case 'offboarding':
        return this.canReadOffboarding();
      default:
        return false;
    }
  }

  constructor() {
    if (!this.employeeId) {
      this.errors.set([this.translate.instant('workforce.employeeDetail.invalidEmployeeId')]);
      this.loading.set(false);
      return;
    }
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.errors.set([]);
    forkJoin({
      employee: this.api.getEmployee(this.employeeId),
      history: this.api.getEmployeeHistory(this.employeeId),
      branchAssignments: this.canReadBranchAssignments()
        ? this.api.getBranchAssignments(this.employeeId)
        : of([] as readonly EmployeeBranchAssignment[]),
      jobPositionAssignments: this.canReadJobPositions()
        ? this.api.getJobPositionAssignments(this.employeeId)
        : of([] as readonly EmployeeJobPositionAssignment[]),
      jobPositions: this.canReadJobPositions()
        ? this.api.getJobPositions()
        : of([] as readonly JobPosition[]),
      qualifications: this.canReadQualifications()
        ? this.api.getQualifications(this.employeeId)
        : of([] as readonly EmployeeQualification[]),
      instructorAuthorizations: this.canReadInstructorAuthorizations()
        ? this.api.getInstructorAuthorizations(this.employeeId)
        : of([] as readonly InstructorAuthorization[]),
      employmentContracts: this.canReadEmploymentContracts()
        ? this.api.getEmploymentContracts(this.employeeId)
        : of([] as readonly EmploymentContract[]),
      leaveRequests: this.canReadLeaveRequests()
        ? this.api.getLeaveRequests(this.employeeId)
        : of([] as readonly LeaveRequest[]),
      leavePolicies: this.canReadLeavePolicies()
        ? this.api.getLeavePolicies()
        : of([] as readonly LeavePolicy[]),
      workingTimePolicies: this.canReadWorkingTime()
        ? this.api.getWorkingTimePolicies(this.employeeId)
        : of([] as readonly WorkingTimePolicy[]),
      timesheets: this.canReadTimesheets()
        ? this.api.getTimesheets(this.employeeId)
        : of([] as readonly Timesheet[]),
      equipmentAssignments: this.canReadEquipmentAssignments()
        ? this.api.getEquipmentAssignments(this.employeeId)
        : of([] as readonly EquipmentAssignment[]),
      performanceReviews: this.canReadPerformanceReviews()
        ? this.api.getPerformanceReviews(this.employeeId)
        : of([] as readonly PerformanceReview[]),
      employeeDocuments: this.canReadEmployeeDocuments()
        ? this.api.getEmployeeDocuments(this.employeeId)
        : of([] as readonly EmployeeDocument[]),
      professionalRestrictions: this.canReadProfessionalRestrictions()
        ? this.api.getProfessionalRestrictions(this.employeeId)
        : of([] as readonly ProfessionalRestriction[]),
      offboarding: this.canReadOffboarding()
        ? this.api
            .getOffboarding(this.employeeId)
            .pipe(
              catchError((error) =>
                error?.status === 404
                  ? of(null as OffboardingProcess | null)
                  : throwError(() => error),
              ),
            )
        : of(null as OffboardingProcess | null),
    })
      .pipe(
        switchMap(
          ({
            employee,
            history,
            branchAssignments,
            jobPositionAssignments,
            jobPositions,
            qualifications,
            instructorAuthorizations,
            employmentContracts,
            leaveRequests,
            leavePolicies,
            workingTimePolicies,
            timesheets,
            equipmentAssignments,
            performanceReviews,
            employeeDocuments,
            professionalRestrictions,
            offboarding,
          }) =>
            this.branchesApi
              .getPaged(employee.employerOrganizationId, {
                pageNumber: 1,
                pageSize: 250,
                search: '',
                sortBy: 'name',
                sortDirection: 'asc',
              })
              .pipe(
                switchMap((branchPage) => {
                  this.employee.set(employee);
                  this.history.set(history);
                  this.branchAssignments.set(branchAssignments);
                  this.jobPositionAssignments.set(jobPositionAssignments);
                  this.jobPositions.set(jobPositions);
                  this.qualifications.set(qualifications);
                  this.instructorAuthorizations.set(instructorAuthorizations);
                  this.employmentContracts.set(employmentContracts);
                  this.leaveRequests.set(leaveRequests);
                  this.leavePolicies.set(leavePolicies);
                  this.workingTimePolicies.set(workingTimePolicies);
                  this.timesheets.set(timesheets);
                  this.equipmentAssignments.set(equipmentAssignments);
                  this.performanceReviews.set(performanceReviews);
                  this.employeeDocuments.set(employeeDocuments);
                  this.professionalRestrictions.set(professionalRestrictions);
                  this.offboarding.set(offboarding);
                  this.branches.set(branchPage.items);
                  return [true];
                }),
              ),
        ),
      )
      .subscribe({
        next: () => {
          this.loading.set(false);
          if (this.canReadWorkingTime()) this.loadWorkingTimeSummary();
        },
        error: (error) => {
          this.errors.set(this.apiErrors.getMessages(error));
          this.loading.set(false);
        },
      });
  }

  openRehireDrawer(): void {
    const item = this.employee();
    if (!item || item.status !== 'Ended' || !this.canRehire()) return;
    this.rehireForm.reset({
      employeeNumber: item.employeeNumber,
      employmentStartDate: this.nextDay(item.employmentEndDate ?? item.employmentStartDate),
      employmentEndDate: '',
      reusePreviousUserLink: !!item.userId,
      userId: item.userId ?? '',
    });
    this.openDrawer('rehire');
  }

  rehireEmployee(): void {
    if (this.rehireForm.invalid || this.saving()) {
      this.rehireForm.markAllAsTouched();
      return;
    }
    const v = this.rehireForm.getRawValue();
    const request = {
      employeeId: null,
      userId: v.reusePreviousUserLink ? null : v.userId.trim() || null,
      reusePreviousUserLink: v.reusePreviousUserLink,
      employeeNumber: v.employeeNumber.trim(),
      employmentStartDate: v.employmentStartDate,
      employmentEndDate: v.employmentEndDate || null,
    };
    this.saving.set(true);
    this.actionErrors.set([]);
    this.api.rehireEmployee(this.employeeId, request).subscribe({
      next: (result) => {
        this.saving.set(false);
        this.drawer.set(null);
        void this.router.navigate(['/workforce/employees', result.id]);
      },
      error: (error) => {
        this.actionErrors.set(this.apiErrors.getMessages(error));
        this.saving.set(false);
      },
    });
  }

  openIdentityDrawer(): void {
    const item = this.employee();
    if (!item) return;
    this.identityForm.reset({
      employeeNumber: item.employeeNumber,
      userId: item.userId ?? '',
      employmentStartDate: item.employmentStartDate,
      employmentEndDate: item.employmentEndDate ?? '',
    });
    this.openDrawer('identity');
  }

  openBranchCreateDrawer(): void {
    const item = this.employee();
    if (!item || item.status === 'Ended') return;
    this.selectedBranchAssignment.set(null);
    this.branchAssignmentForm.reset({
      branchId: '',
      startDate: item.employmentStartDate,
      endDate: '',
      isPrimary: !this.branchAssignments().some(
        (x) => x.isPrimary && x.status !== 'Cancelled' && x.status !== 'Ended',
      ),
    });
    this.openDrawer('branchCreate');
  }

  openBranchEditDrawer(assignment: EmployeeBranchAssignment): void {
    this.selectedBranchAssignment.set(assignment);
    this.branchAssignmentForm.reset({
      branchId: assignment.branchId,
      startDate: assignment.startDate,
      endDate: assignment.endDate ?? '',
      isPrimary: assignment.isPrimary,
    });
    this.openDrawer('branchEdit');
  }

  openBranchEndDrawer(assignment: EmployeeBranchAssignment): void {
    this.selectedBranchAssignment.set(assignment);
    this.branchEndForm.reset({
      endDate: assignment.endDate ?? new Date().toISOString().slice(0, 10),
    });
    this.openDrawer('branchEnd');
  }

  openBranchCancelDrawer(assignment: EmployeeBranchAssignment): void {
    this.selectedBranchAssignment.set(assignment);
    this.openDrawer('branchCancel');
  }

  saveBranchAssignment(): void {
    if (this.branchAssignmentForm.invalid || this.saving()) {
      this.branchAssignmentForm.markAllAsTouched();
      return;
    }
    const value = this.branchAssignmentForm.getRawValue();
    if (this.drawer() === 'branchCreate') {
      this.runBranchAction(
        this.api.addBranchAssignment(this.employeeId, {
          branchId: value.branchId,
          startDate: value.startDate,
          endDate: value.endDate || null,
          isPrimary: value.isPrimary,
        }),
      );
      return;
    }
    const assignment = this.selectedBranchAssignment();
    if (!assignment) return;
    this.runAction(
      this.api.updateBranchAssignment(this.employeeId, assignment.id, {
        startDate: value.startDate,
        endDate: value.endDate || null,
        isPrimary: value.isPrimary,
      }),
    );
  }

  endBranchAssignment(): void {
    const assignment = this.selectedBranchAssignment();
    if (!assignment || this.branchEndForm.invalid || this.saving()) {
      this.branchEndForm.markAllAsTouched();
      return;
    }
    this.runAction(
      this.api.endBranchAssignment(
        this.employeeId,
        assignment.id,
        this.branchEndForm.getRawValue().endDate,
      ),
    );
  }

  cancelBranchAssignment(): void {
    const assignment = this.selectedBranchAssignment();
    if (!assignment || this.saving()) return;
    this.runAction(this.api.cancelBranchAssignment(this.employeeId, assignment.id));
  }

  branchName(branchId: string): string {
    const branch = this.branches().find((x) => x.id === branchId);
    return branch ? `${branch.name} (${branch.code})` : branchId;
  }

  branchAssignmentTone(status: string): DriveOsStatusTone {
    switch (status) {
      case 'Active':
        return 'success';
      case 'Planned':
        return 'info';
      case 'Ended':
        return 'neutral';
      case 'Cancelled':
        return 'danger';
      default:
        return 'neutral';
    }
  }

  canEditBranchAssignment(assignment: EmployeeBranchAssignment): boolean {
    return (
      this.canManageBranchAssignments() &&
      assignment.status !== 'Ended' &&
      assignment.status !== 'Cancelled'
    );
  }

  canCancelBranchAssignment(assignment: EmployeeBranchAssignment): boolean {
    return this.canManageBranchAssignments() && assignment.status === 'Planned';
  }

  openJobPositionCreateDrawer(): void {
    const item = this.employee();
    if (!item || item.status === 'Ended') return;
    this.selectedJobPositionAssignment.set(null);
    this.jobPositionAssignmentForm.reset({
      jobPositionId: '',
      branchId: '',
      startDate: item.employmentStartDate,
      endDate: '',
      isPrimary: !this.jobPositionAssignments().some(
        (x) => x.isPrimary && !['Cancelled', 'Ended'].includes(x.status),
      ),
    });
    this.openDrawer('positionCreate');
  }

  openJobPositionEditDrawer(assignment: EmployeeJobPositionAssignment): void {
    this.selectedJobPositionAssignment.set(assignment);
    this.jobPositionAssignmentForm.reset({
      jobPositionId: assignment.jobPositionId,
      branchId: assignment.branchId ?? '',
      startDate: assignment.startDate,
      endDate: assignment.endDate ?? '',
      isPrimary: assignment.isPrimary,
    });
    this.openDrawer('positionEdit');
  }

  openJobPositionEndDrawer(assignment: EmployeeJobPositionAssignment): void {
    this.selectedJobPositionAssignment.set(assignment);
    this.jobPositionEndForm.reset({
      endDate: assignment.endDate ?? new Date().toISOString().slice(0, 10),
    });
    this.openDrawer('positionEnd');
  }

  openJobPositionCancelDrawer(assignment: EmployeeJobPositionAssignment): void {
    this.selectedJobPositionAssignment.set(assignment);
    this.openDrawer('positionCancel');
  }

  saveJobPositionAssignment(): void {
    if (this.jobPositionAssignmentForm.invalid || this.saving()) {
      this.jobPositionAssignmentForm.markAllAsTouched();
      return;
    }
    const v = this.jobPositionAssignmentForm.getRawValue();
    if (this.drawer() === 'positionCreate') {
      this.runJobPositionAction(
        this.api.addJobPositionAssignment(this.employeeId, {
          jobPositionId: v.jobPositionId,
          branchId: v.branchId || null,
          startDate: v.startDate,
          endDate: v.endDate || null,
          isPrimary: v.isPrimary,
        }),
      );
      return;
    }
    const a = this.selectedJobPositionAssignment();
    if (!a) return;
    this.runAction(
      this.api.updateJobPositionAssignment(this.employeeId, a.id, {
        startDate: v.startDate,
        endDate: v.endDate || null,
        isPrimary: v.isPrimary,
      }),
    );
  }

  endJobPositionAssignment(): void {
    const a = this.selectedJobPositionAssignment();
    if (!a || this.jobPositionEndForm.invalid || this.saving()) {
      this.jobPositionEndForm.markAllAsTouched();
      return;
    }
    this.runAction(
      this.api.endJobPositionAssignment(
        this.employeeId,
        a.id,
        this.jobPositionEndForm.getRawValue().endDate,
      ),
    );
  }
  cancelJobPositionAssignment(): void {
    const a = this.selectedJobPositionAssignment();
    if (!a || this.saving()) return;
    this.runAction(this.api.cancelJobPositionAssignment(this.employeeId, a.id));
  }
  jobPositionName(id: string): string {
    const p = this.jobPositions().find((x) => x.id === id);
    return p ? `${p.name} (${p.code})` : id;
  }
  professionalFunction(id: string): string {
    return this.jobPositions().find((x) => x.id === id)?.professionalFunction ?? 'Other';
  }
  jobPositionAssignmentTone(status: string): DriveOsStatusTone {
    switch (status) {
      case 'Active':
        return 'success';
      case 'Planned':
        return 'info';
      case 'Cancelled':
        return 'danger';
      default:
        return 'neutral';
    }
  }
  canEditJobPositionAssignment(a: EmployeeJobPositionAssignment): boolean {
    return this.canAssignJobPositions() && !['Ended', 'Cancelled'].includes(a.status);
  }
  canCancelJobPositionAssignment(a: EmployeeJobPositionAssignment): boolean {
    return this.canAssignJobPositions() && a.status === 'Planned';
  }

  openQualificationDeclareDrawer(): void {
    if (!this.canManageQualifications() || this.employee()?.status === 'Ended') return;
    this.selectedQualification.set(null);
    this.qualificationForm.reset({
      countryCode: 'FR',
      qualificationType: '',
      title: '',
      identifier: '',
      issuingAuthority: '',
      issuedOn: '',
      expiresOn: '',
      source: 'Manual',
    });
    this.openDrawer('qualificationDeclare');
  }

  openQualificationDecisionDrawer(
    qualification: EmployeeQualification,
    decision: 'verify' | 'reject',
  ): void {
    this.selectedQualification.set(qualification);
    this.verificationForm.reset({ verificationMethod: '', reason: '' });
    this.rejectionForm.reset({ reason: '' });
    this.openDrawer(decision === 'verify' ? 'qualificationVerify' : 'qualificationReject');
  }

  openAuthorizationDeclareDrawer(): void {
    if (!this.canManageInstructorAuthorizations() || this.employee()?.status === 'Ended') return;
    this.selectedInstructorAuthorization.set(null);
    this.instructorAuthorizationForm.reset({
      countryCode: 'FR',
      authorizationType: 'TEACHING_AUTHORIZATION',
      identifier: '',
      issuingAuthority: '',
      jurisdictionCode: '',
      licenseCategoryCode: 'B',
      issuedOn: '',
      expiresOn: '',
      source: 'Manual',
    });
    this.openDrawer('authorizationDeclare');
  }

  openAuthorizationDecisionDrawer(
    authorization: InstructorAuthorization,
    decision: 'verify' | 'reject',
  ): void {
    this.selectedInstructorAuthorization.set(authorization);
    this.verificationForm.reset({ verificationMethod: '', reason: '' });
    this.rejectionForm.reset({ reason: '' });
    this.openDrawer(decision === 'verify' ? 'authorizationVerify' : 'authorizationReject');
  }

  declareQualification(): void {
    if (this.qualificationForm.invalid || this.saving()) {
      this.qualificationForm.markAllAsTouched();
      return;
    }
    const v = this.qualificationForm.getRawValue();
    this.runCredentialAction(
      this.api.declareQualification(this.employeeId, {
        countryCode: v.countryCode.trim().toUpperCase(),
        qualificationType: v.qualificationType.trim().toUpperCase(),
        title: v.title.trim(),
        identifier: v.identifier.trim() || null,
        issuingAuthority: v.issuingAuthority.trim() || null,
        issuedOn: v.issuedOn || null,
        expiresOn: v.expiresOn || null,
        source: v.source,
      }),
    );
  }

  declareInstructorAuthorization(): void {
    if (this.instructorAuthorizationForm.invalid || this.saving()) {
      this.instructorAuthorizationForm.markAllAsTouched();
      return;
    }
    const v = this.instructorAuthorizationForm.getRawValue();
    this.runCredentialAction(
      this.api.declareInstructorAuthorization(this.employeeId, {
        countryCode: v.countryCode.trim().toUpperCase(),
        authorizationType: v.authorizationType.trim().toUpperCase(),
        identifier: v.identifier.trim(),
        issuingAuthority: v.issuingAuthority.trim(),
        jurisdictionCode: v.jurisdictionCode.trim() || null,
        licenseCategoryCode: v.licenseCategoryCode.trim().toUpperCase(),
        issuedOn: v.issuedOn || null,
        expiresOn: v.expiresOn || null,
        source: v.source,
      }),
    );
  }

  verifyCredential(): void {
    if (this.verificationForm.invalid || this.saving()) {
      this.verificationForm.markAllAsTouched();
      return;
    }
    const v = this.verificationForm.getRawValue();
    if (this.drawer() === 'qualificationVerify') {
      const item = this.selectedQualification();
      if (!item) return;
      this.runAction(
        this.api.verifyQualification(this.employeeId, item.id, {
          verificationMethod: v.verificationMethod.trim(),
          reason: v.reason.trim() || null,
        }),
      );
      return;
    }
    if (this.drawer() === 'authorizationVerify') {
      const item = this.selectedInstructorAuthorization();
      if (!item) return;
      this.runAction(
        this.api.verifyInstructorAuthorization(this.employeeId, item.id, {
          verificationMethod: v.verificationMethod.trim(),
          reason: v.reason.trim() || null,
        }),
      );
    }
  }

  rejectCredential(): void {
    if (this.rejectionForm.invalid || this.saving()) {
      this.rejectionForm.markAllAsTouched();
      return;
    }
    const reason = this.rejectionForm.getRawValue().reason.trim();
    if (this.drawer() === 'qualificationReject') {
      const item = this.selectedQualification();
      if (!item) return;
      this.runAction(this.api.rejectQualification(this.employeeId, item.id, { reason }));
      return;
    }
    if (this.drawer() === 'authorizationReject') {
      const item = this.selectedInstructorAuthorization();
      if (!item) return;
      this.runAction(this.api.rejectInstructorAuthorization(this.employeeId, item.id, { reason }));
    }
  }

  credentialTone(status: string): DriveOsStatusTone {
    switch (status) {
      case 'Verified':
        return 'success';
      case 'Declared':
        return 'info';
      case 'Expired':
        return 'warning';
      case 'Rejected':
        return 'danger';
      default:
        return 'neutral';
    }
  }

  isExpired(expiresOn: string | null): boolean {
    return !!expiresOn && expiresOn < new Date().toISOString().slice(0, 10);
  }

  canDecideCredential(status: string): boolean {
    return !['Rejected', 'Superseded'].includes(status);
  }

  openEmploymentContractCreateDrawer(): void {
    const item = this.employee();
    if (!item || item.status === 'Ended' || !this.canManageEmploymentContracts()) return;
    this.selectedEmploymentContract.set(null);
    this.selectedLeaveRequest.set(null);
    this.selectedLeavePolicy.set(null);
    this.selectedEquipmentAssignment.set(null);
    this.selectedWorkingTimePolicy.set(null);
    this.selectedTimesheet.set(null);
    this.selectedTimesheetEntry.set(null);
    this.employmentContractForm.reset({
      contractType: 'Permanent',
      startDate: item.employmentStartDate,
      endDate: '',
      contractualWeeklyHours: 35,
      primaryJobPositionId: '',
    });
    this.openDrawer('contractCreate');
  }

  openEmploymentContractEditDrawer(contract: EmploymentContract): void {
    if (!this.canManageEmploymentContracts() || contract.status !== 'Draft') return;
    this.selectedEmploymentContract.set(contract);
    this.employmentContractForm.reset({
      contractType: contract.contractType as EmploymentContractType,
      startDate: contract.startDate,
      endDate: contract.endDate ?? '',
      contractualWeeklyHours: contract.contractualWeeklyHours,
      primaryJobPositionId: contract.primaryJobPositionId ?? '',
    });
    this.openDrawer('contractEdit');
  }

  openEmploymentContractDocumentDrawer(contract: EmploymentContract): void {
    this.selectedEmploymentContract.set(contract);
    this.employmentContractDocumentForm.reset({
      contractDocumentId: contract.contractDocumentId ?? '',
      signatureProcessId: contract.signatureProcessId ?? '',
    });
    this.openDrawer('contractDocument');
  }

  openEmploymentContractSignedDrawer(contract: EmploymentContract): void {
    this.selectedEmploymentContract.set(contract);
    this.employmentContractSignedForm.reset({
      signatureProcessId: contract.signatureProcessId ?? '',
    });
    this.openDrawer('contractSigned');
  }

  openEmploymentContractActivateDrawer(contract: EmploymentContract): void {
    this.selectedEmploymentContract.set(contract);
    this.employmentContractActivationForm.reset({ activationDate: contract.startDate });
    this.openDrawer('contractActivate');
  }

  openEmploymentContractTerminateDrawer(contract: EmploymentContract): void {
    this.selectedEmploymentContract.set(contract);
    this.employmentContractTerminationForm.reset({
      endDate: contract.endDate ?? new Date().toISOString().slice(0, 10),
    });
    this.openDrawer('contractTerminate');
  }

  openEmploymentContractCancelDrawer(contract: EmploymentContract): void {
    this.selectedEmploymentContract.set(contract);
    this.openDrawer('contractCancel');
  }

  saveEmploymentContract(): void {
    if (this.employmentContractForm.invalid || this.saving()) {
      this.employmentContractForm.markAllAsTouched();
      return;
    }
    const v = this.employmentContractForm.getRawValue();
    const weeklyHours =
      v.contractualWeeklyHours === null || v.contractualWeeklyHours === undefined
        ? null
        : Number(v.contractualWeeklyHours);
    if (this.drawer() === 'contractCreate') {
      this.runEmploymentContractAction(
        this.api.addEmploymentContract(this.employeeId, {
          contractType: v.contractType,
          startDate: v.startDate,
          endDate: v.endDate || null,
          contractualWeeklyHours: weeklyHours,
          primaryJobPositionId: v.primaryJobPositionId || null,
        }),
      );
      return;
    }
    const contract = this.selectedEmploymentContract();
    if (!contract) return;
    this.runAction(
      this.api.updateEmploymentContract(this.employeeId, contract.id, {
        startDate: v.startDate,
        endDate: v.endDate || null,
        contractualWeeklyHours: weeklyHours,
        primaryJobPositionId: v.primaryJobPositionId || null,
      }),
    );
  }

  linkEmploymentContractDocument(): void {
    const contract = this.selectedEmploymentContract();
    if (!contract || this.employmentContractDocumentForm.invalid || this.saving()) {
      this.employmentContractDocumentForm.markAllAsTouched();
      return;
    }
    const v = this.employmentContractDocumentForm.getRawValue();
    this.runAction(
      this.api.linkEmploymentContractDocument(this.employeeId, contract.id, {
        contractDocumentId: v.contractDocumentId.trim(),
        signatureProcessId: v.signatureProcessId.trim() || null,
      }),
    );
  }

  markEmploymentContractSigned(): void {
    const contract = this.selectedEmploymentContract();
    if (!contract || this.employmentContractSignedForm.invalid || this.saving()) {
      this.employmentContractSignedForm.markAllAsTouched();
      return;
    }
    this.runAction(
      this.api.markEmploymentContractSigned(
        this.employeeId,
        contract.id,
        this.employmentContractSignedForm.getRawValue().signatureProcessId.trim(),
      ),
    );
  }

  activateEmploymentContract(): void {
    const contract = this.selectedEmploymentContract();
    if (!contract || this.employmentContractActivationForm.invalid || this.saving()) {
      this.employmentContractActivationForm.markAllAsTouched();
      return;
    }
    this.runAction(
      this.api.activateEmploymentContract(
        this.employeeId,
        contract.id,
        this.employmentContractActivationForm.getRawValue().activationDate,
      ),
    );
  }

  terminateEmploymentContract(): void {
    const contract = this.selectedEmploymentContract();
    if (!contract || this.employmentContractTerminationForm.invalid || this.saving()) {
      this.employmentContractTerminationForm.markAllAsTouched();
      return;
    }
    this.runAction(
      this.api.terminateEmploymentContract(
        this.employeeId,
        contract.id,
        this.employmentContractTerminationForm.getRawValue().endDate,
      ),
    );
  }

  cancelEmploymentContract(): void {
    const contract = this.selectedEmploymentContract();
    if (!contract || this.saving()) return;
    this.runAction(this.api.cancelEmploymentContract(this.employeeId, contract.id));
  }

  employmentContractTone(status: string): DriveOsStatusTone {
    switch (status) {
      case 'Active':
      case 'Signed':
        return 'success';
      case 'PendingSignature':
      case 'Ending':
        return 'warning';
      case 'Draft':
        return 'info';
      case 'Cancelled':
      case 'Terminated':
        return 'neutral';
      case 'Suspended':
        return 'danger';
      default:
        return 'neutral';
    }
  }

  canEditEmploymentContract(contract: EmploymentContract): boolean {
    return this.canManageEmploymentContracts() && contract.status === 'Draft';
  }
  canLinkEmploymentContractDocument(contract: EmploymentContract): boolean {
    return (
      this.canManageEmploymentContracts() && ['Draft', 'PendingSignature'].includes(contract.status)
    );
  }
  canMarkEmploymentContractSigned(contract: EmploymentContract): boolean {
    return (
      this.canSignEmploymentContracts() &&
      contract.status === 'PendingSignature' &&
      !!contract.contractDocumentId
    );
  }
  canActivateEmploymentContract(contract: EmploymentContract): boolean {
    return this.canManageEmploymentContracts() && contract.status === 'Signed';
  }
  canTerminateEmploymentContract(contract: EmploymentContract): boolean {
    return (
      this.canManageEmploymentContracts() &&
      ['Signed', 'Active', 'Suspended'].includes(contract.status)
    );
  }
  canCancelEmploymentContract(contract: EmploymentContract): boolean {
    return (
      this.canManageEmploymentContracts() && ['Draft', 'PendingSignature'].includes(contract.status)
    );
  }

  openLeaveRequestCreateDrawer(): void {
    const policy = this.leavePolicies().find((x) => x.status === 'Active');
    this.selectedLeaveRequest.set(null);
    this.leaveRequestForm.reset({
      leavePolicyId: policy?.id ?? '',
      startDate: '',
      endDate: '',
      startPortion: 'FullDay',
      endPortion: 'FullDay',
      reason: '',
      evidenceDocumentId: '',
    });
    this.openDrawer('leaveRequestCreate');
  }
  openLeaveRequestEditDrawer(item: LeaveRequest): void {
    this.selectedLeaveRequest.set(item);
    this.leaveRequestForm.reset({
      leavePolicyId: item.leavePolicyId,
      startDate: item.startDate,
      endDate: item.endDate,
      startPortion: item.startPortion as LeaveDayPortion,
      endPortion: item.endPortion as LeaveDayPortion,
      reason: item.reason ?? '',
      evidenceDocumentId: item.evidenceDocumentId ?? '',
    });
    this.openDrawer('leaveRequestEdit');
  }
  openLeaveRequestActionDrawer(
    item: LeaveRequest,
    action: 'submit' | 'approve' | 'reject' | 'cancel',
  ): void {
    this.selectedLeaveRequest.set(item);
    this.leaveDecisionForm.reset({ reason: '' });
    this.leaveRejectForm.reset({ reason: '' });
    this.openDrawer(
      `leaveRequest${action.charAt(0).toUpperCase()}${action.slice(1)}` as Exclude<
        EmployeeDrawerKind,
        null
      >,
    );
  }
  saveLeaveRequest(): void {
    if (this.leaveRequestForm.invalid || this.saving()) {
      this.leaveRequestForm.markAllAsTouched();
      return;
    }
    const v = this.leaveRequestForm.getRawValue();
    const req = {
      startDate: v.startDate,
      endDate: v.endDate,
      startPortion: v.startPortion,
      endPortion: v.endPortion,
      reason: v.reason.trim() || null,
      evidenceDocumentId: v.evidenceDocumentId.trim() || null,
    };
    if (this.drawer() === 'leaveRequestCreate') {
      this.runLeaveAction(
        this.api.createLeaveRequest({
          employeeId: this.employeeId,
          leavePolicyId: v.leavePolicyId,
          ...req,
        }),
      );
      return;
    }
    const item = this.selectedLeaveRequest();
    if (item) this.runAction(this.api.updateLeaveRequest(item.id, req));
  }
  submitLeaveRequest(): void {
    const item = this.selectedLeaveRequest();
    if (item) this.runAction(this.api.submitLeaveRequest(item.id));
  }
  approveLeaveRequest(): void {
    const item = this.selectedLeaveRequest();
    if (item)
      this.runAction(
        this.api.approveLeaveRequest(
          item.id,
          this.leaveDecisionForm.getRawValue().reason.trim() || null,
        ),
      );
  }
  rejectLeaveRequest(): void {
    const item = this.selectedLeaveRequest();
    if (!item || this.leaveRejectForm.invalid) {
      this.leaveRejectForm.markAllAsTouched();
      return;
    }
    this.runAction(
      this.api.rejectLeaveRequest(item.id, this.leaveRejectForm.getRawValue().reason.trim()),
    );
  }
  cancelLeaveRequest(): void {
    const item = this.selectedLeaveRequest();
    if (item)
      this.runAction(
        this.api.cancelLeaveRequest(
          item.id,
          this.leaveDecisionForm.getRawValue().reason.trim() || null,
        ),
      );
  }
  openLeavePolicyCreateDrawer(): void {
    this.selectedLeavePolicy.set(null);
    this.leavePolicyForm.reset({
      countryCode: 'FR',
      code: '',
      name: '',
      category: 'PaidLeave',
      isPaid: true,
      requiresApproval: true,
      requiresEvidence: false,
      allowHalfDay: true,
      minimumNoticeDays: 0,
      maximumConsecutiveDays: null,
    });
    this.openDrawer('leavePolicyCreate');
  }
  openLeavePolicyEditDrawer(item: LeavePolicy): void {
    this.selectedLeavePolicy.set(item);
    this.leavePolicyForm.reset({
      countryCode: item.countryCode,
      code: item.code,
      name: item.name,
      category: item.category as LeaveCategory,
      isPaid: item.isPaid,
      requiresApproval: item.requiresApproval,
      requiresEvidence: item.requiresEvidence,
      allowHalfDay: item.allowHalfDay,
      minimumNoticeDays: item.minimumNoticeDays ?? 0,
      maximumConsecutiveDays: item.maximumConsecutiveDays,
    });
    this.openDrawer('leavePolicyEdit');
  }
  openLeavePolicyStatusDrawer(item: LeavePolicy): void {
    this.selectedLeavePolicy.set(item);
    this.openDrawer(item.status === 'Active' ? 'leavePolicyDeactivate' : 'leavePolicyReactivate');
  }
  saveLeavePolicy(): void {
    if (this.leavePolicyForm.invalid || this.saving()) {
      this.leavePolicyForm.markAllAsTouched();
      return;
    }
    const v = this.leavePolicyForm.getRawValue();
    const req = {
      countryCode: v.countryCode.trim().toUpperCase(),
      code: v.code.trim().toUpperCase(),
      name: v.name.trim(),
      category: v.category,
      isPaid: v.isPaid,
      requiresApproval: v.requiresApproval,
      requiresEvidence: v.requiresEvidence,
      allowHalfDay: v.allowHalfDay,
      minimumNoticeDays: v.minimumNoticeDays === null ? null : Number(v.minimumNoticeDays),
      maximumConsecutiveDays:
        v.maximumConsecutiveDays === null ? null : Number(v.maximumConsecutiveDays),
    };
    if (this.drawer() === 'leavePolicyCreate') {
      this.runLeaveAction(this.api.createLeavePolicy(req));
      return;
    }
    const item = this.selectedLeavePolicy();
    if (item) this.runAction(this.api.updateLeavePolicy(item.id, req));
  }
  changeLeavePolicyStatus(): void {
    const item = this.selectedLeavePolicy();
    if (!item) return;
    this.runAction(
      item.status === 'Active'
        ? this.api.deactivateLeavePolicy(item.id)
        : this.api.reactivateLeavePolicy(item.id),
    );
  }
  leavePolicyName(id: string): string {
    return this.leavePolicies().find((x) => x.id === id)?.name ?? id;
  }
  leaveRequestTone(status: string): DriveOsStatusTone {
    switch (status) {
      case 'Approved':
        return 'success';
      case 'Submitted':
        return 'warning';
      case 'Rejected':
        return 'danger';
      case 'Draft':
        return 'info';
      default:
        return 'neutral';
    }
  }
  canEditLeaveRequest(item: LeaveRequest): boolean {
    return this.canManageLeaveRequests() && item.status === 'Draft';
  }
  canSubmitLeaveRequest(item: LeaveRequest): boolean {
    return this.canSubmitLeaveRequests() && item.status === 'Draft';
  }
  canDecideLeaveRequest(item: LeaveRequest): boolean {
    return this.canApproveLeaveRequests() && item.status === 'Submitted';
  }
  canCancelLeaveRequest(item: LeaveRequest): boolean {
    return this.canManageLeaveRequests() && !['Cancelled', 'Rejected'].includes(item.status);
  }

  loadWorkingTimeSummary(): void {
    if (!this.canReadWorkingTime() || this.workingTimeSummaryForm.invalid) {
      this.workingTimeSummaryForm.markAllAsTouched();
      return;
    }
    const v = this.workingTimeSummaryForm.getRawValue();
    this.summaryLoading.set(true);
    this.api.getWorkingTimeSummary(this.employeeId, v.from, v.to).subscribe({
      next: (x) => {
        this.workingTimeSummary.set(x);
        this.summaryLoading.set(false);
      },
      error: (e) => {
        this.errors.set(this.apiErrors.getMessages(e));
        this.summaryLoading.set(false);
      },
    });
  }
  openWorkingTimePolicyCreateDrawer(): void {
    this.selectedWorkingTimePolicy.set(null);
    this.workingTimePolicyForm.reset({
      effectiveFrom: this.today(),
      effectiveTo: '',
      contractualWeeklyHours: 35,
      contractualDailyHours: 7,
      maxWorkingDaysPerWeek: 5,
    });
    this.openDrawer('workingTimeCreate');
  }
  openWorkingTimePolicyEditDrawer(item: WorkingTimePolicy): void {
    this.selectedWorkingTimePolicy.set(item);
    this.workingTimePolicyForm.reset({
      effectiveFrom: item.effectiveFrom,
      effectiveTo: item.effectiveTo ?? '',
      contractualWeeklyHours: item.contractualWeeklyHours,
      contractualDailyHours: item.contractualDailyHours,
      maxWorkingDaysPerWeek: item.maxWorkingDaysPerWeek,
    });
    this.openDrawer('workingTimeEdit');
  }
  openWorkingTimePolicyDeactivateDrawer(item: WorkingTimePolicy): void {
    this.selectedWorkingTimePolicy.set(item);
    this.openDrawer('workingTimeDeactivate');
  }
  saveWorkingTimePolicy(): void {
    if (this.workingTimePolicyForm.invalid || this.saving()) {
      this.workingTimePolicyForm.markAllAsTouched();
      return;
    }
    const v = this.workingTimePolicyForm.getRawValue();
    const req = {
      effectiveFrom: v.effectiveFrom,
      effectiveTo: v.effectiveTo || null,
      contractualWeeklyHours: Number(v.contractualWeeklyHours),
      contractualDailyHours:
        v.contractualDailyHours === null ? null : Number(v.contractualDailyHours),
      maxWorkingDaysPerWeek:
        v.maxWorkingDaysPerWeek === null ? null : Number(v.maxWorkingDaysPerWeek),
    };
    if (this.drawer() === 'workingTimeCreate') {
      this.runTimeAction(this.api.createWorkingTimePolicy(this.employeeId, req));
      return;
    }
    const item = this.selectedWorkingTimePolicy();
    if (item) this.runTimeAction(this.api.updateWorkingTimePolicy(item.id, req));
  }
  deactivateWorkingTimePolicy(): void {
    const item = this.selectedWorkingTimePolicy();
    if (item) this.runTimeAction(this.api.deactivateWorkingTimePolicy(item.id));
  }
  workingTimePolicyTone(status: string): DriveOsStatusTone {
    return status === 'Active' ? 'success' : 'neutral';
  }

  openTimesheetCreateDrawer(): void {
    this.selectedTimesheet.set(null);
    this.timesheetForm.reset({ periodFrom: this.daysAgo(6), periodTo: this.today() });
    this.openDrawer('timesheetCreate');
  }
  openTimesheetEntryDrawer(sheet: Timesheet, entry?: TimesheetEntry): void {
    this.selectedTimesheet.set(sheet);
    this.selectedTimesheetEntry.set(entry ?? null);
    this.timesheetEntryForm.reset({
      date: entry?.date ?? sheet.periodFrom,
      activityType: (entry?.activityType as TimesheetActivityType) ?? 'Teaching',
      hours: entry?.hours ?? 1,
      description: entry?.description ?? '',
      source: (entry?.source as TimesheetEntrySource) ?? 'Manual',
      sourceReference: entry?.sourceReference ?? '',
    });
    this.openDrawer(entry ? 'timesheetEntryEdit' : 'timesheetEntryCreate');
  }
  openTimesheetActionDrawer(
    sheet: Timesheet,
    action: 'submit' | 'review' | 'approve' | 'reject' | 'lock',
  ): void {
    this.selectedTimesheet.set(sheet);
    this.timesheetDecisionForm.reset({ reason: '' });
    this.timesheetRejectForm.reset({ reason: '' });
    this.openDrawer(
      `timesheet${action.charAt(0).toUpperCase()}${action.slice(1)}` as Exclude<
        EmployeeDrawerKind,
        null
      >,
    );
  }
  openTimesheetEntryRemoveDrawer(sheet: Timesheet, entry: TimesheetEntry): void {
    this.selectedTimesheet.set(sheet);
    this.selectedTimesheetEntry.set(entry);
    this.openDrawer('timesheetEntryRemove');
  }
  createTimesheet(): void {
    if (this.timesheetForm.invalid || this.saving()) {
      this.timesheetForm.markAllAsTouched();
      return;
    }
    const v = this.timesheetForm.getRawValue();
    this.runTimeAction(
      this.api.createTimesheet({
        employeeId: this.employeeId,
        periodFrom: v.periodFrom,
        periodTo: v.periodTo,
      }),
    );
  }
  saveTimesheetEntry(): void {
    const sheet = this.selectedTimesheet();
    if (!sheet || this.timesheetEntryForm.invalid || this.saving()) {
      this.timesheetEntryForm.markAllAsTouched();
      return;
    }
    const v = this.timesheetEntryForm.getRawValue();
    const req = {
      date: v.date,
      activityType: v.activityType,
      hours: Number(v.hours),
      description: v.description.trim() || null,
      source: v.source,
      sourceReference: v.sourceReference.trim() || null,
    };
    const entry = this.selectedTimesheetEntry();
    this.runTimeAction(
      entry
        ? this.api.updateTimesheetEntry(sheet.id, entry.id, req)
        : this.api.addTimesheetEntry(sheet.id, req),
    );
  }
  removeTimesheetEntry(): void {
    const s = this.selectedTimesheet(),
      e = this.selectedTimesheetEntry();
    if (s && e) this.runTimeAction(this.api.removeTimesheetEntry(s.id, e.id));
  }
  submitTimesheet(): void {
    const s = this.selectedTimesheet();
    if (s) this.runTimeAction(this.api.submitTimesheet(s.id));
  }
  startTimesheetReview(): void {
    const s = this.selectedTimesheet();
    if (s) this.runTimeAction(this.api.startTimesheetReview(s.id));
  }
  approveTimesheet(): void {
    const s = this.selectedTimesheet();
    if (s)
      this.runTimeAction(
        this.api.approveTimesheet(
          s.id,
          this.timesheetDecisionForm.getRawValue().reason.trim() || null,
        ),
      );
  }
  rejectTimesheet(): void {
    const s = this.selectedTimesheet();
    if (!s || this.timesheetRejectForm.invalid) {
      this.timesheetRejectForm.markAllAsTouched();
      return;
    }
    this.runTimeAction(
      this.api.rejectTimesheet(s.id, this.timesheetRejectForm.getRawValue().reason.trim()),
    );
  }
  lockTimesheet(): void {
    const s = this.selectedTimesheet();
    if (s) this.runTimeAction(this.api.lockTimesheet(s.id));
  }
  timesheetTone(status: string): DriveOsStatusTone {
    switch (status) {
      case 'Approved':
      case 'Locked':
        return 'success';
      case 'Submitted':
      case 'UnderReview':
        return 'warning';
      case 'Rejected':
        return 'danger';
      case 'Draft':
        return 'info';
      default:
        return 'neutral';
    }
  }
  canEditTimesheet(sheet: Timesheet): boolean {
    return this.canManageTimesheets() && ['Draft', 'Rejected'].includes(sheet.status);
  }
  canSubmitTimesheet(sheet: Timesheet): boolean {
    return (
      this.canSubmitTimesheets() &&
      ['Draft', 'Rejected'].includes(sheet.status) &&
      sheet.entries.length > 0
    );
  }
  canReviewTimesheet(sheet: Timesheet): boolean {
    return this.canApproveTimesheets() && sheet.status === 'Submitted';
  }
  canDecideTimesheet(sheet: Timesheet): boolean {
    return this.canApproveTimesheets() && sheet.status === 'UnderReview';
  }
  canLockTimesheet(sheet: Timesheet): boolean {
    return this.canLockTimesheets() && sheet.status === 'Approved';
  }

  openEquipmentCreateDrawer(): void {
    if (!this.canManageEquipmentAssignments() || this.employee()?.status === 'Ended') return;
    this.selectedEquipmentAssignment.set(null);
    this.equipmentAssignmentForm.reset({
      resourceType: 'Computer',
      resourceId: '',
      startDate: this.today(),
      plannedEndDate: '',
    });
    this.openDrawer('equipmentCreate');
  }
  openEquipmentEditDrawer(item: EquipmentAssignment): void {
    this.selectedEquipmentAssignment.set(item);
    this.equipmentAssignmentForm.reset({
      resourceType: item.resourceType as EquipmentResourceType,
      resourceId: item.resourceId,
      startDate: item.startDate,
      plannedEndDate: item.plannedEndDate ?? '',
    });
    this.openDrawer('equipmentEdit');
  }
  openEquipmentHandoverDrawer(item: EquipmentAssignment): void {
    this.selectedEquipmentAssignment.set(item);
    this.equipmentConditionForm.reset({ condition: 'Good', notes: '' });
    this.openDrawer('equipmentHandover');
  }
  openEquipmentReturnDrawer(item: EquipmentAssignment): void {
    this.selectedEquipmentAssignment.set(item);
    this.equipmentReturnForm.reset({ returnedOn: this.today(), condition: 'Good', notes: '' });
    this.openDrawer('equipmentReturn');
  }
  openEquipmentCancelDrawer(item: EquipmentAssignment): void {
    this.selectedEquipmentAssignment.set(item);
    this.equipmentCancelForm.reset({ reason: '' });
    this.openDrawer('equipmentCancel');
  }
  saveEquipmentAssignment(): void {
    if (this.equipmentAssignmentForm.invalid || this.saving()) {
      this.equipmentAssignmentForm.markAllAsTouched();
      return;
    }
    const v = this.equipmentAssignmentForm.getRawValue();
    const selected = this.selectedEquipmentAssignment();
    if (selected) {
      this.runEquipmentAction(
        this.api.updateEquipmentAssignment(selected.id, {
          startDate: v.startDate,
          plannedEndDate: v.plannedEndDate || null,
        }),
      );
      return;
    }
    this.runEquipmentAction(
      this.api.createEquipmentAssignment({
        employeeId: this.employeeId,
        resourceType: v.resourceType,
        resourceId: v.resourceId.trim(),
        startDate: v.startDate,
        plannedEndDate: v.plannedEndDate || null,
      }),
    );
  }
  handOverEquipmentAssignment(): void {
    const item = this.selectedEquipmentAssignment();
    if (!item || this.equipmentConditionForm.invalid) return;
    const v = this.equipmentConditionForm.getRawValue();
    this.runEquipmentAction(
      this.api.handOverEquipmentAssignment(item.id, {
        condition: v.condition,
        notes: v.notes.trim() || null,
      }),
    );
  }
  returnEquipmentAssignment(): void {
    const item = this.selectedEquipmentAssignment();
    if (!item || this.equipmentReturnForm.invalid) return;
    const v = this.equipmentReturnForm.getRawValue();
    this.runEquipmentAction(
      this.api.returnEquipmentAssignment(item.id, {
        returnedOn: v.returnedOn,
        condition: v.condition,
        notes: v.notes.trim() || null,
      }),
    );
  }
  cancelEquipmentAssignment(): void {
    const item = this.selectedEquipmentAssignment();
    if (!item || this.equipmentCancelForm.invalid) {
      this.equipmentCancelForm.markAllAsTouched();
      return;
    }
    this.runEquipmentAction(
      this.api.cancelEquipmentAssignment(
        item.id,
        this.equipmentCancelForm.getRawValue().reason.trim(),
      ),
    );
  }
  equipmentTone(status: string): DriveOsStatusTone {
    switch (status) {
      case 'Active':
      case 'Returned':
        return 'success';
      case 'Planned':
        return 'info';
      case 'Cancelled':
        return 'neutral';
      default:
        return 'neutral';
    }
  }
  canEditEquipment(item: EquipmentAssignment): boolean {
    return this.canManageEquipmentAssignments() && item.status === 'Planned';
  }
  canHandOverEquipment(item: EquipmentAssignment): boolean {
    return this.canManageEquipmentAssignments() && item.status === 'Planned';
  }
  canReturnEquipment(item: EquipmentAssignment): boolean {
    return this.canManageEquipmentAssignments() && item.status === 'Active';
  }
  canCancelEquipment(item: EquipmentAssignment): boolean {
    return this.canManageEquipmentAssignments() && item.status === 'Planned';
  }

  openPerformanceReviewCreateDrawer(): void {
    if (!this.canManagePerformanceReviews() || this.employee()?.status === 'Ended') return;
    this.selectedPerformanceReview.set(null);
    this.performanceReviewForm.reset({
      evaluatorUserId: '',
      periodFrom: this.daysAgo(365),
      periodTo: this.today(),
      title: '',
    });
    this.openDrawer('reviewCreate');
  }
  openPerformanceReviewActionDrawer(
    review: PerformanceReview,
    action: 'start' | 'submit' | 'acknowledge' | 'complete' | 'cancel',
  ): void {
    this.selectedPerformanceReview.set(review);
    this.performanceReviewAcknowledgeForm.reset({ employeeComment: review.employeeComment ?? '' });
    this.performanceReviewCancelForm.reset({ reason: '' });
    this.openDrawer(
      `review${action.charAt(0).toUpperCase()}${action.slice(1)}` as Exclude<
        EmployeeDrawerKind,
        null
      >,
    );
  }
  openPerformanceReviewCriterionDrawer(
    review: PerformanceReview,
    criterion?: PerformanceReviewCriterion,
  ): void {
    this.selectedPerformanceReview.set(review);
    this.selectedPerformanceReviewCriterion.set(criterion ?? null);
    if (criterion) {
      this.performanceReviewRatingForm.reset({
        rating: criterion.rating ?? 3,
        comment: criterion.comment ?? '',
      });
      this.openDrawer('reviewCriterionRate');
    } else {
      this.performanceReviewCriterionForm.reset({ code: '', label: '', weight: 20, comment: '' });
      this.openDrawer('reviewCriterionAdd');
    }
  }
  openPerformanceReviewSummaryDrawer(review: PerformanceReview): void {
    this.selectedPerformanceReview.set(review);
    this.performanceReviewSummaryForm.reset({
      overallAssessment: review.overallAssessment ?? '',
      objectives: review.objectives ?? '',
    });
    this.openDrawer('reviewSummary');
  }
  createPerformanceReview(): void {
    if (this.performanceReviewForm.invalid || this.saving()) {
      this.performanceReviewForm.markAllAsTouched();
      return;
    }
    const v = this.performanceReviewForm.getRawValue();
    this.runReviewAction(
      this.api.createPerformanceReview({
        employeeId: this.employeeId,
        evaluatorUserId: v.evaluatorUserId.trim(),
        periodFrom: v.periodFrom,
        periodTo: v.periodTo,
        title: v.title.trim(),
      }),
    );
  }
  startPerformanceReview(): void {
    const r = this.selectedPerformanceReview();
    if (r) this.runReviewAction(this.api.startPerformanceReview(r.id));
  }
  addPerformanceReviewCriterion(): void {
    const r = this.selectedPerformanceReview();
    if (!r || this.performanceReviewCriterionForm.invalid) {
      this.performanceReviewCriterionForm.markAllAsTouched();
      return;
    }
    const v = this.performanceReviewCriterionForm.getRawValue();
    this.runReviewAction(
      this.api.addPerformanceReviewCriterion(r.id, {
        code: v.code.trim().toUpperCase(),
        label: v.label.trim(),
        weight: Number(v.weight),
        comment: v.comment.trim() || null,
      }),
    );
  }
  ratePerformanceReviewCriterion(): void {
    const r = this.selectedPerformanceReview(),
      c = this.selectedPerformanceReviewCriterion();
    if (!r || !c || this.performanceReviewRatingForm.invalid) {
      this.performanceReviewRatingForm.markAllAsTouched();
      return;
    }
    const v = this.performanceReviewRatingForm.getRawValue();
    this.runReviewAction(
      this.api.ratePerformanceReviewCriterion(r.id, c.id, {
        rating: Number(v.rating),
        comment: v.comment.trim() || null,
      }),
    );
  }
  savePerformanceReviewSummary(): void {
    const r = this.selectedPerformanceReview();
    if (!r || this.performanceReviewSummaryForm.invalid) {
      this.performanceReviewSummaryForm.markAllAsTouched();
      return;
    }
    const v = this.performanceReviewSummaryForm.getRawValue();
    this.runReviewAction(
      this.api.setPerformanceReviewSummary(r.id, {
        overallAssessment: v.overallAssessment.trim(),
        objectives: v.objectives.trim() || null,
      }),
    );
  }
  submitPerformanceReview(): void {
    const r = this.selectedPerformanceReview();
    if (r) this.runReviewAction(this.api.submitPerformanceReview(r.id));
  }
  acknowledgePerformanceReview(): void {
    const r = this.selectedPerformanceReview();
    if (!r || this.performanceReviewAcknowledgeForm.invalid) return;
    this.runReviewAction(
      this.api.acknowledgePerformanceReview(
        r.id,
        this.performanceReviewAcknowledgeForm.getRawValue().employeeComment.trim() || null,
      ),
    );
  }
  completePerformanceReview(): void {
    const r = this.selectedPerformanceReview();
    if (r) this.runReviewAction(this.api.completePerformanceReview(r.id));
  }
  cancelPerformanceReview(): void {
    const r = this.selectedPerformanceReview();
    if (!r || this.performanceReviewCancelForm.invalid) {
      this.performanceReviewCancelForm.markAllAsTouched();
      return;
    }
    this.runReviewAction(
      this.api.cancelPerformanceReview(
        r.id,
        this.performanceReviewCancelForm.getRawValue().reason.trim(),
      ),
    );
  }
  performanceReviewTone(status: string): DriveOsStatusTone {
    switch (status) {
      case 'Completed':
        return 'success';
      case 'InProgress':
        return 'info';
      case 'Submitted':
      case 'Acknowledged':
        return 'warning';
      case 'Cancelled':
        return 'neutral';
      case 'Draft':
        return 'info';
      default:
        return 'neutral';
    }
  }
  weightedReviewScore(review: PerformanceReview): number | null {
    const rated = review.criteria.filter((x) => x.rating !== null);
    if (!rated.length) return null;
    const totalWeight = rated.reduce((a, c) => a + c.weight, 0);
    if (!totalWeight) return null;
    return rated.reduce((a, c) => a + (c.rating ?? 0) * c.weight, 0) / totalWeight;
  }
  canEditPerformanceReview(review: PerformanceReview): boolean {
    return this.canManagePerformanceReviews() && ['Draft', 'InProgress'].includes(review.status);
  }
  canStartPerformanceReview(review: PerformanceReview): boolean {
    return this.canManagePerformanceReviews() && review.status === 'Draft';
  }
  canSubmitPerformanceReview(review: PerformanceReview): boolean {
    return this.canManagePerformanceReviews() && ['Draft', 'InProgress'].includes(review.status);
  }
  canAcknowledgePerformanceReview(review: PerformanceReview): boolean {
    return this.canAcknowledgePerformanceReviews() && review.status === 'Submitted';
  }
  canCompletePerformanceReview(review: PerformanceReview): boolean {
    return this.canValidatePerformanceReviews() && review.status === 'Acknowledged';
  }
  canCancelPerformanceReview(review: PerformanceReview): boolean {
    return (
      this.canManagePerformanceReviews() && !['Completed', 'Cancelled'].includes(review.status)
    );
  }

  openEmployeeDocumentCreateDrawer(): void {
    if (!this.canManageEmployeeDocuments() || this.employee()?.status === 'Ended') return;
    this.selectedEmployeeDocument.set(null);
    this.employeeDocumentForm.reset({
      documentReferenceId: '',
      category: 'Employment',
      documentTypeCode: '',
      title: '',
      confidentiality: 'Internal',
      issuedOn: '',
      validFrom: '',
      expiresOn: '',
      issuer: '',
      referenceNumber: '',
    });
    this.openDrawer('documentCreate');
  }
  openEmployeeDocumentEditDrawer(item: EmployeeDocument): void {
    if (!this.canEditEmployeeDocument(item)) return;
    this.selectedEmployeeDocument.set(item);
    this.employeeDocumentForm.reset({
      documentReferenceId: item.documentReferenceId ?? '',
      category: item.category as EmployeeDocumentCategory,
      documentTypeCode: item.documentTypeCode,
      title: item.title,
      confidentiality: item.confidentiality as EmployeeDocumentConfidentiality,
      issuedOn: item.issuedOn ?? '',
      validFrom: item.validFrom ?? '',
      expiresOn: item.expiresOn ?? '',
      issuer: item.issuer ?? '',
      referenceNumber: item.referenceNumber ?? '',
    });
    this.openDrawer('documentEdit');
  }
  openEmployeeDocumentActionDrawer(
    item: EmployeeDocument,
    action: 'verify' | 'reveal' | 'supersede' | 'revoke' | 'archive',
  ): void {
    this.selectedEmployeeDocument.set(item);
    this.employeeDocumentSupersedeForm.reset({ replacementEmployeeDocumentId: '' });
    this.employeeDocumentRevokeForm.reset({ reason: '' });
    this.openDrawer(
      `document${action.charAt(0).toUpperCase()}${action.slice(1)}` as Exclude<
        EmployeeDrawerKind,
        null
      >,
    );
  }
  saveEmployeeDocument(): void {
    if (this.employeeDocumentForm.invalid || this.saving()) {
      this.employeeDocumentForm.markAllAsTouched();
      return;
    }
    const v = this.employeeDocumentForm.getRawValue();
    const selected = this.selectedEmployeeDocument();
    if (!selected && !v.documentReferenceId.trim()) {
      this.actionErrors.set(['errors.workforce.employeeDocument.invalidIdentifier']);
      return;
    }
    const payload = {
      category: v.category,
      documentTypeCode: v.documentTypeCode.trim().toUpperCase(),
      title: v.title.trim(),
      confidentiality: v.confidentiality,
      issuedOn: v.issuedOn || null,
      validFrom: v.validFrom || null,
      expiresOn: v.expiresOn || null,
      issuer: v.issuer.trim() || null,
      referenceNumber: v.referenceNumber.trim() || null,
    };
    if (selected) {
      this.runDocumentAction(this.api.updateEmployeeDocument(selected.id, payload));
      return;
    }
    this.runDocumentAction(
      this.api.createEmployeeDocument({
        employeeId: this.employeeId,
        documentReferenceId: v.documentReferenceId.trim(),
        ...payload,
      }),
    );
  }
  verifyEmployeeDocument(): void {
    const item = this.selectedEmployeeDocument();
    if (item) this.runDocumentAction(this.api.verifyEmployeeDocument(item.id));
  }
  revealEmployeeDocumentReference(): void {
    const item = this.selectedEmployeeDocument();
    if (!item) return;
    this.saving.set(true);
    this.actionErrors.set([]);
    this.api.getEmployeeDocumentReference(item.id).subscribe({
      next: (r) => {
        this.saving.set(false);
        this.employeeDocuments.update((items) =>
          items.map((x) =>
            x.id === item.id ? { ...x, documentReferenceId: r.documentReferenceId } : x,
          ),
        );
        this.selectedEmployeeDocument.update((x) =>
          x ? { ...x, documentReferenceId: r.documentReferenceId } : x,
        );
      },
      error: (e) => {
        this.actionErrors.set(this.apiErrors.getMessages(e));
        this.saving.set(false);
      },
    });
  }
  supersedeEmployeeDocument(): void {
    const item = this.selectedEmployeeDocument();
    if (!item || this.employeeDocumentSupersedeForm.invalid) {
      this.employeeDocumentSupersedeForm.markAllAsTouched();
      return;
    }
    this.runDocumentAction(
      this.api.supersedeEmployeeDocument(
        item.id,
        this.employeeDocumentSupersedeForm.getRawValue().replacementEmployeeDocumentId.trim(),
      ),
    );
  }
  revokeEmployeeDocument(): void {
    const item = this.selectedEmployeeDocument();
    if (!item || this.employeeDocumentRevokeForm.invalid) {
      this.employeeDocumentRevokeForm.markAllAsTouched();
      return;
    }
    this.runDocumentAction(
      this.api.revokeEmployeeDocument(
        item.id,
        this.employeeDocumentRevokeForm.getRawValue().reason.trim(),
      ),
    );
  }
  archiveEmployeeDocument(): void {
    const item = this.selectedEmployeeDocument();
    if (item) this.runDocumentAction(this.api.archiveEmployeeDocument(item.id));
  }
  employeeDocumentTone(status: string): DriveOsStatusTone {
    switch (status) {
      case 'Verified':
        return 'success';
      case 'Registered':
        return 'info';
      case 'Revoked':
        return 'warning';
      case 'Superseded':
      case 'Archived':
        return 'neutral';
      default:
        return 'neutral';
    }
  }
  canEditEmployeeDocument(item: EmployeeDocument): boolean {
    return (
      this.canManageEmployeeDocuments() &&
      !['Superseded', 'Revoked', 'Archived'].includes(item.status)
    );
  }
  canVerifyEmployeeDocument(item: EmployeeDocument): boolean {
    return this.canVerifyEmployeeDocuments() && item.status === 'Registered';
  }
  canSupersedeEmployeeDocument(item: EmployeeDocument): boolean {
    return (
      this.canManageEmployeeDocuments() &&
      !['Superseded', 'Revoked', 'Archived'].includes(item.status)
    );
  }
  canRevokeEmployeeDocument(item: EmployeeDocument): boolean {
    return (
      this.canManageEmployeeDocuments() &&
      !['Superseded', 'Revoked', 'Archived'].includes(item.status)
    );
  }
  canArchiveEmployeeDocument(item: EmployeeDocument): boolean {
    return this.canManageEmployeeDocuments() && item.status !== 'Archived';
  }
  canRevealEmployeeDocument(item: EmployeeDocument): boolean {
    return (
      this.canReadConfidentialEmployeeDocuments() &&
      ['Confidential', 'Restricted'].includes(item.confidentiality) &&
      !item.documentReferenceId
    );
  }

  private runDocumentAction(request: import('rxjs').Observable<unknown>): void {
    this.saving.set(true);
    this.actionErrors.set([]);
    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.drawer.set(null);
        this.selectedEmployeeDocument.set(null);
        this.reload();
      },
      error: (e) => {
        this.actionErrors.set(this.apiErrors.getMessages(e));
        this.saving.set(false);
      },
    });
  }

  private runReviewAction(request: import('rxjs').Observable<unknown>): void {
    this.saving.set(true);
    this.actionErrors.set([]);
    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.drawer.set(null);
        this.selectedPerformanceReview.set(null);
        this.selectedPerformanceReviewCriterion.set(null);
        this.reload();
      },
      error: (e) => {
        this.actionErrors.set(this.apiErrors.getMessages(e));
        this.saving.set(false);
      },
    });
  }

  private runEquipmentAction(request: import('rxjs').Observable<unknown>): void {
    this.saving.set(true);
    this.actionErrors.set([]);
    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.drawer.set(null);
        this.selectedEquipmentAssignment.set(null);
        this.reload();
      },
      error: (e) => {
        this.actionErrors.set(this.apiErrors.getMessages(e));
        this.saving.set(false);
      },
    });
  }

  private runTimeAction(request: import('rxjs').Observable<unknown>): void {
    this.saving.set(true);
    this.actionErrors.set([]);
    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.drawer.set(null);
        this.selectedWorkingTimePolicy.set(null);
        this.selectedTimesheet.set(null);
        this.selectedTimesheetEntry.set(null);
        this.reload();
      },
      error: (e) => {
        this.actionErrors.set(this.apiErrors.getMessages(e));
        this.saving.set(false);
      },
    });
  }
  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }
  private daysAgo(days: number): string {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().slice(0, 10);
  }

  openDrawer(kind: Exclude<EmployeeDrawerKind, null>): void {
    this.actionErrors.set([]);
    this.suspendForm.reset({ reason: '' });
    this.terminationForm.reset({
      plannedEndDate: this.employee()?.employmentEndDate ?? '',
      reason: '',
    });
    this.drawer.set(kind);
  }

  closeDrawer(): void {
    if (this.saving()) return;
    this.drawer.set(null);
    this.selectedBranchAssignment.set(null);
    this.selectedJobPositionAssignment.set(null);
    this.selectedQualification.set(null);
    this.selectedInstructorAuthorization.set(null);
    this.selectedEmploymentContract.set(null);
    this.selectedLeaveRequest.set(null);
    this.selectedLeavePolicy.set(null);
    this.selectedPerformanceReview.set(null);
    this.selectedPerformanceReviewCriterion.set(null);
    this.selectedEmployeeDocument.set(null);
    this.selectedProfessionalRestriction.set(null);
    this.selectedOffboardingItem.set(null);
    this.actionErrors.set([]);
  }

  openProfessionalRestrictionCreateDrawer(): void {
    if (!this.canManageProfessionalRestrictions() || this.employee()?.status === 'Ended') return;
    this.selectedProfessionalRestriction.set(null);
    this.professionalRestrictionForm.reset({
      activity: 'Teaching',
      source: 'InternalDecision',
      startDate: this.today(),
      endDate: '',
      reason: '',
      countryCode: 'FR',
      licenseCategoryCode: 'B',
      branchId: '',
      supportingDocumentReferenceId: '',
    });
    this.openDrawer('restrictionCreate');
  }
  openProfessionalRestrictionEditDrawer(item: ProfessionalRestriction): void {
    if (!this.canManageProfessionalRestrictions() || item.status !== 'Planned') return;
    this.selectedProfessionalRestriction.set(item);
    this.professionalRestrictionForm.reset({
      activity: item.activity as ProfessionalRestrictionActivity,
      source: item.source as ProfessionalRestrictionSource,
      startDate: item.startDate,
      endDate: item.endDate ?? '',
      reason: item.reason,
      countryCode: item.countryCode ?? '',
      licenseCategoryCode: item.licenseCategoryCode ?? '',
      branchId: item.branchId ?? '',
      supportingDocumentReferenceId: item.supportingDocumentReferenceId ?? '',
    });
    this.openDrawer('restrictionEdit');
  }
  openProfessionalRestrictionActionDrawer(
    item: ProfessionalRestriction,
    action: 'activate' | 'lift' | 'cancel',
  ): void {
    this.selectedProfessionalRestriction.set(item);
    this.professionalRestrictionReasonForm.reset({ reason: '' });
    this.openDrawer(
      `restriction${action.charAt(0).toUpperCase()}${action.slice(1)}` as Exclude<
        EmployeeDrawerKind,
        null
      >,
    );
  }
  saveProfessionalRestriction(): void {
    if (this.professionalRestrictionForm.invalid || this.saving()) {
      this.professionalRestrictionForm.markAllAsTouched();
      return;
    }
    const v = this.professionalRestrictionForm.getRawValue();
    const payload = {
      startDate: v.startDate,
      endDate: v.endDate || null,
      reason: v.reason.trim(),
      countryCode: v.countryCode.trim().toUpperCase() || null,
      licenseCategoryCode: v.licenseCategoryCode.trim().toUpperCase() || null,
      branchId: v.branchId || null,
      supportingDocumentReferenceId: v.supportingDocumentReferenceId.trim() || null,
    };
    const selected = this.selectedProfessionalRestriction();
    if (selected) {
      this.runRestrictionAction(this.api.updateProfessionalRestriction(selected.id, payload));
      return;
    }
    this.runRestrictionAction(
      this.api.createProfessionalRestriction({
        employeeId: this.employeeId,
        activity: v.activity,
        source: v.source,
        ...payload,
      }),
    );
  }
  activateProfessionalRestriction(): void {
    const item = this.selectedProfessionalRestriction();
    if (item) this.runRestrictionAction(this.api.activateProfessionalRestriction(item.id));
  }
  liftProfessionalRestriction(): void {
    const item = this.selectedProfessionalRestriction();
    if (!item || this.professionalRestrictionReasonForm.invalid) {
      this.professionalRestrictionReasonForm.markAllAsTouched();
      return;
    }
    this.runRestrictionAction(
      this.api.liftProfessionalRestriction(
        item.id,
        this.professionalRestrictionReasonForm.getRawValue().reason.trim(),
      ),
    );
  }
  cancelProfessionalRestriction(): void {
    const item = this.selectedProfessionalRestriction();
    if (!item || this.professionalRestrictionReasonForm.invalid) {
      this.professionalRestrictionReasonForm.markAllAsTouched();
      return;
    }
    this.runRestrictionAction(
      this.api.cancelProfessionalRestriction(
        item.id,
        this.professionalRestrictionReasonForm.getRawValue().reason.trim(),
      ),
    );
  }
  professionalRestrictionTone(status: string): DriveOsStatusTone {
    switch (status) {
      case 'Active':
        return 'danger';
      case 'Planned':
        return 'warning';
      case 'Lifted':
        return 'success';
      case 'Cancelled':
        return 'neutral';
      default:
        return 'neutral';
    }
  }
  professionalRestrictionScope(item: ProfessionalRestriction): string {
    const parts: string[] = [];
    if (item.countryCode) parts.push(item.countryCode);
    if (item.licenseCategoryCode) parts.push(item.licenseCategoryCode);
    if (item.branchId) parts.push(this.branchName(item.branchId));
    return parts.length ? parts.join(' · ') : '—';
  }

  openOffboardingRefreshDrawer(): void {
    if (!this.canManageOffboarding() || !this.offboarding()) return;
    this.openDrawer('offboardingRefresh');
  }
  openOffboardingItemDrawer(item: OffboardingChecklistItem): void {
    if (!this.canManageOffboarding() || item.isAutomatic || item.status !== 'Pending') return;
    this.selectedOffboardingItem.set(item);
    this.offboardingItemForm.reset({ note: item.note ?? '' });
    this.openDrawer('offboardingCompleteItem');
  }
  openOffboardingWaiveDrawer(item: OffboardingChecklistItem): void {
    if (!this.canWaiveOffboarding() || item.status !== 'Pending') return;
    this.selectedOffboardingItem.set(item);
    this.offboardingWaiverForm.reset({ reason: '' });
    this.openDrawer('offboardingWaiveItem');
  }
  openOffboardingCompleteDrawer(): void {
    if (!this.canCompleteOffboarding() || this.offboarding()?.status !== 'ReadyToComplete') return;
    this.offboardingCompletionForm.reset({ reason: this.offboarding()?.reason ?? '' });
    this.openDrawer('offboardingComplete');
  }
  refreshOffboarding(): void {
    this.runOffboardingAction(this.api.refreshOffboarding(this.employeeId));
  }
  completeOffboardingItem(): void {
    const item = this.selectedOffboardingItem();
    if (!item || this.offboardingItemForm.invalid) return;
    this.runOffboardingAction(
      this.api.completeOffboardingItem(
        this.employeeId,
        item.kind,
        this.offboardingItemForm.getRawValue().note.trim() || null,
      ),
    );
  }
  waiveOffboardingItem(): void {
    const item = this.selectedOffboardingItem();
    if (!item || this.offboardingWaiverForm.invalid) {
      this.offboardingWaiverForm.markAllAsTouched();
      return;
    }
    this.runOffboardingAction(
      this.api.waiveOffboardingItem(
        this.employeeId,
        item.kind,
        this.offboardingWaiverForm.getRawValue().reason.trim(),
      ),
    );
  }
  completeOffboarding(): void {
    if (this.offboardingCompletionForm.invalid) {
      this.offboardingCompletionForm.markAllAsTouched();
      return;
    }
    this.runOffboardingAction(
      this.api.completeOffboarding(
        this.employeeId,
        this.offboardingCompletionForm.getRawValue().reason.trim(),
      ),
    );
  }
  offboardingTone(status: string): DriveOsStatusTone {
    switch (status) {
      case 'ReadyToComplete':
        return 'success';
      case 'InProgress':
        return 'warning';
      case 'Completed':
        return 'success';
      case 'Cancelled':
        return 'neutral';
      default:
        return 'neutral';
    }
  }
  offboardingItemTone(status: string): DriveOsStatusTone {
    switch (status) {
      case 'Completed':
        return 'success';
      case 'Waived':
        return 'warning';
      case 'Pending':
        return 'neutral';
      default:
        return 'neutral';
    }
  }
  offboardingCompletedCount(): number {
    return (
      this.offboarding()?.items.filter((x) => x.status === 'Completed' || x.status === 'Waived')
        .length ?? 0
    );
  }

  saveIdentity(): void {
    if (this.identityForm.invalid || this.saving()) {
      this.identityForm.markAllAsTouched();
      return;
    }
    const value = this.identityForm.getRawValue();
    this.runAction(
      this.api.updateEmployeeIdentity(this.employeeId, {
        employeeNumber: value.employeeNumber.trim(),
        userId: value.userId.trim() || null,
        employmentStartDate: value.employmentStartDate,
        employmentEndDate: value.employmentEndDate || null,
      }),
    );
  }

  confirmLifecycleAction(): void {
    if (this.saving()) return;
    switch (this.drawer()) {
      case 'onboarding':
        this.runAction(this.api.startOnboarding(this.employeeId));
        return;
      case 'activate':
        this.runAction(this.api.activateEmployee(this.employeeId));
        return;
      case 'reactivate':
        this.runAction(this.api.reactivateEmployee(this.employeeId));
        return;
      case 'suspend': {
        if (this.suspendForm.invalid) {
          this.suspendForm.markAllAsTouched();
          return;
        }
        this.runAction(
          this.api.suspendEmployee(this.employeeId, this.suspendForm.getRawValue().reason.trim()),
        );
        return;
      }
      case 'termination': {
        if (this.terminationForm.invalid) {
          this.terminationForm.markAllAsTouched();
          return;
        }
        const value = this.terminationForm.getRawValue();
        this.runAction(
          this.api.startTermination(this.employeeId, value.plannedEndDate, value.reason.trim()),
        );
        return;
      }
    }
  }

  availableAction(action: EmployeeLifecycleDrawerKind, item: EmployeeSummary): boolean {
    switch (action) {
      case 'onboarding':
        return item.status === 'Draft' && this.canOnboard();
      case 'activate':
        return item.status === 'Onboarding' && this.canActivate();
      case 'suspend':
        return item.status === 'Active' && this.canSuspend();
      case 'reactivate':
        return item.status === 'Suspended' && this.canReactivate();
      case 'termination':
        return ['Active', 'Suspended', 'OnLeave'].includes(item.status) && this.canTerminate();
    }
  }

  drawerTitleKey(): string {
    const kind = this.drawer();
    return kind
      ? `workforce.employeeDetail.drawers.${kind}.title`
      : 'workforce.employeeDetail.title';
  }

  drawerDescriptionKey(): string {
    const kind = this.drawer();
    return kind
      ? `workforce.employeeDetail.drawers.${kind}.description`
      : 'workforce.employeeDetail.title';
  }

  private nextDay(value: string): string {
    const date = new Date(`${value}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + 1);
    return date.toISOString().slice(0, 10);
  }

  statusTone(status: string): DriveOsStatusTone {
    switch (status) {
      case 'Active':
        return 'success';
      case 'Onboarding':
        return 'info';
      case 'Suspended':
      case 'Ending':
        return 'warning';
      case 'Ended':
        return 'neutral';
      default:
        return 'neutral';
    }
  }

  private runBranchAction(request: import('rxjs').Observable<unknown>): void {
    this.saving.set(true);
    this.actionErrors.set([]);
    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.drawer.set(null);
        this.selectedBranchAssignment.set(null);
        this.selectedEmploymentContract.set(null);
        this.selectedLeaveRequest.set(null);
        this.selectedLeavePolicy.set(null);
        this.reload();
      },
      error: (error) => {
        this.actionErrors.set(this.apiErrors.getMessages(error));
        this.saving.set(false);
      },
    });
  }

  private runJobPositionAction(request: import('rxjs').Observable<unknown>): void {
    this.saving.set(true);
    this.actionErrors.set([]);
    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.drawer.set(null);
        this.selectedJobPositionAssignment.set(null);
        this.reload();
      },
      error: (error) => {
        this.actionErrors.set(this.apiErrors.getMessages(error));
        this.saving.set(false);
      },
    });
  }

  private runEmploymentContractAction(request: import('rxjs').Observable<unknown>): void {
    this.saving.set(true);
    this.actionErrors.set([]);
    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.drawer.set(null);
        this.selectedEmploymentContract.set(null);
        this.reload();
      },
      error: (error) => {
        this.actionErrors.set(this.apiErrors.getMessages(error));
        this.saving.set(false);
      },
    });
  }

  private runCredentialAction(request: import('rxjs').Observable<unknown>): void {
    this.saving.set(true);
    this.actionErrors.set([]);
    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.drawer.set(null);
        this.selectedQualification.set(null);
        this.selectedInstructorAuthorization.set(null);
        this.reload();
      },
      error: (error) => {
        this.actionErrors.set(this.apiErrors.getMessages(error));
        this.saving.set(false);
      },
    });
  }

  private runLeaveAction(request: import('rxjs').Observable<unknown>): void {
    this.saving.set(true);
    this.actionErrors.set([]);
    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.drawer.set(null);
        this.selectedLeaveRequest.set(null);
        this.selectedLeavePolicy.set(null);
        this.reload();
      },
      error: (error) => {
        this.actionErrors.set(this.apiErrors.getMessages(error));
        this.saving.set(false);
      },
    });
  }

  private runRestrictionAction(request: import('rxjs').Observable<unknown>): void {
    this.saving.set(true);
    this.actionErrors.set([]);
    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.drawer.set(null);
        this.selectedProfessionalRestriction.set(null);
        this.reload();
      },
      error: (error) => {
        this.actionErrors.set(this.apiErrors.getMessages(error));
        this.saving.set(false);
      },
    });
  }

  private runOffboardingAction(request: import('rxjs').Observable<unknown>): void {
    this.saving.set(true);
    this.actionErrors.set([]);
    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.drawer.set(null);
        this.selectedOffboardingItem.set(null);
        this.reload();
      },
      error: (error) => {
        this.actionErrors.set(this.apiErrors.getMessages(error));
        this.saving.set(false);
      },
    });
  }

  private runAction(request: import('rxjs').Observable<void>): void {
    this.saving.set(true);
    this.actionErrors.set([]);
    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.drawer.set(null);
        this.selectedBranchAssignment.set(null);
        this.selectedEmploymentContract.set(null);
        this.selectedLeaveRequest.set(null);
        this.selectedLeavePolicy.set(null);
        this.reload();
      },
      error: (error) => {
        this.actionErrors.set(this.apiErrors.getMessages(error));
        this.saving.set(false);
      },
    });
  }
}
