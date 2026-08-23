import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_CONFIG, ApiConfig } from '../../../core/config/api-config';
import { EmployeeBranchAssignment, EmployeeJobPositionAssignment, EmployeeQualification, EmployeeSummary, EmploymentContract, EmploymentContractType, InstructorAuthorization, JobPosition, LeaveCategory, LeaveDayPortion, LeavePolicy, LeaveRequest, QualificationSource, Timesheet, TimesheetActivityType, TimesheetEntrySource, EquipmentAssignment, EquipmentCondition, EquipmentResourceType, PerformanceReview, EmployeeDocument, EmployeeDocumentCategory, EmployeeDocumentConfidentiality, ProfessionalRestriction, ProfessionalRestrictionActivity, ProfessionalRestrictionSource, OffboardingProcess, OffboardingChecklistItemKind, WorkingTimePolicy, WorkingTimeSummary, WorkforceAnalytics, WorkforceDashboard } from '../models/workforce.models';

export interface RehireEmployeeRequest {
  readonly employeeId?: string | null;
  readonly userId: string | null;
  readonly reusePreviousUserLink: boolean;
  readonly employeeNumber: string;
  readonly employmentStartDate: string;
  readonly employmentEndDate: string | null;
}

export interface RehireEmployeeResponse {
  readonly id: string;
  readonly rehiredFromEmployeeId: string;
}

export interface UpdateEmployeeIdentityRequest {
  readonly userId: string | null;
  readonly employeeNumber: string;
  readonly employmentStartDate: string;
  readonly employmentEndDate: string | null;
}

export interface EmployeeLifecycleReasonRequest {
  readonly reason: string;
}

export interface StartEmploymentTerminationRequest {
  readonly plannedEndDate: string;
  readonly reason: string;
}

export interface AddEmployeeBranchAssignmentRequest {
  readonly assignmentId?: string | null;
  readonly branchId: string;
  readonly startDate: string;
  readonly endDate: string | null;
  readonly isPrimary: boolean;
}

export interface UpdateEmployeeBranchAssignmentRequest {
  readonly startDate: string;
  readonly endDate: string | null;
  readonly isPrimary: boolean;
}


export interface CreateJobPositionRequest { readonly jobPositionId?: string | null; readonly code: string; readonly name: string; readonly description: string | null; readonly professionalFunction: string; }
export interface UpdateJobPositionRequest { readonly code: string; readonly name: string; readonly description: string | null; readonly professionalFunction: string; }
export interface AddEmployeeJobPositionAssignmentRequest { readonly assignmentId?: string | null; readonly jobPositionId: string; readonly branchId: string | null; readonly startDate: string; readonly endDate: string | null; readonly isPrimary: boolean; }
export interface UpdateEmployeeJobPositionAssignmentRequest { readonly startDate: string; readonly endDate: string | null; readonly isPrimary: boolean; }

export interface DeclareEmployeeQualificationRequest { readonly countryCode: string; readonly qualificationType: string; readonly title: string; readonly identifier: string | null; readonly issuingAuthority: string | null; readonly issuedOn: string | null; readonly expiresOn: string | null; readonly source: QualificationSource; }
export interface DeclareInstructorAuthorizationRequest { readonly countryCode: string; readonly authorizationType: string; readonly identifier: string; readonly issuingAuthority: string; readonly jurisdictionCode: string | null; readonly licenseCategoryCode: string; readonly issuedOn: string | null; readonly expiresOn: string | null; readonly source: QualificationSource; }
export interface VerifyWorkforceCredentialRequest { readonly verificationMethod: string; readonly reason: string | null; }
export interface RejectWorkforceCredentialRequest { readonly reason: string; }
export interface AddEmploymentContractRequest { readonly contractType: EmploymentContractType; readonly startDate: string; readonly endDate: string | null; readonly contractualWeeklyHours: number | null; readonly primaryJobPositionId: string | null; }
export interface UpdateEmploymentContractRequest { readonly startDate: string; readonly endDate: string | null; readonly contractualWeeklyHours: number | null; readonly primaryJobPositionId: string | null; }
export interface LinkEmploymentContractDocumentRequest { readonly contractDocumentId: string; readonly signatureProcessId: string | null; }

