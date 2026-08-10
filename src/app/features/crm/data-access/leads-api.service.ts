import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_CONFIG, ApiConfig } from '../../../core/config/api-config';
import { CreateLeadRequest, CreateLeadResponse } from '../models/create-lead-request';
import { LeadDetails } from '../models/lead.model';
import { LeadListItem } from '../models/lead.model';
import { PagedResponse } from '../../../core/models/paged-response';
import { LeadLifecycleAction } from '../domain/lead-lifecycle';

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

  changeStatus(leadId: string, action: LeadLifecycleAction, reason?: string): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/${leadId}/lifecycle/${action}`,
      { reason: reason?.trim() || null },
    );
  }
}
