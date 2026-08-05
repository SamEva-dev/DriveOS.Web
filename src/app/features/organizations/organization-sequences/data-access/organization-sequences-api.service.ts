import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG, ApiConfig } from '../../../../core/config/api-config';
import {
  OrganizationSequence,
  OrganizationSequenceListItem,
} from '../models/organization-sequence.model';
import {
  ChangeOrganizationSequenceStatusRequest,
  CreateOrganizationSequenceRequest,
  ReserveOrganizationSequenceNumberRequest,
} from '../models/organization-sequence.requests';

@Injectable({ providedIn: 'root' })
export class OrganizationSequencesApiService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject<ApiConfig>(API_CONFIG);

  getAll(
    organizationId: string,
    branchId: string | null,
  ): Observable<readonly OrganizationSequenceListItem[]> {
    let params = new HttpParams();
    if (branchId) params = params.set('branchId', branchId);
    return this.http.get<readonly OrganizationSequenceListItem[]>(this.baseUrl(organizationId), {
      params,
    });
  }

  getById(organizationId: string, sequenceId: string): Observable<OrganizationSequence> {
    return this.http.get<OrganizationSequence>(`${this.baseUrl(organizationId)}/${sequenceId}`);
  }

  create(
    organizationId: string,
    request: CreateOrganizationSequenceRequest,
  ): Observable<{ readonly id: string }> {
    return this.http.post<{ readonly id: string }>(this.baseUrl(organizationId), request);
  }

  reserve(
    organizationId: string,
    request: ReserveOrganizationSequenceNumberRequest,
  ): Observable<{ readonly value: string }> {
    return this.http.post<{ readonly value: string }>(
      `${this.baseUrl(organizationId)}/reserve`,
      request,
    );
  }

  suspend(
    organizationId: string,
    sequenceId: string,
    request: ChangeOrganizationSequenceStatusRequest,
  ): Observable<void> {
    return this.http.post<void>(`${this.baseUrl(organizationId)}/${sequenceId}/suspend`, request);
  }

  reactivate(
    organizationId: string,
    sequenceId: string,
    request: ChangeOrganizationSequenceStatusRequest,
  ): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl(organizationId)}/${sequenceId}/reactivate`,
      request,
    );
  }

  archive(
    organizationId: string,
    sequenceId: string,
    request: ChangeOrganizationSequenceStatusRequest,
  ): Observable<void> {
    return this.http.post<void>(`${this.baseUrl(organizationId)}/${sequenceId}/archive`, request);
  }

  private baseUrl(organizationId: string): string {
    return `${this.apiConfig.baseUrl}/organizations/${organizationId}/sequences`;
  }
}
