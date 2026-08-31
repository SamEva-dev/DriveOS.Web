import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG, ApiConfig } from '../../../core/config/api-config';
import {
  TrainingDeliveryDashboard,
  TrainingDeliveryPendingReportsResponse,
} from '../models/training-delivery.models';
import { GroupTrainingSession } from '../models/group-training-session.models';
import {
  TrainingIncidentDetail,
  TrainingSessionDetail,
  TrainingSessionInternalNote,
  TrainingSessionReportReview,
  TrainingSessionReportRevision,
  TrainingSessionPreparation,
} from '../models/training-session-detail.models';

export interface CorrectTrainingSessionAttendanceRequest {
  readonly operationId: string;
  readonly status: number;
  readonly actualArrivalAtUtc: string | null;
  readonly actualDepartureAtUtc: string | null;
  readonly reason: string | null;
  readonly evidenceDocumentId: string | null;
  readonly overrideReason: string | null;
}

export interface RecordTrainingSessionInterventionRequest {
  readonly operationId: string;
  readonly type: number;
  readonly severity: number;
  readonly occurredAtUtc: string;
  readonly context: string;
  readonly reason: string;
  readonly relatedCompetencyId: string | null;
  readonly outcome: string | null;
  readonly internalComment: string | null;
  readonly sharedExplanation: string | null;
}

export interface RecordTrainingSessionObservationRequest {
  readonly operationId: string;
  readonly type: number;
  readonly observedAtUtc: string;
  readonly content: string;
  readonly isInternal: boolean;
}

export interface RecordTrainingSessionMarkerRequest {
  readonly operationId: string;
  readonly type: number;
  readonly occurredAtUtc: string;
  readonly competencyId: string | null;
  readonly shortNote: string;
  readonly severity: number;
  readonly latitude: number | null;
  readonly longitude: number | null;
  readonly createdOffline: boolean;
}

export interface InterruptTrainingSessionRequest {
  readonly operationId: string;
  readonly reason: number;
  readonly description: string | null;
  readonly interruptedAtUtc: string;
}

export interface ResumeTrainingSessionRequest {
  readonly operationId: string;
  readonly resumedAtUtc: string;
}

export interface RecordTrainingSessionOdometerRequest {
  readonly operationId: string;
  readonly odometerKilometers: number;
  readonly source: number;
  readonly observedAtUtc: string;
}

export interface RecordTrainingSessionEnergyRequest {
  readonly operationId: string;
  readonly type: number;
  readonly energyLevelPercent: number | null;
  readonly quantity: number | null;
  readonly observedAtUtc: string;
  readonly note: string | null;
  readonly createdOffline: boolean;
}

export interface FinishTrainingSessionRequest {
  readonly operationId: string;
  readonly actualEndAtUtc: string;
  readonly endEnergyLevelPercent: number | null;
}

export interface SaveTrainingSessionReportDraftRequest {
  readonly operationId: string;
  readonly expectedVersion: number;
  readonly lastCompletedStep: number;
  readonly summary: string | null;
  readonly objectivesWorked: string | null;
  readonly objectivesAchieved: string | null;
  readonly nextObjective: string | null;
  readonly sharedComment: string | null;
  readonly internalNote: string | null;
}

export interface ReportTrainingIncidentRequest {
  readonly operationId: string;
  readonly incidentType: number;
  readonly severity: number;
  readonly occurredAtUtc: string;
  readonly description: string;
  readonly immediateActions: string;
  readonly additionalParticipants: readonly [];
}

@Injectable({ providedIn: 'root' })
export class TrainingDeliveryApiService {
  private readonly http = inject(HttpClient);
  private readonly config = inject<ApiConfig>(API_CONFIG);
  private readonly baseUrl = `${this.config.baseUrl}/training-delivery`;

  getDashboard(startAtUtc: string, endAtUtc: string): Observable<TrainingDeliveryDashboard> {
    const params = new HttpParams().set('startAtUtc', startAtUtc).set('endAtUtc', endAtUtc);
    return this.http.get<TrainingDeliveryDashboard>(`${this.baseUrl}/dashboard`, { params });
  }

  getPendingReports(mineOnly: boolean): Observable<TrainingDeliveryPendingReportsResponse> {
    const params = new HttpParams().set('mineOnly', mineOnly);
    return this.http.get<TrainingDeliveryPendingReportsResponse>(
      `${this.baseUrl}/pending-reports`,
      { params },
    );
  }

  getMyDay(startAtUtc: string, endAtUtc: string): Observable<TrainingDeliveryDashboard> {
    const params = new HttpParams().set('startAtUtc', startAtUtc).set('endAtUtc', endAtUtc);
    return this.http.get<TrainingDeliveryDashboard>(`${this.baseUrl}/my-day`, { params });
  }

