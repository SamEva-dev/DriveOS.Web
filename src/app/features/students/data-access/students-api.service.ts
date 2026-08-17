import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG, ApiConfig } from '../../../core/config/api-config';
import {
  AddAdministrativeBlockRequest,
  ApplyStudentBlockRequest,
  AssignStudentInstructorRequest,
  AssignStudentBranchRequest,
  ChangePrimaryBranchRequest,
  AnalyzeInternalTransferRequest,
  CreateGuardianRequest,
  CreateStudentRelationshipRequest,
  AdministrationReasonRequest,
  ConfigureAdministrationRequirementRequest,
  DecideAdministrationRequirementRequest,
  DecideComplianceExceptionRequest,
  EnrollmentChecklist,
  EnrollmentClosure,
  CreateEnrollmentClosureRequest,
  ReviewEnrollmentClosureCheckRequest,
  EnrollmentClosureCheckType,
  ArchiveStudentRequest,
  ReopenEnrollmentRequest,
  EnrollmentReactivation,
  CreateEnrollmentReactivationRequest,
  ReviewEnrollmentReactivationCheckRequest,
  ReactivationCheckType,
  EnrollmentSuspension,
  InstructorSuggestion,
  ExternalTransfer,
  CreateExternalTransferRequest,
  ExternalTransferFinanceRequest,
  ExternalTransferPreconditions,
  InternalTransfer,
  PagedStudents,
  PrimaryBranchChangeAnalysis,
  ReplacePrimaryInstructorRequest,
  StartDirectEnrollmentRequest,
  StartDirectEnrollmentResponse,
  StudentAdministration,
  StudentBranches,
  StudentBranchOptionsPage,
  StudentDashboard,
  StudentDocuments,
  RequestStudentDocumentRequest,
  ValidateStudentDocumentRequest,
  StudentGuardians,
  StudentRelationships,
  StudentIdentity,
  StudentInstructors,
  StudentListParameters,
  StudentOverview,
  StudentStatuses,
  SuspendEnrollmentRequest,
  ReleaseStudentBlockRequest,
  OverrideStudentBlockRequest,
  UpdateGuardianRequest,
  UpdateStudentRelationshipRequest,
  UpdateStudentIdentityRequest,
  UpdateStudentIdentityResponse,
  VerifyStudentIdentityRequest,
} from '../models/student.models';

@Injectable({ providedIn: 'root' })
export class StudentsApiService {
  private readonly http = inject(HttpClient);
  private readonly config = inject<ApiConfig>(API_CONFIG);
  private readonly baseUrl = `${this.config.baseUrl}/students`;

  getDashboard(branchId?: string): Observable<StudentDashboard> {
    const params = branchId ? new HttpParams().set('branchId', branchId) : undefined;
    return this.http.get<StudentDashboard>(`${this.baseUrl}/dashboard`, { params });
  }

  getStudents(parameters: StudentListParameters): Observable<PagedStudents> {
    let params = new HttpParams()
      .set('pageNumber', parameters.pageNumber)
      .set('pageSize', parameters.pageSize)
      .set('search', parameters.search.trim())
      .set('sortBy', parameters.sortBy)
      .set('sortDirection', parameters.sortDirection);
    if (parameters.branchId) params = params.set('branchId', parameters.branchId);
    if (parameters.status) params = params.set('status', parameters.status);
    if (parameters.enrollmentStatus)
      params = params.set('enrollmentStatus', parameters.enrollmentStatus);
    return this.http.get<PagedStudents>(this.baseUrl, { params });
  }

  getOverview(studentId: string): Observable<StudentOverview> {
    return this.http.get<StudentOverview>(`${this.baseUrl}/${studentId}/overview`);
  }

  getIdentity(studentId: string): Observable<StudentIdentity> {
    return this.http.get<StudentIdentity>(`${this.baseUrl}/${studentId}/identity`);
  }

