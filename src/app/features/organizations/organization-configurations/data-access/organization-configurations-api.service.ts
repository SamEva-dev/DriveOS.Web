import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG, ApiConfig } from '../../../../core/config/api-config';
import {
  OrganizationConfiguration,
  OrganizationConfigurationListItem,
} from '../models/organization-configuration.model';
import {
  ArchiveOrganizationConfigurationRequest,
  CreateOrganizationConfigurationDraftRequest,
  PublishOrganizationConfigurationRequest,
  UpdateOrganizationConfigurationDraftRequest,
} from '../models/organization-configuration.requests';

@Injectable({ providedIn: 'root' })
export class OrganizationConfigurationsApiService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject<ApiConfig>(API_CONFIG);

  getVersions(organizationId: string): Observable<readonly OrganizationConfigurationListItem[]> {
    return this.http.get<readonly OrganizationConfigurationListItem[]>(
      this.baseUrl(organizationId),
    );
  }

  getById(organizationId: string, configurationId: string): Observable<OrganizationConfiguration> {
    return this.http.get<OrganizationConfiguration>(
      `${this.baseUrl(organizationId)}/${configurationId}`,
    );
  }

  createDraft(
    organizationId: string,
    request: CreateOrganizationConfigurationDraftRequest,
  ): Observable<{ readonly id: string }> {
    return this.http.post<{ readonly id: string }>(this.baseUrl(organizationId), request);
  }

  updateDraft(
    organizationId: string,
    configurationId: string,
    request: UpdateOrganizationConfigurationDraftRequest,
  ): Observable<void> {
    return this.http.put<void>(`${this.baseUrl(organizationId)}/${configurationId}`, request);
  }

  publish(
    organizationId: string,
    configurationId: string,
    request: PublishOrganizationConfigurationRequest,
  ): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl(organizationId)}/${configurationId}/publish`,
      request,
    );
  }

  archive(
    organizationId: string,
    configurationId: string,
    request: ArchiveOrganizationConfigurationRequest,
  ): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl(organizationId)}/${configurationId}/archive`,
      request,
    );
  }

  private baseUrl(organizationId: string): string {
    return `${this.apiConfig.baseUrl}/organizations/${organizationId}/configurations`;
  }
}