  getSession(sessionId: string): Observable<TrainingSessionDetail> {
    return this.http.get<TrainingSessionDetail>(`${this.baseUrl}/sessions/${sessionId}`);
  }

  prepareSession(sessionId: string): Observable<TrainingSessionPreparation> {
    return this.http.post<TrainingSessionPreparation>(
      `${this.baseUrl}/sessions/${sessionId}/prepare`,
      {},
    );
  }

  startSession(sessionId: string): Observable<TrainingSessionDetail> {
    return this.http.post<TrainingSessionDetail>(`${this.baseUrl}/sessions/${sessionId}/start`, {
      operationId: crypto.randomUUID(),
      startedAtUtc: new Date().toISOString(),
    });
  }

  correctAttendance(
    sessionId: string,
    request: CorrectTrainingSessionAttendanceRequest,
  ): Observable<TrainingSessionDetail> {
    return this.http.post<TrainingSessionDetail>(
      `${this.baseUrl}/sessions/${sessionId}/attendance/correct`,
      request,
    );
  }

  overrideAttendance(
    sessionId: string,
    request: CorrectTrainingSessionAttendanceRequest,
  ): Observable<TrainingSessionDetail> {
    return this.http.post<TrainingSessionDetail>(
      `${this.baseUrl}/sessions/${sessionId}/attendance/override`,
      request,
    );
  }

  recordIntervention(
    sessionId: string,
    request: RecordTrainingSessionInterventionRequest,
  ): Observable<TrainingSessionDetail> {
    return this.http.post<TrainingSessionDetail>(
      `${this.baseUrl}/sessions/${sessionId}/interventions`,
      request,
    );
  }

  recordObservation(
    sessionId: string,
    request: RecordTrainingSessionObservationRequest,
  ): Observable<TrainingSessionDetail> {
    return this.http.post<TrainingSessionDetail>(
      `${this.baseUrl}/sessions/${sessionId}/observations`,
      request,
    );
  }

  recordMarker(
    sessionId: string,
    request: RecordTrainingSessionMarkerRequest,
  ): Observable<TrainingSessionDetail> {
    return this.http.post<TrainingSessionDetail>(
      `${this.baseUrl}/sessions/${sessionId}/markers`,
      request,
    );
  }

  interruptSession(
    sessionId: string,
    request: InterruptTrainingSessionRequest,
  ): Observable<TrainingSessionDetail> {
    return this.http.post<TrainingSessionDetail>(
      `${this.baseUrl}/sessions/${sessionId}/interrupt`,
      request,
    );
  }

  resumeSession(
    sessionId: string,
    request: ResumeTrainingSessionRequest,
  ): Observable<TrainingSessionDetail> {
    return this.http.post<TrainingSessionDetail>(
      `${this.baseUrl}/sessions/${sessionId}/resume`,
      request,
    );
  }

  recordOdometer(
    sessionId: string,
    request: RecordTrainingSessionOdometerRequest,
  ): Observable<TrainingSessionDetail> {
    return this.http.post<TrainingSessionDetail>(
      `${this.baseUrl}/sessions/${sessionId}/odometer`,
      request,
    );
  }

  recordEnergy(
    sessionId: string,
    request: RecordTrainingSessionEnergyRequest,
  ): Observable<TrainingSessionDetail> {
    return this.http.post<TrainingSessionDetail>(
      `${this.baseUrl}/sessions/${sessionId}/energy`,
      request,
    );
  }

  finishSession(
    sessionId: string,
    request: FinishTrainingSessionRequest,
  ): Observable<TrainingSessionDetail> {
    return this.http.post<TrainingSessionDetail>(
      `${this.baseUrl}/sessions/${sessionId}/finish`,
      request,
    );
  }

  saveReportDraft(
    sessionId: string,
    request: SaveTrainingSessionReportDraftRequest,
  ): Observable<TrainingSessionDetail> {
    return this.http.put<TrainingSessionDetail>(
      `${this.baseUrl}/sessions/${sessionId}/report/draft`,
      request,
    );
  }

  updateSharedComment(
    sessionId: string,
    request: { operationId: string; expectedVersion: number; content: string | null },
  ): Observable<TrainingSessionDetail> {
    return this.http.put<TrainingSessionDetail>(
      `${this.baseUrl}/sessions/${sessionId}/report/shared-comment`,
      request,
    );
  }

  updateInternalNote(
    sessionId: string,
    request: { operationId: string; expectedVersion: number; content: string | null },
  ): Observable<TrainingSessionDetail> {
    return this.http.put<TrainingSessionDetail>(
      `${this.baseUrl}/sessions/${sessionId}/report/internal-note`,
      request,
    );
  }

  getInternalNote(sessionId: string): Observable<TrainingSessionInternalNote> {
    return this.http.get<TrainingSessionInternalNote>(
      `${this.baseUrl}/sessions/${sessionId}/report/internal-note`,
    );
  }