  updateIdentity(
    studentId: string,
    request: UpdateStudentIdentityRequest,
  ): Observable<UpdateStudentIdentityResponse> {
    return this.http.put<UpdateStudentIdentityResponse>(
      `${this.baseUrl}/${studentId}/identity`,
      request,
    );
  }

  verifyIdentity(
    studentId: string,
    request: VerifyStudentIdentityRequest,
  ): Observable<StudentIdentity> {
    return this.http.post<StudentIdentity>(
      `${this.baseUrl}/${studentId}/identity/verify`,
      request,
    );
  }

  getAdministration(studentId: string): Observable<StudentAdministration> {
    return this.http.get<StudentAdministration>(`${this.baseUrl}/${studentId}/administration`);
  }

  createAdministrationRequirement(
    studentId: string,
    request: ConfigureAdministrationRequirementRequest,
  ): Observable<string> {
    return this.http.post<string>(`${this.baseUrl}/${studentId}/administration/requirements`, request);
  }

  updateAdministrationRequirement(
    studentId: string,
    requirementId: string,
    request: ConfigureAdministrationRequirementRequest,
  ): Observable<string> {
    return this.http.put<string>(
      `${this.baseUrl}/${studentId}/administration/requirements/${requirementId}`,
      request,
    );
  }

  synchronizeAdministrationRequirements(studentId: string): Observable<number> {
    return this.http.post<number>(
      `${this.baseUrl}/${studentId}/administration/requirements/synchronize`,
      {},
    );
  }

