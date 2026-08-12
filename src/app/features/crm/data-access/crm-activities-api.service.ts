import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG, ApiConfig } from '../../../core/config/api-config';
import { CreateCrmActivityRequest, CrmActivity } from '../models/crm-activity.model';

@Injectable({ providedIn: 'root' })
export class CrmActivitiesApiService {
  private readonly http = inject(HttpClient);
  private readonly config = inject<ApiConfig>(API_CONFIG);
  private readonly baseUrl = `${this.config.baseUrl}/crm`;

  getRecent(limit = 200): Observable<CrmActivity[]> {
    return this.http.get<CrmActivity[]>(`${this.baseUrl}/activities`, { params: { limit } });
  }

  getByLead(leadId: string): Observable<CrmActivity[]> {
    return this.http.get<CrmActivity[]>(`${this.baseUrl}/leads/${leadId}/activities`);
  }

  create(leadId: string, request: CreateCrmActivityRequest): Observable<{ activityId: string }> {
    return this.http.post<{ activityId: string }>(`${this.baseUrl}/leads/${leadId}/activities`, request);
  }
}
