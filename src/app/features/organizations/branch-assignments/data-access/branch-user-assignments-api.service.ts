import { HttpClient, HttpParams } from '@angular/common/http';

import { Injectable, inject } from '@angular/core';

import { Observable } from 'rxjs';

import { API_CONFIG, ApiConfig } from '../../../../core/config/api-config';

import { PagedResponse } from '../../../../core/models/paged-response';

import { BranchUserAssignment } from '../models/branch-user-assignment.model';

import { ChangeBranchUserAssignmentStatusRequest } from '../models/change-branch-user-assignment-status-request';

import { CreateBranchUserAssignmentRequest } from '../models/create-branch-user-assignment-request';

import { CreateBranchUserAssignmentResponse } from '../models/create-branch-user-assignment-response';

import { GetBranchUserAssignmentsParameters } from '../models/get-branch-user-assignments-parameters';

import { GetUserBranchAssignmentsParameters } from '../models/get-user-branch-assignments-parameters';

@Injectable({
  providedIn: 'root',
})
export class BranchUserAssignmentsApiService {
  private readonly http = inject(HttpClient);

  private readonly apiConfig = inject<ApiConfig>(API_CONFIG);

  create(
    organizationId: string,
    branchId: string,
    request: CreateBranchUserAssignmentRequest,
  ): Observable<CreateBranchUserAssignmentResponse> {
    return this.http.post<CreateBranchUserAssignmentResponse>(
      this.getBranchAssignmentsUrl(organizationId, branchId),
      request,
    );
  }

  getById(organizationId: string, assignmentId: string): Observable<BranchUserAssignment> {
    return this.http.get<BranchUserAssignment>(
      `${this.getAssignmentsUrl(organizationId)}/${assignmentId}`,
    );
  }

  getByBranch(
    organizationId: string,
    branchId: string,
    parameters: GetBranchUserAssignmentsParameters,
  ): Observable<PagedResponse<BranchUserAssignment>> {
    let params = new HttpParams()
      .set('pageNumber', parameters.pageNumber)
      .set('pageSize', parameters.pageSize)
      .set('sortBy', parameters.sortBy)
      .set('sortDirection', parameters.sortDirection);

    if (parameters.search.trim()) {
      params = params.set('search', parameters.search.trim());
    }

    if (parameters.status) {
      params = params.set('status', parameters.status);
    }

    if (parameters.role) {
      params = params.set('role', parameters.role);
    }

    if (parameters.assignmentType) {
      params = params.set('assignmentType', parameters.assignmentType);
    }

    return this.http.get<PagedResponse<BranchUserAssignment>>(
      this.getBranchAssignmentsUrl(organizationId, branchId),
      {
        params,
      },
    );
  }

  getByUser(
    organizationId: string,
    userId: string,
    parameters: GetUserBranchAssignmentsParameters,
  ): Observable<PagedResponse<BranchUserAssignment>> {
    let params = new HttpParams()
      .set('pageNumber', parameters.pageNumber)
      .set('pageSize', parameters.pageSize)
      .set('sortBy', parameters.sortBy)
      .set('sortDirection', parameters.sortDirection);

    if (parameters.status) {
      params = params.set('status', parameters.status);
    }

    if (parameters.role) {
      params = params.set('role', parameters.role);
    }

    if (parameters.assignmentType) {
      params = params.set('assignmentType', parameters.assignmentType);
    }

    return this.http.get<PagedResponse<BranchUserAssignment>>(
      [
        this.apiConfig.baseUrl,
        'organizations',
        organizationId,
        'users',
        userId,
        'branch-assignments',
      ].join('/'),
      {
        params,
      },
    );
  }

  suspend(
    organizationId: string,
    assignmentId: string,
    request: ChangeBranchUserAssignmentStatusRequest,
  ): Observable<void> {
    return this.changeStatus(organizationId, assignmentId, 'suspend', request);
  }

  reactivate(
    organizationId: string,
    assignmentId: string,
    request: ChangeBranchUserAssignmentStatusRequest,
  ): Observable<void> {
    return this.changeStatus(organizationId, assignmentId, 'reactivate', request);
  }

  end(
    organizationId: string,
    assignmentId: string,
    request: ChangeBranchUserAssignmentStatusRequest,
  ): Observable<void> {
    return this.changeStatus(organizationId, assignmentId, 'end', request);
  }

  private changeStatus(
    organizationId: string,
    assignmentId: string,
    action: 'suspend' | 'reactivate' | 'end',
    request: ChangeBranchUserAssignmentStatusRequest,
  ): Observable<void> {
    return this.http.post<void>(
      `${this.getAssignmentsUrl(organizationId)}/${assignmentId}/${action}`,
      request,
    );
  }

  private getBranchAssignmentsUrl(organizationId: string, branchId: string): string {
    return [
      this.apiConfig.baseUrl,
      'organizations',
      organizationId,
      'branches',
      branchId,
      'assignments',
    ].join('/');
  }

  private getAssignmentsUrl(organizationId: string): string {
    return [this.apiConfig.baseUrl, 'organizations', organizationId, 'branch-assignments'].join(
      '/',
    );
  }
}
