import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_CONFIG, ApiConfig } from '../../../core/config/api-config';
import { CreateLeadRequest, CreateLeadResponse } from '../models/create-lead-request';
import { LeadDetails } from '../models/lead.model';
import { LeadClosureReason, LeadStatus } from '../models/lead.model';
import { LeadListItem } from '../models/lead.model';
import { PagedResponse } from '../../../core/models/paged-response';
import { LeadLifecycleAction } from '../domain/lead-lifecycle';
import { QualifyLeadRequest } from '../models/qualify-lead-request';
import { GetLeadsParameters } from '../models/get-leads-parameters';

export interface ConvertLeadResponse {
  conversionId: string;
  status: 'Requested' | 'Processing' | 'Completed' | 'Failed';
  alreadyRequested: boolean;
  acceptedOfferId: string;
  studentPersonId: string | null;
  studentEnrollmentId: string | null;
  checklist: { code: string; completed: boolean }[];
}

export interface ConvertLeadRequest {
  acceptedOfferId: string; branchId: string; responsibleUserId: string; trainingCode: string;
  identityVerified: boolean; consentsVerified: boolean; duplicateCheckCompleted: boolean;
  guardianSummary: string | null; payerSummary: string | null; requiredDocumentCodes: string[];
}

@Injectable({ providedIn: 'root' })
export class LeadsApiService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject<ApiConfig>(API_CONFIG);
  private readonly baseUrl = `${this.apiConfig.baseUrl}/crm/leads`;

  create(request: CreateLeadRequest): Observable<CreateLeadResponse> {
    return this.http.post<CreateLeadResponse>(this.baseUrl, request);
  }

  getById(leadId: string): Observable<LeadDetails> {
    return this.http.get<LeadDetails>(`${this.baseUrl}/${leadId}`);
  }

  getPipeline(): Observable<PagedResponse<LeadListItem>> {
    const params = new HttpParams()
      .set('pageNumber', 1)
      .set('pageSize', 100)
      .set('sortBy', 'createdAtUtc')
      .set('sortDirection', 'desc');
    return this.http.get<PagedResponse<LeadListItem>>(this.baseUrl, { params });
  }

  exportCsv(parameters: GetLeadsParameters): Observable<Blob> {
    let params = new HttpParams()
      .set('search', parameters.search)
      .set('unassignedOnly', parameters.unassignedOnly);
    if (parameters.status) params = params.set('status', parameters.status);
    if (parameters.sourceType) params = params.set('sourceType', parameters.sourceType);
    if (parameters.branchId) params = params.set('branchId', parameters.branchId);
    if (parameters.assignedAdvisorId) params = params.set('assignedAdvisorId', parameters.assignedAdvisorId);
    return this.http.get(`${this.baseUrl}/export`, { params, responseType: 'blob' });
  }

  changeStatus(leadId: string, action: LeadLifecycleAction, reason?: string): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/${leadId}/lifecycle/${action}`,
      { reason: reason?.trim() || null },
    );
  }

  qualify(leadId: string, request: QualifyLeadRequest): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${leadId}/qualification`, request);
  }

  convert(leadId: string, request: ConvertLeadRequest): Observable<ConvertLeadResponse> {
    return this.http.post<ConvertLeadResponse>(`${this.baseUrl}/${leadId}/convert`, request);
  }

  close(leadId: string, request: { decision: LeadStatus; reason: LeadClosureReason; comment: string | null }): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${leadId}/status/close`, request);
  }
  setDormant(leadId: string, request: { reason: LeadClosureReason; resumeAtUtc: string;
    responsibleUserId: string; campaignCode: string | null; comment: string | null }): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${leadId}/status/dormant`, request);
  }
  referToPartner(leadId: string, request: { partnerName: string; sharedDataDescription: string;
    consentCollectedAtUtc: string; comment: string | null }): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${leadId}/status/refer`, request);
  }
  reopen(leadId: string, comment: string | null): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${leadId}/status/reopen`, { comment });
  }
}
