import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_CONFIG, ApiConfig } from '../../../../core/config/api-config';
import { OrganizationActivationReadiness } from '../models/organization-activation-readiness.model';

@Injectable({ providedIn: 'root' })
export class OrganizationActivationReadinessApiService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject<ApiConfig>(API_CONFIG);

  get(organizationId: string): Observable<OrganizationActivationReadiness> {
    return this.http.get<OrganizationActivationReadiness>(
      `${this.apiConfig.baseUrl}/organizations/${organizationId}/activation-readiness`,
    );
  }
}
