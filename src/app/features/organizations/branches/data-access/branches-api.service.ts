import { HttpClient, HttpParams } from '@angular/common/http';

import { Injectable, inject } from '@angular/core';

import { Observable } from 'rxjs';

import { API_CONFIG, ApiConfig } from '../../../../core/config/api-config';

import { PagedResponse } from '../../../../core/models/paged-response';

import { BranchListItem } from '../models/branch-list-item';

import { BranchStatusHistoryItem } from '../models/branch-status-history-item';

import { Branch } from '../models/branch.model';

import { ChangeBranchStatusRequest } from '../models/change-branch-status-request';

import { CreateBranchRequest } from '../models/create-branch-request';

import { CreateBranchResponse } from '../models/create-branch-response';

import { GetBranchesParameters } from '../models/get-branches-parameters';

import { UpdateBranchRequest } from '../models/update-branch-request';

import { BranchLifecycleActionCode } from '../domain/branch-lifecycle';

@Injectable({
  providedIn: 'root',
})
export class BranchesApiService {
  private readonly http = inject(HttpClient);

  private readonly apiConfig = inject<ApiConfig>(API_CONFIG);

  getPaged(
    organizationId: string,
    parameters: GetBranchesParameters,
  ): Observable<PagedResponse<BranchListItem>> {
    const params = new HttpParams()
      .set('pageNumber', parameters.pageNumber)
      .set('pageSize', parameters.pageSize)
      .set('sortBy', parameters.sortBy)
      .set('sortDirection', parameters.sortDirection);

    const finalParams = parameters.search.trim()
      ? params.set('search', parameters.search.trim())
      : params;

    return this.http.get<PagedResponse<BranchListItem>>(this.getBaseUrl(organizationId), {
      params: finalParams,
    });
  }

  getById(organizationId: string, branchId: string): Observable<Branch> {
    return this.http.get<Branch>(`${this.getBaseUrl(organizationId)}/${branchId}`);
  }

  create(organizationId: string, request: CreateBranchRequest): Observable<CreateBranchResponse> {
    return this.http.post<CreateBranchResponse>(this.getBaseUrl(organizationId), request);
  }

  update(organizationId: string, branchId: string, request: UpdateBranchRequest): Observable<void> {
    return this.http.put<void>(`${this.getBaseUrl(organizationId)}/${branchId}`, request);
  }

  setPrimary(organizationId: string, branchId: string): Observable<void> {
    return this.http.post<void>(`${this.getBaseUrl(organizationId)}/${branchId}/set-primary`, null);
  }

  getStatusHistory(
    organizationId: string,
    branchId: string,
  ): Observable<readonly BranchStatusHistoryItem[]> {
    return this.http.get<readonly BranchStatusHistoryItem[]>(
      `${this.getBaseUrl(organizationId)}/${branchId}/status-history`,
    );
  }

  changeStatus(
    organizationId: string,
    branchId: string,
    action: BranchLifecycleActionCode,
    request: ChangeBranchStatusRequest,
  ): Observable<void> {
    return this.http.post<void>(
      `${this.getBaseUrl(organizationId)}/${branchId}/${action}`,
      request,
    );
  }

  private getBaseUrl(organizationId: string): string {
    return [this.apiConfig.baseUrl, 'organizations', organizationId, 'branches'].join('/');
  }
}
