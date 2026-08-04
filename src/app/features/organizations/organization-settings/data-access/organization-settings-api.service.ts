import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG, ApiConfig } from '../../../../core/config/api-config';
import { OrganizationSettings } from '../models/organization-settings.model';
import {
  CreateOrganizationSettingsRequest,
  UpdateOrganizationAddressRequest,
  UpdateOrganizationContactRequest,
  UpdateOrganizationOperationalSettingsRequest,
  UpdateOrganizationProfileRequest,
  UpdateOrganizationRegionalSettingsRequest,
} from '../models/organization-settings.requests';

@Injectable({ providedIn: 'root' })
export class OrganizationSettingsApiService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject<ApiConfig>(API_CONFIG);

  get(organizationId: string): Observable<OrganizationSettings> {
    return this.http.get<OrganizationSettings>(this.url(organizationId));
  }

  create(organizationId: string, request: CreateOrganizationSettingsRequest): Observable<void> {
    return this.http.post<void>(this.url(organizationId), request);
  }

  updateProfile(organizationId: string, request: UpdateOrganizationProfileRequest): Observable<void> {
    return this.http.put<void>(`${this.url(organizationId)}/profile`, request);
  }

  updateContact(organizationId: string, request: UpdateOrganizationContactRequest): Observable<void> {
    return this.http.put<void>(`${this.url(organizationId)}/contact`, request);
  }

  updateAddress(organizationId: string, request: UpdateOrganizationAddressRequest): Observable<void> {
    return this.http.put<void>(`${this.url(organizationId)}/address`, request);
  }

  updateRegional(
    organizationId: string,
    request: UpdateOrganizationRegionalSettingsRequest,
  ): Observable<void> {
    return this.http.put<void>(`${this.url(organizationId)}/regional`, request);
  }

  updateOperational(
    organizationId: string,
    request: UpdateOrganizationOperationalSettingsRequest,
  ): Observable<void> {
    return this.http.put<void>(`${this.url(organizationId)}/operational`, request);
  }

  private url(organizationId: string): string {
    return `${this.apiConfig.baseUrl}/organizations/${organizationId}/settings`;
  }
}
