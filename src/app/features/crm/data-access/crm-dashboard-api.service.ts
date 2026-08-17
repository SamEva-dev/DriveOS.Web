import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG, ApiConfig } from '../../../core/config/api-config';
import { CrmDashboard, CrmDashboardFilters } from '../models/crm-dashboard.model';

@Injectable({ providedIn: 'root' })
export class CrmDashboardApiService {
  private readonly http = inject(HttpClient);
  private readonly config = inject<ApiConfig>(API_CONFIG);

  get(
    scope: 'branch' | 'organization' | 'network',
    branchId?: string,
    filters: CrmDashboardFilters = {},
  ): Observable<CrmDashboard> {
    let params = new HttpParams().set('scope', scope);
    if (branchId) params = params.set('branchId', branchId);
    for (const [key, value] of Object.entries(filters)) {
      if (value) params = params.set(key, value);
    }
    return this.http.get<CrmDashboard>(`${this.config.baseUrl}/crm/dashboard`, { params });
  }
}