export interface LeavePolicyRequest { readonly countryCode: string; readonly code: string; readonly name: string; readonly category: LeaveCategory; readonly isPaid: boolean; readonly requiresApproval: boolean; readonly requiresEvidence: boolean; readonly allowHalfDay: boolean; readonly minimumNoticeDays: number | null; readonly maximumConsecutiveDays: number | null; }
export interface CreateLeaveRequestRequest { readonly employeeId: string; readonly leavePolicyId: string; readonly startDate: string; readonly endDate: string; readonly startPortion: LeaveDayPortion; readonly endPortion: LeaveDayPortion; readonly reason: string | null; readonly evidenceDocumentId: string | null; }
export interface UpdateLeaveRequestRequest { readonly startDate: string; readonly endDate: string; readonly startPortion: LeaveDayPortion; readonly endPortion: LeaveDayPortion; readonly reason: string | null; readonly evidenceDocumentId: string | null; }

export interface WorkingTimePolicyRequest { readonly id?: string | null; readonly effectiveFrom: string; readonly effectiveTo: string | null; readonly contractualWeeklyHours: number; readonly contractualDailyHours: number | null; readonly maxWorkingDaysPerWeek: number | null; }
export interface CreateTimesheetRequest { readonly id?: string | null; readonly employeeId: string; readonly periodFrom: string; readonly periodTo: string; }
export interface EquipmentAssignmentRequest { readonly id?: string | null; readonly employeeId: string; readonly resourceType: EquipmentResourceType; readonly resourceId: string; readonly startDate: string; readonly plannedEndDate: string | null; }
export interface UpdateEquipmentAssignmentRequest { readonly startDate: string; readonly plannedEndDate: string | null; }
export interface EquipmentConditionRequest { readonly condition: EquipmentCondition; readonly notes: string | null; }
export interface ReturnEquipmentAssignmentRequest extends EquipmentConditionRequest { readonly returnedOn: string; }
export interface CreatePerformanceReviewRequest { readonly employeeId: string; readonly evaluatorUserId: string; readonly periodFrom: string; readonly periodTo: string; readonly title: string; }
export interface AddPerformanceReviewCriterionRequest { readonly code: string; readonly label: string; readonly weight: number; readonly comment: string | null; }
export interface RatePerformanceReviewCriterionRequest { readonly rating: number; readonly comment: string | null; }
export interface SetPerformanceReviewSummaryRequest { readonly overallAssessment: string; readonly objectives: string | null; }
export interface EmployeeDocumentRequest { readonly employeeId: string; readonly documentReferenceId: string; readonly category: EmployeeDocumentCategory; readonly documentTypeCode: string; readonly title: string; readonly confidentiality: EmployeeDocumentConfidentiality; readonly issuedOn: string | null; readonly validFrom: string | null; readonly expiresOn: string | null; readonly issuer: string | null; readonly referenceNumber: string | null; }
export interface UpdateEmployeeDocumentRequest { readonly category: EmployeeDocumentCategory; readonly documentTypeCode: string; readonly title: string; readonly confidentiality: EmployeeDocumentConfidentiality; readonly issuedOn: string | null; readonly validFrom: string | null; readonly expiresOn: string | null; readonly issuer: string | null; readonly referenceNumber: string | null; }

export interface ProfessionalRestrictionRequest { readonly employeeId: string; readonly activity: ProfessionalRestrictionActivity; readonly source: ProfessionalRestrictionSource; readonly startDate: string; readonly endDate: string | null; readonly reason: string; readonly countryCode: string | null; readonly licenseCategoryCode: string | null; readonly branchId: string | null; readonly supportingDocumentReferenceId: string | null; }
export interface UpdateProfessionalRestrictionRequest { readonly startDate: string; readonly endDate: string | null; readonly reason: string; readonly countryCode: string | null; readonly licenseCategoryCode: string | null; readonly branchId: string | null; readonly supportingDocumentReferenceId: string | null; }