  decideAdministrationRequirement(
    studentId: string,
    requirementId: string,
    request: DecideAdministrationRequirementRequest,
  ): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/${studentId}/administration/requirements/${requirementId}/status`,
      request,
    );
  }

  addAdministrativeBlock(
    studentId: string,
    request: AddAdministrativeBlockRequest,
  ): Observable<string> {
    return this.http.post<string>(`${this.baseUrl}/${studentId}/administration/blocks`, request);
  }

  releaseAdministrativeBlock(
    studentId: string,
    blockId: string,
    request: AdministrationReasonRequest,
  ): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/${studentId}/administration/blocks/${blockId}/release`,
      request,
    );
  }

  requestComplianceException(
    studentId: string,
    requirementId: string,
    request: AdministrationReasonRequest,
  ): Observable<string> {
    return this.http.post<string>(
      `${this.baseUrl}/${studentId}/administration/requirements/${requirementId}/exceptions`,
      request,
    );
  }

  decideComplianceException(
    studentId: string,
    exceptionId: string,
    request: DecideComplianceExceptionRequest,
  ): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/${studentId}/administration/exceptions/${exceptionId}/decision`,
      request,
    );
  }

  getGuardians(studentId: string): Observable<StudentGuardians> {
    return this.http.get<StudentGuardians>(`${this.baseUrl}/${studentId}/guardians`);
  }

  createGuardian(studentId: string, request: CreateGuardianRequest): Observable<string> {
    return this.http.post<string>(`${this.baseUrl}/${studentId}/guardians`, request);
  }

  updateGuardian(studentId: string, relationshipId: string, request: UpdateGuardianRequest): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${studentId}/guardians/${relationshipId}`, request);
  }

  inviteGuardian(studentId: string, relationshipId: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${studentId}/guardians/${relationshipId}/invite`, {});
  }

  revokeGuardian(studentId: string, relationshipId: string, request: { reason: string }): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${studentId}/guardians/${relationshipId}/revoke`, request);
  }

  getRelationships(studentId: string): Observable<StudentRelationships> {
    return this.http.get<StudentRelationships>(`${this.baseUrl}/${studentId}/relationships`);
  }

  createRelationship(studentId: string, request: CreateStudentRelationshipRequest): Observable<string> {
    return this.http.post<string>(`${this.baseUrl}/${studentId}/relationships`, request);
  }

  updateRelationship(studentId: string, relationshipId: string, request: UpdateStudentRelationshipRequest): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${studentId}/relationships/${relationshipId}`, request);
  }

  inviteRelationship(studentId: string, relationshipId: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${studentId}/relationships/${relationshipId}/invite`, {});
  }

  suspendRelationship(studentId: string, relationshipId: string, reason: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${studentId}/relationships/${relationshipId}/suspend`, { reason });
  }

  revokeRelationship(studentId: string, relationshipId: string, reason: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${studentId}/relationships/${relationshipId}/revoke`, { reason });
  }

  getEnrollmentChecklist(
    studentId: string,
    enrollmentId?: string,
  ): Observable<EnrollmentChecklist> {
    const params = enrollmentId ? new HttpParams().set('enrollmentId', enrollmentId) : undefined;
    return this.http.get<EnrollmentChecklist>(`${this.baseUrl}/${studentId}/enrollment-checklist`, {
      params,
    });
  }

  synchronizeEnrollmentChecklist(studentId: string, enrollmentId: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${studentId}/enrollment-checklist/synchronize`, { enrollmentId });
  }

  changeEnrollmentChecklistItemStatus(
    studentId: string,
    enrollmentId: string,
    itemId: string,
    request: { status: string; reason: string | null },
  ): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/${studentId}/enrollment-checklist/${enrollmentId}/items/${itemId}/status`,
      request,
    );
  }

  assignEnrollmentChecklistItem(
    studentId: string,
    enrollmentId: string,
    itemId: string,
    responsibleUserId: string,
  ): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/${studentId}/enrollment-checklist/${enrollmentId}/items/${itemId}/assign`,
      { responsibleUserId },
    );
  }

  remindEnrollmentChecklistItem(studentId: string, enrollmentId: string, itemId: string): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/${studentId}/enrollment-checklist/${enrollmentId}/items/${itemId}/remind`,
      {},
    );
  }

  activateEnrollment(studentId: string, enrollmentId: string): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/${studentId}/enrollment-checklist/${enrollmentId}/activate`,
      {},
    );
  }

  getDocuments(studentId: string, enrollmentId?: string): Observable<StudentDocuments> {
    const params = enrollmentId ? new HttpParams().set('enrollmentId', enrollmentId) : undefined;
    return this.http.get<StudentDocuments>(`${this.baseUrl}/${studentId}/documents`, { params });
  }

  requestDocument(studentId: string, request: RequestStudentDocumentRequest): Observable<string> {
    return this.http.post<string>(`${this.baseUrl}/${studentId}/documents/requests`, request);
  }

  uploadDocument(studentId: string, documentId: string, file: File): Observable<string> {
    const body = new FormData();
    body.append('file', file, file.name);
    return this.http.post<string>(`${this.baseUrl}/${studentId}/documents/${documentId}/versions`, body);
  }

  validateDocument(studentId: string, documentId: string, request: ValidateStudentDocumentRequest): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${studentId}/documents/${documentId}/validation`, request);
  }

  shareDocument(studentId: string, documentId: string, visibility: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${studentId}/documents/${documentId}/share`, { visibility });
  }

  archiveDocument(studentId: string, documentId: string, reason: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${studentId}/documents/${documentId}/archive`, { reason });
  }

  downloadDocument(studentId: string, documentId: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${studentId}/documents/${documentId}/download`, {
      responseType: 'blob',
    });
  }

  getBranches(studentId: string): Observable<StudentBranches> {
    return this.http.get<StudentBranches>(`${this.baseUrl}/${studentId}/branches`);
  }

  assignStudentBranch(studentId: string, request: AssignStudentBranchRequest): Observable<string> {
    return this.http.post<string>(`${this.baseUrl}/${studentId}/branches/assignments`, request);
  }

  analyzePrimaryBranchChange(studentId: string, targetBranchId: string): Observable<PrimaryBranchChangeAnalysis> {
    return this.http.post<PrimaryBranchChangeAnalysis>(
      `${this.baseUrl}/${studentId}/branches/primary-change/analysis`,
      { targetBranchId },
    );
  }

  changePrimaryBranch(studentId: string, request: ChangePrimaryBranchRequest): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${studentId}/branches/primary-change`, request);
  }

  endStudentBranchAssignment(studentId: string, assignmentId: string, reason: string): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/${studentId}/branches/assignments/${assignmentId}/end`,
      { reason },
    );
  }

  getInstructors(studentId: string): Observable<StudentInstructors> {
    return this.http.get<StudentInstructors>(`${this.baseUrl}/${studentId}/instructors`);
  }

  getInstructorSuggestions(
    studentId: string,
    trainingCategory: string,
    branchId?: string | null,
  ): Observable<readonly InstructorSuggestion[]> {
    let params = new HttpParams().set('trainingCategory', trainingCategory.trim());
    if (branchId) params = params.set('branchId', branchId);
    return this.http.get<readonly InstructorSuggestion[]>(
      `${this.baseUrl}/${studentId}/instructors/suggestions`,
      { params },
    );
  }

  assignStudentInstructor(
    studentId: string,
    request: AssignStudentInstructorRequest,
  ): Observable<string> {
    return this.http.post<string>(`${this.baseUrl}/${studentId}/instructors/assignments`, request);
  }

  replacePrimaryInstructor(
    studentId: string,
    request: ReplacePrimaryInstructorRequest,
  ): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${studentId}/instructors/primary/replace`, request);
  }

  endStudentInstructorAssignment(
    studentId: string,
    assignmentId: string,
    reason: string,
  ): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/${studentId}/instructors/assignments/${assignmentId}/end`,
      { reason },
    );
  }

  getStatuses(studentId: string): Observable<StudentStatuses> {
    return this.http.get<StudentStatuses>(`${this.baseUrl}/${studentId}/statuses`);
  }

  applyStudentBlock(studentId: string, request: ApplyStudentBlockRequest): Observable<string> {
    return this.http.post<string>(`${this.baseUrl}/${studentId}/statuses/blocks`, request);
  }

  releaseStudentBlock(
    studentId: string,
    blockId: string,
    request: ReleaseStudentBlockRequest,
  ): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/${studentId}/statuses/blocks/${blockId}/release`,
      request,
    );
  }

  overrideStudentBlock(
    studentId: string,
    blockId: string,
    request: OverrideStudentBlockRequest,
  ): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/${studentId}/statuses/blocks/${blockId}/override`,
      request,
    );
  }

  getInternalTransfers(studentId: string): Observable<readonly InternalTransfer[]> {
    return this.http.get<readonly InternalTransfer[]>(
      `${this.baseUrl}/${studentId}/transfers/internal`,
    );
  }

  analyzeInternalTransfer(
    studentId: string,
    request: AnalyzeInternalTransferRequest,
  ): Observable<InternalTransfer> {
    return this.http.post<InternalTransfer>(
      `${this.baseUrl}/${studentId}/transfers/internal/analysis`,
      request,
    );
  }

  validateInternalTransfer(studentId: string, transferId: string): Observable<InternalTransfer> {
    return this.http.post<InternalTransfer>(
      `${this.baseUrl}/${studentId}/transfers/internal/${transferId}/validate`,
      {},
    );
  }

  getExternalTransfers(studentId: string): Observable<readonly ExternalTransfer[]> {
    return this.http.get<readonly ExternalTransfer[]>(
      `${this.baseUrl}/${studentId}/transfers/external`,
    );
  }

  createExternalTransfer(
    studentId: string,
    request: CreateExternalTransferRequest,
  ): Observable<string> {
    return this.http.post<string>(`${this.baseUrl}/${studentId}/transfers/external`, request);
  }

  verifyExternalTransferConsent(
    studentId: string,
    transferId: string,
    evidenceReference: string,
  ): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/${studentId}/transfers/external/${transferId}/consent`,
      { evidenceReference },
    );
  }

  reviewExternalTransferFinance(
    studentId: string,
    transferId: string,
    request: ExternalTransferFinanceRequest,
  ): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/${studentId}/transfers/external/${transferId}/finance-review`,
      request,
    );
  }

  submitExternalTransfer(
    studentId: string,
    transferId: string,
    requestInvitationIfMissing: boolean,
  ): Observable<ExternalTransferPreconditions> {
    return this.http.post<ExternalTransferPreconditions>(
      `${this.baseUrl}/${studentId}/transfers/external/${transferId}/submit`,
      { requestInvitationIfMissing },
    );
  }

  decideExternalTransfer(
    studentId: string,
    transferId: string,
    accept: boolean,
    reason: string,
  ): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/${studentId}/transfers/external/${transferId}/decision`,
      { accept, reason },
    );
  }

  completeExternalTransfer(studentId: string, transferId: string): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/${studentId}/transfers/external/${transferId}/complete`,
      {},
    );
  }

  getSuspensions(studentId: string): Observable<readonly EnrollmentSuspension[]> {
    return this.http.get<readonly EnrollmentSuspension[]>(
      `${this.baseUrl}/${studentId}/suspension`,
    );
  }


  suspendEnrollment(studentId: string, request: SuspendEnrollmentRequest): Observable<string> {
    return this.http.post<string>(`${this.baseUrl}/${studentId}/suspension`, request);
  }

  getReactivations(studentId: string): Observable<readonly EnrollmentReactivation[]> {
    return this.http.get<readonly EnrollmentReactivation[]>(
      `${this.baseUrl}/${studentId}/reactivate`,
    );
  }

  createReactivation(
    studentId: string,
    request: CreateEnrollmentReactivationRequest,
  ): Observable<string> {
    return this.http.post<string>(`${this.baseUrl}/${studentId}/reactivate`, request);
  }

  reviewReactivationCheck(
    studentId: string,
    reactivationId: string,
    checkType: ReactivationCheckType,
    request: ReviewEnrollmentReactivationCheckRequest,
  ): Observable<void> {
    return this.http.put<void>(
      `${this.baseUrl}/${studentId}/reactivate/${reactivationId}/checks/${checkType}`,
      request,
    );
  }

  applyReactivation(studentId: string, reactivationId: string): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/${studentId}/reactivate/${reactivationId}/apply`,
      {},
    );
  }

  getClosures(studentId: string): Observable<readonly EnrollmentClosure[]> {
    return this.http.get<readonly EnrollmentClosure[]>(`${this.baseUrl}/${studentId}/close`);
  }

  createClosure(studentId: string, request: CreateEnrollmentClosureRequest): Observable<string> {
    return this.http.post<string>(`${this.baseUrl}/${studentId}/close`, request);
  }

  reviewClosureCheck(
    studentId: string,
    closureId: string,
    checkType: EnrollmentClosureCheckType,
    request: ReviewEnrollmentClosureCheckRequest,
  ): Observable<void> {
    return this.http.put<void>(
      `${this.baseUrl}/${studentId}/close/${closureId}/checks/${checkType}`,
      request,
    );
  }

  completeClosure(studentId: string, closureId: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${studentId}/close/${closureId}/complete`, {});
  }

  archiveStudent(
    studentId: string,
    closureId: string,
    request: ArchiveStudentRequest,
  ): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${studentId}/close/${closureId}/archive`, request);
  }

  reopenEnrollment(
    studentId: string,
    closureId: string,
    request: ReopenEnrollmentRequest,
  ): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${studentId}/close/${closureId}/reopen`, request);
  }

  getBranchOptions(organizationId: string): Observable<StudentBranchOptionsPage> {
    const params = new HttpParams()
      .set('pageNumber', 1)
      .set('pageSize', 100)
      .set('sortBy', 'name')
      .set('sortDirection', 'asc');
    return this.http.get<StudentBranchOptionsPage>(
      `${this.config.baseUrl}/organizations/${organizationId}/branches`,
      { params },
    );
  }

  startDirectEnrollment(
    request: StartDirectEnrollmentRequest,
    idempotencyKey: string,
  ): Observable<StartDirectEnrollmentResponse> {
    return this.http.post<StartDirectEnrollmentResponse>(
      `${this.baseUrl}/enrollments/direct`,
      request,
      { headers: { 'Idempotency-Key': idempotencyKey } },
    );
  }
}
