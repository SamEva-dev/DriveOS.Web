import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { OrganizationConfigurationListItem } from '../../organization-configurations/models/organization-configuration.model';
import { BranchConfigurationOverride, BranchConfigurationOverrideListItem } from '../models/branch-configuration-override.model';
import { ArchiveBranchConfigurationOverrideRequest, CreateBranchConfigurationOverrideDraftRequest, PublishBranchConfigurationOverrideRequest, UpdateBranchConfigurationOverrideDraftRequest } from '../models/branch-configuration-override.requests';
import { ApiConfig, API_CONFIG } from '../../../../core/config/api-config';

@Injectable({ providedIn: 'root' })
export class BranchConfigurationOverridesApiService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject<ApiConfig>(API_CONFIG);

  getVersions(organizationId: string, branchId: string): Observable<readonly BranchConfigurationOverrideListItem[]> {
    return this.http.get<readonly BranchConfigurationOverrideListItem[]>(this.baseUrl(organizationId, branchId));
  }

  getById(organizationId: string, branchId: string, overrideId: string): Observable<BranchConfigurationOverride> {
    return this.http.get<BranchConfigurationOverride>(`${this.baseUrl(organizationId, branchId)}/${overrideId}`);
  }

  getOrganizationConfigurations(organizationId: string): Observable<readonly OrganizationConfigurationListItem[]> {
    return this.http.get<readonly OrganizationConfigurationListItem[]>(`${this.apiConfig.baseUrl}/organizations/${organizationId}/configurations`);
  }

  createDraft(organizationId: string, branchId: string, request: CreateBranchConfigurationOverrideDraftRequest): Observable<{ readonly id: string }> {
    return this.http.post<{ readonly id: string }>(this.baseUrl(organizationId, branchId), request);
  }

  updateDraft(organizationId: string, branchId: string, overrideId: string, request: UpdateBranchConfigurationOverrideDraftRequest): Observable<void> {
    return this.http.put<void>(`${this.baseUrl(organizationId, branchId)}/${overrideId}`, request);
  }

  publish(organizationId: string, branchId: string, overrideId: string, request: PublishBranchConfigurationOverrideRequest): Observable<void> {
    return this.http.post<void>(`${this.baseUrl(organizationId, branchId)}/${overrideId}/publish`, request);
  }

  archive(organizationId: string, branchId: string, overrideId: string, request: ArchiveBranchConfigurationOverrideRequest): Observable<void> {
    return this.http.post<void>(`${this.baseUrl(organizationId, branchId)}/${overrideId}/archive`, request);
  }

  private baseUrl(organizationId: string, branchId: string): string {
    return `${this.apiConfig.baseUrl}/organizations/${organizationId}/branches/${branchId}/configuration-overrides`;
  }
}
