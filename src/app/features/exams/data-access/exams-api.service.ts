import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG, ApiConfig } from '../../../core/config/api-config';
import {
  ExamAnalyticsResponse,
  ExamAttempt,
  ExamCenter,
  ExamConvocation,
  ExamOperationalPlan,
  ExamOperationalPlanningOptions,
  ExamPlace,
  ExamPreparation,
  ExamReadinessDecision,
  ExamReadinessSnapshot,
  ExamRegistration,
  ExamResourceAssignment,
  ExamResult,
  ExamFailureAnalysis,
  ExamRemediationRequest,
  ExamSuccessProcess,
  ExamSuccessConsequence,
  ExamAttestation,
  ExamReadinessOpinionContext,
  ExamReadinessOpinion,
  ExamPlaceHold,
  ExamRegistrationFile,
  ExamRegistrationSubmission,
  ExamPlaceWatch,
  ExamPlaceWatchScan,
  ExamProviderCatalog,
  ExamProviderConnection,
  ExamPlaceSynchronization,
} from '../models/exams.models';

@Injectable({ providedIn: 'root' })
export class ExamsApiService {
  private readonly http = inject(HttpClient);
  private readonly config = inject<ApiConfig>(API_CONFIG);
  private readonly baseUrl = `${this.config.baseUrl.replace(/\/$/, '')}/exams`;