export interface TimesheetEntryRequest { readonly id?: string | null; readonly date: string; readonly activityType: TimesheetActivityType; readonly hours: number; readonly description: string | null; readonly source: TimesheetEntrySource; readonly sourceReference: string | null; }


@Injectable({ providedIn: 'root' })
export class WorkforceApiService {
  private readonly http = inject(HttpClient);
  private readonly config = inject<ApiConfig>(API_CONFIG);
  private readonly baseUrl = `${this.config.baseUrl.replace(/\/$/, '')}/workforce`;

  getDashboard(alertWindowDays = 30): Observable<WorkforceDashboard> {
    const params = new HttpParams().set('alertWindowDays', alertWindowDays);
    return this.http.get<WorkforceDashboard>(`${this.baseUrl}/dashboard/`, { params });
  }

  getEmployees(status?: string | null): Observable<readonly EmployeeSummary[]> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    return this.http.get<readonly EmployeeSummary[]>(`${this.baseUrl}/employees/`, { params });
  }

  getEmployee(employeeId: string): Observable<EmployeeSummary> {
    return this.http.get<EmployeeSummary>(`${this.baseUrl}/employees/${employeeId}`);
  }

  getEmployeeHistory(employeeId: string): Observable<readonly EmployeeSummary[]> {
    return this.http.get<readonly EmployeeSummary[]>(`${this.baseUrl}/employees/${employeeId}/history`);
  }

  rehireEmployee(employeeId: string, request: RehireEmployeeRequest): Observable<RehireEmployeeResponse> {
    return this.http.post<RehireEmployeeResponse>(`${this.baseUrl}/employees/${employeeId}/rehire`, request);
  }

  updateEmployeeIdentity(employeeId: string, request: UpdateEmployeeIdentityRequest): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/employees/${employeeId}/identity`, request);
  }

  startOnboarding(employeeId: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/employees/${employeeId}/onboarding/start`, {});
  }

  activateEmployee(employeeId: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/employees/${employeeId}/activate`, {});
  }

  suspendEmployee(employeeId: string, reason: string): Observable<void> {
    const request: EmployeeLifecycleReasonRequest = { reason };
    return this.http.post<void>(`${this.baseUrl}/employees/${employeeId}/suspend`, request);
  }

  reactivateEmployee(employeeId: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/employees/${employeeId}/reactivate`, {});
  }

  startTermination(employeeId: string, plannedEndDate: string, reason: string): Observable<void> {
    const request: StartEmploymentTerminationRequest = { plannedEndDate, reason };
    return this.http.post<void>(`${this.baseUrl}/employees/${employeeId}/termination/start`, request);
  }

  getBranchAssignments(employeeId: string): Observable<readonly EmployeeBranchAssignment[]> {
    return this.http.get<readonly EmployeeBranchAssignment[]>(`${this.baseUrl}/employees/${employeeId}/branch-assignments`);
  }

  addBranchAssignment(employeeId: string, request: AddEmployeeBranchAssignmentRequest): Observable<{ readonly id: string }> {
    return this.http.post<{ readonly id: string }>(`${this.baseUrl}/employees/${employeeId}/branch-assignments`, request);
  }

  updateBranchAssignment(employeeId: string, assignmentId: string, request: UpdateEmployeeBranchAssignmentRequest): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/employees/${employeeId}/branch-assignments/${assignmentId}`, request);
  }

  endBranchAssignment(employeeId: string, assignmentId: string, endDate: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/employees/${employeeId}/branch-assignments/${assignmentId}/end`, { endDate });
  }

  cancelBranchAssignment(employeeId: string, assignmentId: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/employees/${employeeId}/branch-assignments/${assignmentId}/cancel`, {});
  }

  getJobPositions(status?: string | null): Observable<readonly JobPosition[]> { let params = new HttpParams(); if (status) params = params.set('status', status); return this.http.get<readonly JobPosition[]>(`${this.baseUrl}/job-positions/`, { params }); }
  createJobPosition(request: CreateJobPositionRequest): Observable<{ readonly id: string }> { return this.http.post<{ readonly id: string }>(`${this.baseUrl}/job-positions/`, request); }
  updateJobPosition(id: string, request: UpdateJobPositionRequest): Observable<void> { return this.http.put<void>(`${this.baseUrl}/job-positions/${id}`, request); }
  deactivateJobPosition(id: string): Observable<void> { return this.http.post<void>(`${this.baseUrl}/job-positions/${id}/deactivate`, {}); }
  reactivateJobPosition(id: string): Observable<void> { return this.http.post<void>(`${this.baseUrl}/job-positions/${id}/reactivate`, {}); }
  getJobPositionAssignments(employeeId: string): Observable<readonly EmployeeJobPositionAssignment[]> { return this.http.get<readonly EmployeeJobPositionAssignment[]>(`${this.baseUrl}/employees/${employeeId}/job-position-assignments`); }
  addJobPositionAssignment(employeeId: string, request: AddEmployeeJobPositionAssignmentRequest): Observable<{ readonly id: string }> { return this.http.post<{ readonly id: string }>(`${this.baseUrl}/employees/${employeeId}/job-position-assignments`, request); }
  updateJobPositionAssignment(employeeId: string, assignmentId: string, request: UpdateEmployeeJobPositionAssignmentRequest): Observable<void> { return this.http.put<void>(`${this.baseUrl}/employees/${employeeId}/job-position-assignments/${assignmentId}`, request); }
  endJobPositionAssignment(employeeId: string, assignmentId: string, endDate: string): Observable<void> { return this.http.post<void>(`${this.baseUrl}/employees/${employeeId}/job-position-assignments/${assignmentId}/end`, { endDate }); }
  cancelJobPositionAssignment(employeeId: string, assignmentId: string): Observable<void> { return this.http.post<void>(`${this.baseUrl}/employees/${employeeId}/job-position-assignments/${assignmentId}/cancel`, {}); }


  getQualifications(employeeId: string): Observable<readonly EmployeeQualification[]> { return this.http.get<readonly EmployeeQualification[]>(`${this.baseUrl}/employees/${employeeId}/qualifications`); }
  declareQualification(employeeId: string, request: DeclareEmployeeQualificationRequest): Observable<{ readonly id: string }> { return this.http.post<{ readonly id: string }>(`${this.baseUrl}/employees/${employeeId}/qualifications`, request); }
  verifyQualification(employeeId: string, qualificationId: string, request: VerifyWorkforceCredentialRequest): Observable<void> { return this.http.post<void>(`${this.baseUrl}/employees/${employeeId}/qualifications/${qualificationId}/verify`, request); }
  rejectQualification(employeeId: string, qualificationId: string, request: RejectWorkforceCredentialRequest): Observable<void> { return this.http.post<void>(`${this.baseUrl}/employees/${employeeId}/qualifications/${qualificationId}/reject`, request); }

  getInstructorAuthorizations(employeeId: string): Observable<readonly InstructorAuthorization[]> { return this.http.get<readonly InstructorAuthorization[]>(`${this.baseUrl}/employees/${employeeId}/instructor-authorizations`); }
  declareInstructorAuthorization(employeeId: string, request: DeclareInstructorAuthorizationRequest): Observable<{ readonly id: string }> { return this.http.post<{ readonly id: string }>(`${this.baseUrl}/employees/${employeeId}/instructor-authorizations`, request); }
  verifyInstructorAuthorization(employeeId: string, authorizationId: string, request: VerifyWorkforceCredentialRequest): Observable<void> { return this.http.post<void>(`${this.baseUrl}/employees/${employeeId}/instructor-authorizations/${authorizationId}/verify`, request); }
  rejectInstructorAuthorization(employeeId: string, authorizationId: string, request: RejectWorkforceCredentialRequest): Observable<void> { return this.http.post<void>(`${this.baseUrl}/employees/${employeeId}/instructor-authorizations/${authorizationId}/reject`, request); }

  getEmploymentContracts(employeeId: string): Observable<readonly EmploymentContract[]> { return this.http.get<readonly EmploymentContract[]>(`${this.baseUrl}/employees/${employeeId}/employment-contracts`); }
  addEmploymentContract(employeeId: string, request: AddEmploymentContractRequest): Observable<{ readonly id: string }> { return this.http.post<{ readonly id: string }>(`${this.baseUrl}/employees/${employeeId}/employment-contracts`, request); }
  updateEmploymentContract(employeeId: string, contractId: string, request: UpdateEmploymentContractRequest): Observable<void> { return this.http.put<void>(`${this.baseUrl}/employees/${employeeId}/employment-contracts/${contractId}`, request); }
  linkEmploymentContractDocument(employeeId: string, contractId: string, request: LinkEmploymentContractDocumentRequest): Observable<void> { return this.http.post<void>(`${this.baseUrl}/employees/${employeeId}/employment-contracts/${contractId}/document`, request); }
  markEmploymentContractSigned(employeeId: string, contractId: string, signatureProcessId: string): Observable<void> { return this.http.post<void>(`${this.baseUrl}/employees/${employeeId}/employment-contracts/${contractId}/signed`, { signatureProcessId }); }
  activateEmploymentContract(employeeId: string, contractId: string, activationDate: string): Observable<void> { return this.http.post<void>(`${this.baseUrl}/employees/${employeeId}/employment-contracts/${contractId}/activate`, { activationDate }); }
  terminateEmploymentContract(employeeId: string, contractId: string, endDate: string): Observable<void> { return this.http.post<void>(`${this.baseUrl}/employees/${employeeId}/employment-contracts/${contractId}/terminate`, { endDate }); }
  cancelEmploymentContract(employeeId: string, contractId: string): Observable<void> { return this.http.post<void>(`${this.baseUrl}/employees/${employeeId}/employment-contracts/${contractId}/cancel`, {}); }

  getLeavePolicies(status?: string | null): Observable<readonly LeavePolicy[]> { let params = new HttpParams(); if (status) params = params.set('status', status); return this.http.get<readonly LeavePolicy[]>(`${this.baseUrl}/leave-policies/`, { params }); }
  createLeavePolicy(request: LeavePolicyRequest): Observable<{ readonly id: string }> { return this.http.post<{ readonly id: string }>(`${this.baseUrl}/leave-policies/`, request); }
  updateLeavePolicy(id: string, request: LeavePolicyRequest): Observable<void> { return this.http.put<void>(`${this.baseUrl}/leave-policies/${id}`, request); }
  deactivateLeavePolicy(id: string): Observable<void> { return this.http.post<void>(`${this.baseUrl}/leave-policies/${id}/deactivate`, {}); }
  reactivateLeavePolicy(id: string): Observable<void> { return this.http.post<void>(`${this.baseUrl}/leave-policies/${id}/reactivate`, {}); }
  getLeaveRequests(employeeId?: string | null, status?: string | null): Observable<readonly LeaveRequest[]> { let params = new HttpParams(); if (employeeId) params = params.set('employeeId', employeeId); if (status) params = params.set('status', status); return this.http.get<readonly LeaveRequest[]>(`${this.baseUrl}/leave-requests/`, { params }); }
  createLeaveRequest(request: CreateLeaveRequestRequest): Observable<{ readonly id: string }> { return this.http.post<{ readonly id: string }>(`${this.baseUrl}/leave-requests/`, request); }
  updateLeaveRequest(id: string, request: UpdateLeaveRequestRequest): Observable<void> { return this.http.put<void>(`${this.baseUrl}/leave-requests/${id}`, request); }
  submitLeaveRequest(id: string): Observable<void> { return this.http.post<void>(`${this.baseUrl}/leave-requests/${id}/submit`, {}); }
  approveLeaveRequest(id: string, reason: string | null): Observable<void> { return this.http.post<void>(`${this.baseUrl}/leave-requests/${id}/approve`, { reason }); }
  rejectLeaveRequest(id: string, reason: string): Observable<void> { return this.http.post<void>(`${this.baseUrl}/leave-requests/${id}/reject`, { reason }); }
  cancelLeaveRequest(id: string, reason: string | null): Observable<void> { return this.http.post<void>(`${this.baseUrl}/leave-requests/${id}/cancel`, { reason }); }

  getWorkingTimePolicies(employeeId: string): Observable<readonly WorkingTimePolicy[]> { return this.http.get<readonly WorkingTimePolicy[]>(`${this.baseUrl}/employees/${employeeId}/working-time-policies`); }
  createWorkingTimePolicy(employeeId: string, request: WorkingTimePolicyRequest): Observable<{ readonly id: string }> { return this.http.post<{ readonly id: string }>(`${this.baseUrl}/employees/${employeeId}/working-time-policies`, request); }
  updateWorkingTimePolicy(id: string, request: WorkingTimePolicyRequest): Observable<void> { return this.http.put<void>(`${this.baseUrl}/working-time-policies/${id}`, request); }
  deactivateWorkingTimePolicy(id: string): Observable<void> { return this.http.post<void>(`${this.baseUrl}/working-time-policies/${id}/deactivate`, {}); }
  getWorkingTimeSummary(employeeId: string, from: string, to: string): Observable<WorkingTimeSummary> { const params = new HttpParams().set('from', from).set('to', to); return this.http.get<WorkingTimeSummary>(`${this.baseUrl}/employees/${employeeId}/working-time-summary`, { params }); }

  getTimesheets(employeeId?: string | null, status?: string | null, from?: string | null, to?: string | null): Observable<readonly Timesheet[]> { let params = new HttpParams(); if (employeeId) params = params.set('employeeId', employeeId); if (status) params = params.set('status', status); if (from) params = params.set('from', from); if (to) params = params.set('to', to); return this.http.get<readonly Timesheet[]>(`${this.baseUrl}/timesheets/`, { params }); }
  getTimesheet(id: string): Observable<Timesheet> { return this.http.get<Timesheet>(`${this.baseUrl}/timesheets/${id}`); }
  createTimesheet(request: CreateTimesheetRequest): Observable<{ readonly id: string }> { return this.http.post<{ readonly id: string }>(`${this.baseUrl}/timesheets/`, request); }
  addTimesheetEntry(id: string, request: TimesheetEntryRequest): Observable<{ readonly id: string }> { return this.http.post<{ readonly id: string }>(`${this.baseUrl}/timesheets/${id}/entries`, request); }
  updateTimesheetEntry(id: string, entryId: string, request: TimesheetEntryRequest): Observable<void> { return this.http.put<void>(`${this.baseUrl}/timesheets/${id}/entries/${entryId}`, request); }
  removeTimesheetEntry(id: string, entryId: string): Observable<void> { return this.http.delete<void>(`${this.baseUrl}/timesheets/${id}/entries/${entryId}`); }
  submitTimesheet(id: string): Observable<void> { return this.http.post<void>(`${this.baseUrl}/timesheets/${id}/submit`, {}); }
  startTimesheetReview(id: string): Observable<void> { return this.http.post<void>(`${this.baseUrl}/timesheets/${id}/review/start`, {}); }
  approveTimesheet(id: string, reason: string | null): Observable<void> { return this.http.post<void>(`${this.baseUrl}/timesheets/${id}/approve`, { reason }); }
  rejectTimesheet(id: string, reason: string): Observable<void> { return this.http.post<void>(`${this.baseUrl}/timesheets/${id}/reject`, { reason }); }
  lockTimesheet(id: string): Observable<void> { return this.http.post<void>(`${this.baseUrl}/timesheets/${id}/lock`, {}); }

  getEquipmentAssignments(employeeId?: string | null, status?: string | null, resourceType?: string | null): Observable<readonly EquipmentAssignment[]> { let params = new HttpParams(); if (employeeId) params = params.set('employeeId', employeeId); if (status) params = params.set('status', status); if (resourceType) params = params.set('resourceType', resourceType); return this.http.get<readonly EquipmentAssignment[]>(`${this.baseUrl}/equipment-assignments/`, { params }); }
  createEquipmentAssignment(request: EquipmentAssignmentRequest): Observable<{ readonly id: string }> { return this.http.post<{ readonly id: string }>(`${this.baseUrl}/equipment-assignments/`, request); }
  updateEquipmentAssignment(id: string, request: UpdateEquipmentAssignmentRequest): Observable<void> { return this.http.put<void>(`${this.baseUrl}/equipment-assignments/${id}`, request); }
  handOverEquipmentAssignment(id: string, request: EquipmentConditionRequest): Observable<void> { return this.http.post<void>(`${this.baseUrl}/equipment-assignments/${id}/handover`, request); }
  returnEquipmentAssignment(id: string, request: ReturnEquipmentAssignmentRequest): Observable<void> { return this.http.post<void>(`${this.baseUrl}/equipment-assignments/${id}/return`, request); }
  cancelEquipmentAssignment(id: string, reason: string): Observable<void> { return this.http.post<void>(`${this.baseUrl}/equipment-assignments/${id}/cancel`, { reason }); }

  getPerformanceReviews(employeeId?: string | null, status?: string | null): Observable<readonly PerformanceReview[]> { let params = new HttpParams(); if (employeeId) params = params.set('employeeId', employeeId); if (status) params = params.set('status', status); return this.http.get<readonly PerformanceReview[]>(`${this.baseUrl}/performance-reviews/`, { params }); }
  getPerformanceReview(id: string): Observable<PerformanceReview> { return this.http.get<PerformanceReview>(`${this.baseUrl}/performance-reviews/${id}`); }
  createPerformanceReview(request: CreatePerformanceReviewRequest): Observable<{ readonly id: string }> { return this.http.post<{ readonly id: string }>(`${this.baseUrl}/performance-reviews/`, request); }
  startPerformanceReview(id: string): Observable<void> { return this.http.post<void>(`${this.baseUrl}/performance-reviews/${id}/start`, {}); }
  addPerformanceReviewCriterion(id: string, request: AddPerformanceReviewCriterionRequest): Observable<{ readonly id: string }> { return this.http.post<{ readonly id: string }>(`${this.baseUrl}/performance-reviews/${id}/criteria`, request); }
  ratePerformanceReviewCriterion(id: string, criterionId: string, request: RatePerformanceReviewCriterionRequest): Observable<void> { return this.http.put<void>(`${this.baseUrl}/performance-reviews/${id}/criteria/${criterionId}`, request); }
  setPerformanceReviewSummary(id: string, request: SetPerformanceReviewSummaryRequest): Observable<void> { return this.http.put<void>(`${this.baseUrl}/performance-reviews/${id}/summary`, request); }
  submitPerformanceReview(id: string): Observable<void> { return this.http.post<void>(`${this.baseUrl}/performance-reviews/${id}/submit`, {}); }
  acknowledgePerformanceReview(id: string, employeeComment: string | null): Observable<void> { return this.http.post<void>(`${this.baseUrl}/performance-reviews/${id}/acknowledge`, { employeeComment }); }
  completePerformanceReview(id: string): Observable<void> { return this.http.post<void>(`${this.baseUrl}/performance-reviews/${id}/complete`, {}); }
  cancelPerformanceReview(id: string, reason: string): Observable<void> { return this.http.post<void>(`${this.baseUrl}/performance-reviews/${id}/cancel`, { reason }); }

  getEmployeeDocuments(employeeId?: string | null, category?: string | null, status?: string | null): Observable<readonly EmployeeDocument[]> { let params = new HttpParams(); if (employeeId) params = params.set('employeeId', employeeId); if (category) params = params.set('category', category); if (status) params = params.set('status', status); return this.http.get<readonly EmployeeDocument[]>(`${this.baseUrl}/employee-documents/`, { params }); }
  getEmployeeDocumentReference(id: string): Observable<{ readonly id: string; readonly documentReferenceId: string | null }> { return this.http.get<{ readonly id: string; readonly documentReferenceId: string | null }>(`${this.baseUrl}/employee-documents/${id}/reference`); }
  createEmployeeDocument(request: EmployeeDocumentRequest): Observable<{ readonly id: string }> { return this.http.post<{ readonly id: string }>(`${this.baseUrl}/employee-documents/`, request); }
  updateEmployeeDocument(id: string, request: UpdateEmployeeDocumentRequest): Observable<void> { return this.http.put<void>(`${this.baseUrl}/employee-documents/${id}`, request); }
  verifyEmployeeDocument(id: string): Observable<void> { return this.http.post<void>(`${this.baseUrl}/employee-documents/${id}/verify`, {}); }
  supersedeEmployeeDocument(id: string, replacementEmployeeDocumentId: string): Observable<void> { return this.http.post<void>(`${this.baseUrl}/employee-documents/${id}/supersede`, { replacementEmployeeDocumentId }); }
  revokeEmployeeDocument(id: string, reason: string): Observable<void> { return this.http.post<void>(`${this.baseUrl}/employee-documents/${id}/revoke`, { reason }); }
  archiveEmployeeDocument(id: string): Observable<void> { return this.http.post<void>(`${this.baseUrl}/employee-documents/${id}/archive`, {}); }

  getProfessionalRestrictions(employeeId?: string | null, status?: string | null, activity?: string | null): Observable<readonly ProfessionalRestriction[]> { let params = new HttpParams(); if (employeeId) params = params.set('employeeId', employeeId); if (status) params = params.set('status', status); if (activity) params = params.set('activity', activity); return this.http.get<readonly ProfessionalRestriction[]>(`${this.baseUrl}/professional-restrictions/`, { params }); }
  createProfessionalRestriction(request: ProfessionalRestrictionRequest): Observable<{ readonly id: string }> { return this.http.post<{ readonly id: string }>(`${this.baseUrl}/professional-restrictions/`, request); }
  updateProfessionalRestriction(id: string, request: UpdateProfessionalRestrictionRequest): Observable<void> { return this.http.put<void>(`${this.baseUrl}/professional-restrictions/${id}`, request); }
  activateProfessionalRestriction(id: string): Observable<void> { return this.http.post<void>(`${this.baseUrl}/professional-restrictions/${id}/activate`, {}); }
  liftProfessionalRestriction(id: string, reason: string): Observable<void> { return this.http.post<void>(`${this.baseUrl}/professional-restrictions/${id}/lift`, { reason }); }
  cancelProfessionalRestriction(id: string, reason: string): Observable<void> { return this.http.post<void>(`${this.baseUrl}/professional-restrictions/${id}/cancel`, { reason }); }

  getAnalytics(from: string, to: string): Observable<WorkforceAnalytics> {
    const params = new HttpParams().set('from', from).set('to', to);
    return this.http.get<WorkforceAnalytics>(`${this.baseUrl}/analytics/`, { params });
  }

  getOffboarding(employeeId: string): Observable<OffboardingProcess> { return this.http.get<OffboardingProcess>(`${this.baseUrl}/employees/${employeeId}/offboarding/`); }
  refreshOffboarding(employeeId: string): Observable<void> { return this.http.post<void>(`${this.baseUrl}/employees/${employeeId}/offboarding/refresh`, {}); }
  completeOffboardingItem(employeeId: string, kind: OffboardingChecklistItemKind | string, note: string | null): Observable<void> { return this.http.post<void>(`${this.baseUrl}/employees/${employeeId}/offboarding/items/${kind}/complete`, { note }); }
  waiveOffboardingItem(employeeId: string, kind: OffboardingChecklistItemKind | string, reason: string): Observable<void> { return this.http.post<void>(`${this.baseUrl}/employees/${employeeId}/offboarding/items/${kind}/waive`, { reason }); }
  completeOffboarding(employeeId: string, reason: string): Observable<void> { return this.http.post<void>(`${this.baseUrl}/employees/${employeeId}/offboarding/complete`, { reason }); }

}
