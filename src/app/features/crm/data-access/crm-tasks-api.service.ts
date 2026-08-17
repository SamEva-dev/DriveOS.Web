import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG, ApiConfig } from '../../../core/config/api-config';
import { CreateCrmTaskRequest, CrmTask } from '../models/crm-task.model';

@Injectable({ providedIn: 'root' })
export class CrmTasksApiService {
  private readonly http = inject(HttpClient);
  private readonly config = inject<ApiConfig>(API_CONFIG);
  private readonly baseUrl = `${this.config.baseUrl}/crm`;

  getByLead(leadId: string): Observable<CrmTask[]> {
    return this.http.get<CrmTask[]>(`${this.baseUrl}/leads/${leadId}/tasks`);
  }
  getPending(): Observable<CrmTask[]> {
    return this.http.get<CrmTask[]>(`${this.baseUrl}/tasks`);
  }
  create(leadId: string, request: CreateCrmTaskRequest): Observable<{ taskId: string }> {
    return this.http.post<{ taskId: string }>(`${this.baseUrl}/leads/${leadId}/tasks`, request);
  }
  complete(taskId: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/tasks/${taskId}/complete`, {});
  }
  cancel(taskId: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/tasks/${taskId}/cancel`, {});
  }
}
