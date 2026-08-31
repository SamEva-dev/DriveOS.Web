import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG, ApiConfig } from '../../../core/config/api-config';
import {
  RegulatoryIntegrationConnection,
  RegulatorySubmissionDetail,
  RegulatorySubmissionPage,
  RegulatorySynchronizationSummary,
} from '../models/regulatory-integrations.models';

@Injectable({ providedIn: 'root' })
export class RegulatoryIntegrationsApiService {
  private readonly http = inject(HttpClient);
  private readonly config = inject<ApiConfig>(API_CONFIG);
  private readonly baseUrl = this.config.baseUrl.replace(/\/$/, '');

  getConnections(organizationId: string): Observable<readonly RegulatoryIntegrationConnection[]> {
    return this.http.get<readonly RegulatoryIntegrationConnection[]>(
      `${this.baseUrl}/organizations/${organizationId}/regulatory-integrations/`,
    );
  }

  createConnection(
    organizationId: string,
    request: {
      branchId: string | null;
      countryCode: string;
      providerCode: string;
      externalAccountReference: string;
      secretReference: string | null;
    },
  ): Observable<{ id: string }> {
    return this.http.post<{ id: string }>(
      `${this.baseUrl}/organizations/${organizationId}/regulatory-integrations/`,
      request,
    );
  }

  updateConnection(
    organizationId: string,
    connectionId: string,
    request: {
      externalAccountReference: string;
      secretReference: string | null;
      expectedRevision: number;
    },
  ): Observable<void> {
    return this.http.put<void>(
      `${this.baseUrl}/organizations/${organizationId}/regulatory-integrations/${connectionId}`,
      request,
    );
  }

  changeConnectionStatus(
    organizationId: string,
    connectionId: string,
    status: string,
    expectedRevision: number,
  ): Observable<void> {
    return this.http.put<void>(
      `${this.baseUrl}/organizations/${organizationId}/regulatory-integrations/${connectionId}/status`,
      { status, expectedRevision },
    );
  }

  getSummary(): Observable<RegulatorySynchronizationSummary> {
    return this.http.get<RegulatorySynchronizationSummary>(
      `${this.baseUrl}/regulatory-integrations/training-record-submissions/summary`,
      {
        params: new HttpParams()
          .set('countryCode', 'FR')
          .set('providerCode', 'fr-livret-numerique'),
      },
    );
  }

  getSubmissions(status?: string): Observable<RegulatorySubmissionPage> {
    let params = new HttpParams()
      .set('countryCode', 'FR')
      .set('providerCode', 'fr-livret-numerique')
      .set('page', 1)
      .set('pageSize', 50);
    if (status) params = params.set('status', status);
    return this.http.get<RegulatorySubmissionPage>(
      `${this.baseUrl}/regulatory-integrations/training-record-submissions/`,
      { params },
    );
  }

  getSubmission(id: string): Observable<RegulatorySubmissionDetail> {
    return this.http.get<RegulatorySubmissionDetail>(
      `${this.baseUrl}/regulatory-integrations/training-record-submissions/${id}`,
    );
  }

  reconcile(id: string): Observable<RegulatorySubmissionDetail | void> {
    return this.http.post<RegulatorySubmissionDetail | void>(
      `${this.baseUrl}/regulatory-integrations/training-record-submissions/${id}/reconcile`,
      {},
    );
  }

  retry(id: string): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/regulatory-integrations/training-record-submissions/${id}/retry`,
      {},
    );
  }
}