  getReportReview(sessionId: string): Observable<TrainingSessionReportReview> {
    return this.http.get<TrainingSessionReportReview>(
      `${this.baseUrl}/sessions/${sessionId}/report/review`,
    );
  }

  markReportReady(sessionId: string, expectedVersion: number): Observable<TrainingSessionDetail> {
    return this.http.post<TrainingSessionDetail>(
      `${this.baseUrl}/sessions/${sessionId}/report/ready`,
      { operationId: crypto.randomUUID(), expectedVersion },
    );
  }

  submitReport(
    sessionId: string,
    expectedVersion: number,
    requestSupervisorReview: boolean,
  ): Observable<TrainingSessionDetail> {
    return this.http.post<TrainingSessionDetail>(
      `${this.baseUrl}/sessions/${sessionId}/report/submit`,
      { operationId: crypto.randomUUID(), expectedVersion, requestSupervisorReview },
    );
  }

  getReportRevisions(sessionId: string): Observable<readonly TrainingSessionReportRevision[]> {
    return this.http.get<readonly TrainingSessionReportRevision[]>(
      `${this.baseUrl}/sessions/${sessionId}/report/revisions`,
    );
  }

  requestReportRevision(
    sessionId: string,
    request: {
      operationId: string;
      expectedVersion: number;
      scenario: number;
      fieldCode: string;
      currentValue: string;
      proposedValue: string;
      reason: string;
      hasFinancialImpact: boolean;
      approvalRequired: boolean;
    },
  ): Observable<TrainingSessionReportRevision> {
    return this.http.post<TrainingSessionReportRevision>(
      `${this.baseUrl}/sessions/${sessionId}/report/revisions`,
      request,
    );
  }

  decideReportRevision(
    sessionId: string,
    revisionId: string,
    approve: boolean,
    decisionReason: string | null,
  ): Observable<TrainingSessionReportRevision> {
    return this.http.post<TrainingSessionReportRevision>(
      `${this.baseUrl}/sessions/${sessionId}/report/revisions/${revisionId}/decision`,
      { approve, decisionReason },
    );
  }

  getGroupSession(sessionId: string): Observable<GroupTrainingSession> {
    return this.http.get<GroupTrainingSession>(`${this.baseUrl}/group-sessions/${sessionId}`);
  }
  addGroupParticipant(sessionId: string, studentId: string): Observable<GroupTrainingSession> {
    return this.http.post<GroupTrainingSession>(
      `${this.baseUrl}/group-sessions/${sessionId}/participants`,
      { studentId, operationId: crypto.randomUUID() },
    );
  }
  recordGroupAttendance(
    sessionId: string,
    studentId: string,
    status: number,
    method: number,
  ): Observable<GroupTrainingSession> {
    return this.http.post<GroupTrainingSession>(
      `${this.baseUrl}/group-sessions/${sessionId}/attendance`,
      {
        studentId,
        status,
        method,
        checkInAtUtc: status === 1 || status === 3 ? new Date().toISOString() : null,
        checkOutAtUtc: null,
        operationId: crypto.randomUUID(),
      },
    );
  }
  recordGroupAssessment(
    sessionId: string,
    request: {
      studentId: string;
      competencyId: string | null;
      level: number | null;
      quizScore: number | null;
      observation: string | null;
    },
  ): Observable<GroupTrainingSession> {
    return this.http.post<GroupTrainingSession>(
      `${this.baseUrl}/group-sessions/${sessionId}/assessments`,
      { ...request, operationId: crypto.randomUUID() },
    );
  }
  saveGroupReport(
    sessionId: string,
    report: string,
    sharedObjectives: string | null,
  ): Observable<GroupTrainingSession> {
    return this.http.put<GroupTrainingSession>(
      `${this.baseUrl}/group-sessions/${sessionId}/report`,
      { report, sharedObjectives, operationId: crypto.randomUUID() },
    );
  }
  prepareGroupCertificate(sessionId: string, studentId: string): Observable<GroupTrainingSession> {
    return this.http.post<GroupTrainingSession>(
      `${this.baseUrl}/group-sessions/${sessionId}/certificates/prepare`,
      { studentId, operationId: crypto.randomUUID() },
    );
  }

  reportIncident(
    sessionId: string,
    request: ReportTrainingIncidentRequest,
  ): Observable<TrainingIncidentDetail> {
    return this.http.post<TrainingIncidentDetail>(
      `${this.baseUrl}/sessions/${sessionId}/incidents`,
      request,
    );
  }

  getSessionIncidents(sessionId: string): Observable<readonly TrainingIncidentDetail[]> {
    return this.http.get<readonly TrainingIncidentDetail[]>(
      `${this.baseUrl}/sessions/${sessionId}/incidents`,
    );
  }
}
