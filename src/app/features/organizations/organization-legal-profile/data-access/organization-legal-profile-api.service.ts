import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { OrganizationLegalProfile } from '../models/organization-legal-profile.model';
import {
  ChangeOrganizationLegalProfileStatusRequest,
  CreateOrganizationLegalProfileRequest,
  UpdateOrganizationLegalProfileRequest,
} from '../models/organization-legal-profile.requests';
import { ApiConfig, API_CONFIG } from '../../../../core/config/api-config';

@Injectable({ providedIn: 'root' })
export class OrganizationLegalProfileApiService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject<ApiConfig>(API_CONFIG);

  get(organizationId: string): Observable<OrganizationLegalProfile> {
    return this.http.get<OrganizationLegalProfile>(this.url(organizationId));
  }

  create(
    organizationId: string,
    request: CreateOrganizationLegalProfileRequest,
  ): Observable<{ readonly id: string }> {
    return this.http.post<{ readonly id: string }>(this.url(organizationId), request);
  }

  update(
    organizationId: string,
    request: UpdateOrganizationLegalProfileRequest,
  ): Observable<void> {
    return this.http.put<void>(this.url(organizationId), request);
  }

  activate(
    organizationId: string,
    request: ChangeOrganizationLegalProfileStatusRequest,
  ): Observable<void> {
    return this.http.post<void>(`${this.url(organizationId)}/activate`, request);
  }

  archive(
    organizationId: string,
    request: ChangeOrganizationLegalProfileStatusRequest,
  ): Observable<void> {
    return this.http.post<void>(`${this.url(organizationId)}/archive`, request);
  }

  private url(organizationId: string): string {
    return `${this.apiConfig.baseUrl}/organizations/${organizationId}/legal-profile`;
  }
}