  getAnalytics(
    filter: {
      fromUtc?: string;
      toUtc?: string;
      examType?: string;
      licenseCategory?: string;
      examCenterId?: string;
      instructorId?: string;
      branchId?: string;
    } = {},
  ): Observable<ExamAnalyticsResponse> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(filter)) {
      if (value) params = params.set(key, value);
    }
    return this.http.get<ExamAnalyticsResponse>(`${this.baseUrl}/analytics/results`, { params });
  }
  getReadiness(studentId: string, trainingPathId: string): Observable<ExamReadinessDecision> {
    return this.http.get<ExamReadinessDecision>(`${this.baseUrl}/readiness/students/${studentId}`, {
      params: new HttpParams().set('trainingPathId', trainingPathId),
    });
  }
  getReadinessSnapshot(
    studentId: string,
    trainingPathId: string,
  ): Observable<ExamReadinessSnapshot> {
    return this.http.get<ExamReadinessSnapshot>(
      `${this.baseUrl}/readiness/students/${studentId}/snapshot`,
      { params: new HttpParams().set('trainingPathId', trainingPathId) },
    );
  }
  recordReadinessDecision(
    studentId: string,
    request: {
      trainingPathId: string;
      outcome: string;
      rationale: string;
      conditions?: string | null;
    },
  ): Observable<{ id: string }> {
    return this.http.post<{ id: string }>(
      `${this.baseUrl}/readiness/students/${studentId}/decisions`,
      request,
    );
  }
  getCenters(): Observable<readonly ExamCenter[]> {
    return this.http.get<readonly ExamCenter[]>(`${this.baseUrl}/centers`);
  }
  getPlaces(filter: {
    fromUtc: string;
    toUtc: string;
    licenseCategory?: string;
  }): Observable<readonly ExamPlace[]> {
    let params = new HttpParams().set('fromUtc', filter.fromUtc).set('toUtc', filter.toUtc);
    if (filter.licenseCategory) params = params.set('licenseCategory', filter.licenseCategory);
    return this.http.get<readonly ExamPlace[]>(`${this.baseUrl}/places`, { params });
  }
  getStudentRegistrations(studentId: string): Observable<readonly ExamRegistration[]> {
    return this.http.get<readonly ExamRegistration[]>(
      `${this.baseUrl}/students/${studentId}/registrations`,
    );
  }
  getRegistration(registrationId: string): Observable<ExamRegistration> {
    return this.http.get<ExamRegistration>(`${this.baseUrl}/registrations/${registrationId}`);
  }
  getStudentResults(studentId: string): Observable<readonly ExamResult[]> {
    return this.http.get<readonly ExamResult[]>(`${this.baseUrl}/students/${studentId}/results`);
  }
  getPreparation(registrationId: string): Observable<ExamPreparation> {
    return this.http.get<ExamPreparation>(
      `${this.baseUrl}/registrations/${registrationId}/preparation/`,
    );
  }
  refreshPreparation(
    registrationId: string,
    request: {
      meetingPointConfirmed: boolean;
      vehicleEnergyConfirmed: boolean;
      instructorConfirmed: boolean;
      instructionsTransmitted: boolean;
      reminderOffsetsDays: readonly number[];
      operationId: string;
    },
  ): Observable<ExamPreparation> {
    return this.http.put<ExamPreparation>(
      `${this.baseUrl}/registrations/${registrationId}/preparation/`,
      request,
    );
  }
  confirmPreparation(registrationId: string): Observable<ExamPreparation> {
    return this.http.post<ExamPreparation>(
      `${this.baseUrl}/registrations/${registrationId}/preparation/confirm`,
      {},
    );
  }
  getConvocation(registrationId: string): Observable<ExamConvocation> {
    return this.http.get<ExamConvocation>(
      `${this.baseUrl}/registrations/${registrationId}/convocation`,
    );
  }
  setConvocationMeeting(
    registrationId: string,
    request: { meetingAtUtc: string | null; instructions: string | null },
  ): Observable<ExamConvocation> {
    return this.http.put<ExamConvocation>(
      `${this.baseUrl}/registrations/${registrationId}/convocation/meeting`,
      request,
    );
  }
  markConvocationDelivered(registrationId: string, channel: string): Observable<ExamConvocation> {
    return this.http.post<ExamConvocation>(
      `${this.baseUrl}/registrations/${registrationId}/convocation/delivered`,
      { channel },
    );
  }
  acknowledgeConvocation(registrationId: string): Observable<ExamConvocation> {
    return this.http.post<ExamConvocation>(
      `${this.baseUrl}/registrations/${registrationId}/convocation/acknowledged`,
      {},
    );
  }
  getOperationalPlan(registrationId: string): Observable<ExamOperationalPlan> {
    return this.http.get<ExamOperationalPlan>(
      `${this.baseUrl}/registrations/${registrationId}/operational-plan`,
    );
  }
  getOperationalOptions(
    registrationId: string,
    query: {
      departureBranchId?: string;
      meetingAtUtc?: string;
      beforeMinutes?: number;
      afterMinutes?: number;
    },
  ): Observable<ExamOperationalPlanningOptions> {
    let params = new HttpParams();
    if (query.departureBranchId) params = params.set('departureBranchId', query.departureBranchId);
    if (query.meetingAtUtc) params = params.set('meetingAtUtc', query.meetingAtUtc);
    if (query.beforeMinutes != null) params = params.set('beforeMinutes', query.beforeMinutes);
    if (query.afterMinutes != null) params = params.set('afterMinutes', query.afterMinutes);
    return this.http.get<ExamOperationalPlanningOptions>(
      `${this.baseUrl}/registrations/${registrationId}/operational-plan/options`,
      { params },
    );
  }
  refreshOperationalPlan(
    registrationId: string,
    request: {
      meetingAtUtc: string | null;
      travelBufferBeforeMinutes: number;
      travelBufferAfterMinutes: number;
      departureBranchId: string | null;
      instructorRequired: boolean;
      vehicleRequired: boolean;
      meetingInstructions: string | null;
    },
  ): Observable<ExamOperationalPlan> {
    return this.http.put<ExamOperationalPlan>(
      `${this.baseUrl}/registrations/${registrationId}/operational-plan`,
      request,
    );
  }
  getResourceAssignment(registrationId: string): Observable<ExamResourceAssignment> {
    return this.http.get<ExamResourceAssignment>(
      `${this.baseUrl}/registrations/${registrationId}/resources/`,
    );
  }
  assignResources(
    registrationId: string,
    request: {
      instructorCalendarResourceId: string | null;
      vehicleCalendarResourceId: string | null;
      trainingCategory: string;
      transmissionType: string | null;
      dualControlRequired: boolean;
      requiredAdaptations: readonly string[];
      energyType: string | null;
      operationId: string;
    },
  ): Observable<ExamResourceAssignment> {
    return this.http.post<ExamResourceAssignment>(
      `${this.baseUrl}/registrations/${registrationId}/resources/assign`,
      request,
    );
  }
  getAttempt(registrationId: string): Observable<ExamAttempt> {
    return this.http.get<ExamAttempt>(`${this.baseUrl}/registrations/${registrationId}/attempt/`);
  }
  createAttempt(registrationId: string): Observable<ExamAttempt> {
    return this.examAttemptOperation(registrationId, '', {});
  }
  examAttemptOperation(
    registrationId: string,
    action: string,
    extra: Record<string, unknown> = {},
  ): Observable<ExamAttempt> {
    const suffix = action ? `/${action}` : '/';
    return this.http.post<ExamAttempt>(
      `${this.baseUrl}/registrations/${registrationId}/attempt${suffix}`,
      { operationId: crypto.randomUUID(), ...extra },
    );
  }

  recordResult(
    attemptId: string,
    request: {
      outcome: string;
      score: number | null;
      failureReasonCode: string | null;
      comments: string | null;
      sourceKind: string;
      providerCode: string;
      externalResultId: string | null;
      evidenceDocumentId: string | null;
      receivedAtUtc: string;
      operationId: string;
    },
  ): Observable<ExamResult> {
    return this.http.post<ExamResult>(`${this.baseUrl}/attempts/${attemptId}/result/`, request);
  }
  importResult(
    attemptId: string,
    request: {
      outcome: string;
      score: number | null;
      failureReasonCode: string | null;
      comments: string | null;
      sourceKind: string;
      providerCode: string;
      externalResultId: string | null;
      evidenceDocumentId: string | null;
      receivedAtUtc: string;
      operationId: string;
    },
  ): Observable<ExamResult> {
    return this.http.post<ExamResult>(
      `${this.baseUrl}/attempts/${attemptId}/result/import`,
      request,
    );
  }
  getResult(resultId: string): Observable<ExamResult> {
    return this.http.get<ExamResult>(`${this.baseUrl}/results/${resultId}/`);
  }
  verifyResult(resultId: string, verificationReference: string): Observable<ExamResult> {
    return this.http.post<ExamResult>(`${this.baseUrl}/results/${resultId}/verify`, {
      verificationReference,
    });
  }
  finalizeResult(resultId: string): Observable<ExamResult> {
    return this.http.post<ExamResult>(`${this.baseUrl}/results/${resultId}/finalize`, {});
  }
  correctResult(
    resultId: string,
    request: {
      outcome: string;
      score: number | null;
      failureReasonCode: string | null;
      comments: string | null;
      sourceKind: string;
      providerCode: string;
      externalResultId: string | null;
      evidenceDocumentId: string | null;
      receivedAtUtc: string;
      correctionReason: string;
      operationId: string;
    },
  ): Observable<ExamResult> {
    return this.http.post<ExamResult>(`${this.baseUrl}/results/${resultId}/correct`, request);
  }
  getFailureAnalysis(resultId: string): Observable<ExamFailureAnalysis> {
    return this.http.get<ExamFailureAnalysis>(
      `${this.baseUrl}/results/${resultId}/failure-analysis/`,
    );
  }
  addFailureFinding(
    resultId: string,
    revision: number,
    request: {
      kind: string;
      code: string;
      detail: string | null;
      critical: boolean;
      source: string;
    },
  ): Observable<ExamFailureAnalysis> {
    return this.http.post<ExamFailureAnalysis>(
      `${this.baseUrl}/results/${resultId}/failure-analysis/${revision}/findings`,
      request,
    );
  }
  updateFailureNarrative(
    resultId: string,
    revision: number,
    request: {
      instructorAnalysis: string | null;
      studentFeedback: string | null;
      recommendation: string | null;
    },
  ): Observable<ExamFailureAnalysis> {
    return this.http.put<ExamFailureAnalysis>(
      `${this.baseUrl}/results/${resultId}/failure-analysis/${revision}/narrative`,
      request,
    );
  }
  completeFailureAnalysis(
    resultId: string,
    revision: number,
    request: { summary: string; recommendation: string | null },
  ): Observable<ExamFailureAnalysis> {
    return this.http.post<ExamFailureAnalysis>(
      `${this.baseUrl}/results/${resultId}/failure-analysis/${revision}/complete`,
      request,
    );
  }
  getRemediationByResult(resultId: string, revision: number): Observable<ExamRemediationRequest> {
    return this.http.get<ExamRemediationRequest>(
      `${this.baseUrl}/remediations/result/${resultId}/revision/${revision}`,
    );
  }
  createRemediation(resultId: string, revision: number): Observable<ExamRemediationRequest> {
    return this.http.post<ExamRemediationRequest>(
      `${this.baseUrl}/remediations/result/${resultId}/revision/${revision}`,
      {},
    );
  }
  configureRemediation(
    requestId: string,
    request: {
      trainingPathId: string;
      responsibleUserId: string;
      reviewDate: string;
      targetDate: string | null;
      mockExamRequired: boolean;
      fundingReviewRequired: boolean;
      recommendedHours: number | null;
    },
  ): Observable<ExamRemediationRequest> {
    return this.http.put<ExamRemediationRequest>(
      `${this.baseUrl}/remediations/${requestId}/configuration`,
      request,
    );
  }
  remediationAction(
    requestId: string,
    action: 'provision' | 'refresh' | 'validate-representation',
  ): Observable<ExamRemediationRequest> {
    return this.http.post<ExamRemediationRequest>(
      `${this.baseUrl}/remediations/${requestId}/${action}`,
      {},
    );
  }
  cancelRemediation(requestId: string, reason: string): Observable<ExamRemediationRequest> {
    return this.http.post<ExamRemediationRequest>(
      `${this.baseUrl}/remediations/${requestId}/cancel`,
      { reason },
    );
  }
  getSuccessProcess(resultId: string): Observable<ExamSuccessProcess> {
    return this.http.get<ExamSuccessProcess>(`${this.baseUrl}/results/${resultId}/success/process`);
  }
  getSuccessConsequences(resultId: string): Observable<readonly ExamSuccessConsequence[]> {
    return this.http.get<readonly ExamSuccessConsequence[]>(
      `${this.baseUrl}/results/${resultId}/success/consequences`,
    );
  }
  completeSuccessProcess(resultId: string, revision: number): Observable<ExamSuccessProcess> {
    return this.http.post<ExamSuccessProcess>(
      `${this.baseUrl}/results/${resultId}/success/process/${revision}/complete`,
      {},
    );
  }
  archiveSuccessProcess(resultId: string, revision: number): Observable<ExamSuccessProcess> {
    return this.http.post<ExamSuccessProcess>(
      `${this.baseUrl}/results/${resultId}/success/process/${revision}/archive`,
      {},
    );
  }
  requeueSuccessConsequences(resultId: string): Observable<readonly ExamSuccessConsequence[]> {
    return this.http.post<readonly ExamSuccessConsequence[]>(
      `${this.baseUrl}/results/${resultId}/success/consequences/requeue`,
      {},
    );
  }
  getResultAttestations(resultId: string): Observable<readonly ExamAttestation[]> {
    return this.http.get<readonly ExamAttestation[]>(
      `${this.baseUrl}/results/${resultId}/attestations`,
    );
  }
  issueAttestation(
    resultId: string,
    request: {
      type: string;
      reference: string;
      templateCode: string;
      templateVersion: number;
      documentId: string;
      documentSha256: string;
      publicVerificationToken: string | null;
      expiresAtUtc: string | null;
      supersedesAttestationId: string | null;
      operationId: string;
    },
  ): Observable<ExamAttestation> {
    return this.http.post<ExamAttestation>(
      `${this.baseUrl}/results/${resultId}/attestations`,
      request,
    );
  }
  correctAttestation(
    attestationId: string,
    request: {
      templateCode: string;
      templateVersion: number;
      documentId: string;
      documentSha256: string;
      publicVerificationToken: string | null;
    },
  ): Observable<ExamAttestation> {
    return this.http.post<ExamAttestation>(
      `${this.baseUrl}/attestations/${attestationId}/correct`,
      request,
    );
  }
  signAttestation(
    attestationId: string,
    request: { signatureProcessReference: string; signatureEvidenceHash: string },
  ): Observable<ExamAttestation> {
    return this.http.post<ExamAttestation>(
      `${this.baseUrl}/attestations/${attestationId}/sign`,
      request,
    );
  }
  deliverAttestation(attestationId: string, deliveryChannel: string): Observable<ExamAttestation> {
    return this.http.post<ExamAttestation>(
      `${this.baseUrl}/attestations/${attestationId}/deliver`,
      { deliveryChannel },
    );
  }
  revokeAttestation(
    attestationId: string,
    request: { reasonCode: string; notes: string | null },
  ): Observable<ExamAttestation> {
    return this.http.post<ExamAttestation>(
      `${this.baseUrl}/attestations/${attestationId}/revoke`,
      request,
    );
  }

  getReadinessOpinionContext(
    studentId: string,
    trainingPathId: string,
  ): Observable<ExamReadinessOpinionContext> {
    return this.http.get<ExamReadinessOpinionContext>(
      `${this.baseUrl}/readiness/students/${studentId}/opinion-context`,
      { params: new HttpParams().set('trainingPathId', trainingPathId) },
    );
  }
  getReadinessOpinions(
    studentId: string,
    trainingPathId: string,
  ): Observable<readonly ExamReadinessOpinion[]> {
    return this.http.get<readonly ExamReadinessOpinion[]>(
      `${this.baseUrl}/readiness/students/${studentId}/opinions`,
      { params: new HttpParams().set('trainingPathId', trainingPathId) },
    );
  }
  submitReadinessOpinion(
    studentId: string,
    request: {
      trainingPathId: string;
      opinion: string;
      observedAutonomy: string;
      reservationCodes: readonly string[];
      reservations: string | null;
      conditions: string | null;
      comment: string | null;
      operationId: string;
    },
  ): Observable<{ id: string }> {
    return this.http.post<{ id: string }>(
      `${this.baseUrl}/readiness/students/${studentId}/opinions`,
      request,
    );
  }
  createCenter(request: {
    name: string;
    countryCode: string;
    timeZoneId: string;
    administrativeAreaCode: string | null;
    address: string | null;
    externalProviderCode: string | null;
    externalCenterId: string | null;
  }): Observable<{ id: string }> {
    return this.http.post<{ id: string }>(`${this.baseUrl}/centers`, request);
  }
  createPlace(request: {
    examCenterId: string;
    examType: string;
    licenseCategory: string;
    startsAtUtc: string;
    endsAtUtc: string;
    timeZoneId: string;
    source: string;
    providerCode: string;
    externalPlaceId: string | null;
  }): Observable<{ id: string }> {
    return this.http.post<{ id: string }>(`${this.baseUrl}/places`, request);
  }
  getPlaceWatches(): Observable<readonly ExamPlaceWatch[]> {
    return this.http.get<readonly ExamPlaceWatch[]>(`${this.baseUrl}/place-watches`);
  }
  createPlaceWatch(request: {
    providerCode: string;
    countryCode: string;
    administrativeAreaCode: string | null;
    examCategory: string | null;
    windowFromUtc: string;
    windowToUtc: string;
    checkIntervalMinutes: number;
    centerExternalIds: readonly string[];
  }): Observable<{ id: string }> {
    return this.http.post<{ id: string }>(`${this.baseUrl}/place-watches`, request);
  }
  placeWatchAction(
    subscriptionId: string,
    action: 'pause' | 'resume' | 'scan',
  ): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/place-watches/${subscriptionId}/${action}`, {});
  }
  getPlaceWatchScans(subscriptionId: string): Observable<readonly ExamPlaceWatchScan[]> {
    return this.http.get<readonly ExamPlaceWatchScan[]>(
      `${this.baseUrl}/place-watches/${subscriptionId}/scans`,
    );
  }
  getProviders(): Observable<readonly ExamProviderCatalog[]> {
    return this.http.get<readonly ExamProviderCatalog[]>(`${this.baseUrl}/providers`);
  }
  getProviderConnections(): Observable<readonly ExamProviderConnection[]> {
    return this.http.get<readonly ExamProviderConnection[]>(`${this.baseUrl}/provider-connections`);
  }
  createProviderConnection(request: {
    providerCode: string;
    displayName: string;
    countryCode: string;
    kind: string;
    authenticationMode: string;
    baseUrl: string | null;
    credentialReference: string | null;
    requestsPerMinute: number;
  }): Observable<{ id: string }> {
    return this.http.post<{ id: string }>(`${this.baseUrl}/provider-connections`, request);
  }
  providerConnectionAction(
    connectionId: string,
    action: 'test' | 'suspend' | 'revoke',
  ): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/provider-connections/${connectionId}/${action}`, {});
  }
  holdPlace(placeId: string, holdMinutes = 5): Observable<ExamPlaceHold> {
    return this.http.post<ExamPlaceHold>(`${this.baseUrl}/places/${placeId}/hold`, { holdMinutes });
  }
  releasePlace(placeId: string, holdToken: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/places/${placeId}/hold/release`, { holdToken });
  }
  createRegistration(request: {
    studentId: string;
    trainingPathId: string;
    examPlaceId: string;
    holdToken: string;
    operationId: string;
  }): Observable<ExamRegistration> {
    return this.http.post<ExamRegistration>(`${this.baseUrl}/registrations`, request);
  }
  getRegistrationFile(registrationId: string): Observable<ExamRegistrationFile> {
    return this.http.get<ExamRegistrationFile>(
      `${this.baseUrl}/registrations/${registrationId}/file`,
    );
  }
  refreshRegistrationFile(registrationId: string): Observable<ExamRegistrationFile> {
    return this.http.post<ExamRegistrationFile>(
      `${this.baseUrl}/registrations/${registrationId}/file/refresh`,
      {},
    );
  }
  updateRegistrationOfficialData(
    registrationId: string,
    candidateReference: string,
  ): Observable<ExamRegistrationFile> {
    return this.http.put<ExamRegistrationFile>(
      `${this.baseUrl}/registrations/${registrationId}/file/official-data`,
      { candidateReference },
    );
  }
  submitRegistration(registrationId: string): Observable<ExamRegistrationSubmission> {
    return this.http.post<ExamRegistrationSubmission>(
      `${this.baseUrl}/registrations/${registrationId}/submissions`,
      { operationId: crypto.randomUUID() },
    );
  }
  getRegistrationSubmissions(
    registrationId: string,
  ): Observable<readonly ExamRegistrationSubmission[]> {
    return this.http.get<readonly ExamRegistrationSubmission[]>(
      `${this.baseUrl}/registrations/${registrationId}/submissions`,
    );
  }
  retryRegistrationSubmission(
    registrationId: string,
    submissionId: string,
  ): Observable<ExamRegistrationSubmission> {
    return this.http.post<ExamRegistrationSubmission>(
      `${this.baseUrl}/registrations/${registrationId}/submissions/${submissionId}/retry`,
      {},
    );
  }
  recordRegistrationOfficialResponse(
    registrationId: string,
    submissionId: string,
    request: {
      outcome: string;
      externalSubmissionId: string | null;
      externalRegistrationId: string | null;
      candidateReference: string | null;
      providerResponseCode: string | null;
      providerResponseJson: string | null;
      providerErrorCode: string | null;
    },
  ): Observable<ExamRegistrationSubmission> {
    return this.http.post<ExamRegistrationSubmission>(
      `${this.baseUrl}/registrations/${registrationId}/submissions/${submissionId}/official-response`,
      request,
    );
  }

  synchronizePlaces(request: {
    providerCode: string;
    countryCode: string;
    administrativeAreaCode: string | null;
    examCategory: string | null;
    fromUtc: string;
    toUtc: string;
    centerExternalIds: readonly string[];
  }): Observable<ExamPlaceSynchronization> {
    return this.http.post<ExamPlaceSynchronization>(`${this.baseUrl}/places/synchronize`, request);
  }
  importPlaces(request: {
    providerCode: string;
    rows: readonly unknown[];
  }): Observable<ExamPlaceSynchronization> {
    return this.http.post<ExamPlaceSynchronization>(`${this.baseUrl}/places/import`, request);
  }
  receiveConvocation(
    registrationId: string,
    request: {
      examCenterId: string;
      scheduledStartUtc: string;
      scheduledEndUtc: string;
      providerCode: string;
      officialReference: string | null;
      candidateReference: string | null;
      instructions: string | null;
      requiredDocuments: string | null;
      providerPayloadReference: string | null;
      operationId: string;
    },
  ): Observable<ExamConvocation> {
    return this.http.post<ExamConvocation>(
      `${this.baseUrl}/registrations/${registrationId}/convocation`,
      request,
    );
  }
}
