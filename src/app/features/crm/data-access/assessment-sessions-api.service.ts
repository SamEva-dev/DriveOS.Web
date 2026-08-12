import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_CONFIG, ApiConfig } from '../../../core/config/api-config';
import {
  AssessmentAppointment,
  AssessmentQuestionnaireSnapshot,
  AssessmentSession,
  SaveAssessmentDraftRequest,
} from '../models/assessment-session.model';
import {
  AssessmentResult,
  SaveAssessmentResultRequest,
} from '../models/assessment-result.model';

@Injectable({ providedIn: 'root' })
export class AssessmentSessionsApiService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject<ApiConfig>(API_CONFIG);
  private readonly baseUrl = `${this.apiConfig.baseUrl}/crm/assessments`;

  getAppointment(appointmentId: string): Observable<AssessmentAppointment> {
    return this.http.get<AssessmentAppointment>(`${this.baseUrl}/${appointmentId}`);
  }

  getByLead(leadId: string): Observable<AssessmentAppointment[]> {
    return this.http.get<AssessmentAppointment[]>(`${this.apiConfig.baseUrl}/crm/leads/${leadId}/assessments`);
  }

  getSession(appointmentId: string): Observable<AssessmentSession> {
    return this.http.get<AssessmentSession>(`${this.baseUrl}/${appointmentId}/session`);
  }

  start(
    appointmentId: string,
    questionnaireCode: string,
    questionnaireVersion: number,
    questionnaireSnapshot: AssessmentQuestionnaireSnapshot,
  ): Observable<{ sessionId: string }> {
    return this.http.post<{ sessionId: string }>(`${this.baseUrl}/${appointmentId}/session/start`, {
      questionnaireCode,
      questionnaireVersion,
      questionnaireSnapshot,
    });
  }

  saveDraft(appointmentId: string, request: SaveAssessmentDraftRequest): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${appointmentId}/session/draft`, request);
  }

  submit(appointmentId: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${appointmentId}/session/submit`, {});
  }

  getResult(appointmentId: string): Observable<AssessmentResult> {
    return this.http.get<AssessmentResult>(`${this.baseUrl}/${appointmentId}/result`);
  }

  saveResult(appointmentId: string, request: SaveAssessmentResultRequest): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${appointmentId}/result`, request);
  }

  requestResultCorrection(appointmentId: string, expectedRevision: number, reason: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${appointmentId}/result/request-correction`, {
      expectedRevision,
      reason,
    });
  }

  validateResult(appointmentId: string, expectedRevision: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${appointmentId}/result/validate`, { expectedRevision });
  }

  shareResult(appointmentId: string, expectedRevision: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${appointmentId}/result/share`, { expectedRevision });
  }
}
